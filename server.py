from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_ollama import ChatOllama
import os
import requests
import time
import subprocess
import threading
import queue
from pathlib import Path

# openai for fallback when Ollama not available
import openai

# helpers for Supabase HTTP REST calls
import json
from uuid import uuid4
from collections import defaultdict

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path, override=True)

# supabase configuration for REST API
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ Supabase URL or key missing; history storage will be disabled.")
    SUPABASE_ENABLED = False
    SUPABASE_HEADERS = {}
else:
    SUPABASE_ENABLED = True
    SUPABASE_HEADERS = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

# convenience helpers to interact with the `chats` table via PostgREST

def _supabase_insert_chat(session_id: str, role: str, content: str, user_id: str = None):
    if not SUPABASE_ENABLED:
        return
    payload = {"session_id": session_id, "role": role, "content": content}
    if user_id:
        payload["user_id"] = user_id
    resp = requests.post(f"{SUPABASE_URL}/rest/v1/chats", headers=SUPABASE_HEADERS, json=payload)
    try:
        resp.raise_for_status()
    except Exception as e:
        print("Supabase insert failed", resp.status_code, resp.text, e)
    else:
        print("Supabase insert succeeded", resp.status_code)


def _supabase_query(where_clause="", order="created_at", ascending=True):
    if not SUPABASE_ENABLED:
        return []
    # build query params for supabase REST (RLS not considered here)
    url = f"{SUPABASE_URL}/rest/v1/chats?select=*&order={order}.{'asc' if ascending else 'desc'}"
    if where_clause:
        url += f"&{where_clause}"
    resp = requests.get(url, headers=SUPABASE_HEADERS)
    resp.raise_for_status()
    return resp.json()


def _supabase_delete(where_clause=""):
    if not SUPABASE_ENABLED:
        return []
    url = f"{SUPABASE_URL}/rest/v1/chats" + (f"?{where_clause}" if where_clause else "")
    resp = requests.delete(url, headers=SUPABASE_HEADERS)
    resp.raise_for_status()
    return resp.json()

app = FastAPI(title="AI Chat API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # localhost only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Ollama model with readiness check
base_url = "http://localhost:11434"
print("Checking Ollama server...")
OLLAMA_AVAILABLE = False
for attempt in range(5):
    try:
        resp = requests.get(base_url)
        if resp.status_code == 200:
            print("✓ Ollama server is ready")
            OLLAMA_AVAILABLE = True
            break
    except requests.RequestException:
        pass
    print(f"  Waiting for Ollama... (attempt {attempt+1})")
    time.sleep(1)
if not OLLAMA_AVAILABLE:
    print("⚠️ Ollama server not reachable at", base_url, "- continuing without LLM backend.")



def get_local_models():
    """Return list of model names installed in local Ollama."""
    try:
        output = subprocess.check_output(["ollama", "list"], stderr=subprocess.DEVNULL, text=True)
        models = []
        for line in output.splitlines()[1:]:  # skip header
            parts = line.strip().split()
            if parts:
                models.append(parts[0])
        return models
    except Exception:
        # if ollama not available or command fails, fall back to static list
        return [
            "qwen3:4b",
            "deepseek-r1:8b",
            "qwen:latest",
            "gpt-oss:20b",
        ]


@app.get("/models")
def get_models():
    """Return list of models currently available via the Ollama CLI."""
    models = get_local_models()
    return {"models": models}


@app.get("/status")
def get_status():
    """Return the status of Ollama server and available models."""
    models = get_local_models() if OLLAMA_AVAILABLE else []
    return {
        "ollama_available": OLLAMA_AVAILABLE,
        "ollama_url": base_url,
        "models_available": models,
        "model_count": len(models),
        "status_message": f"✓ Ollama ready with {len(models)} model(s)" if OLLAMA_AVAILABLE and models else ("✓ Ollama ready (no models loaded yet)" if OLLAMA_AVAILABLE else "⚠️ Ollama not responding - using fallback mode")
    }


# Task queue components for processing LLM requests sequentially
task_queue = queue.Queue()
task_results = {}
worker_busy = False

def llm_worker():
    global worker_busy
    while True:
        task = task_queue.get()
        if task is None:
            break
        worker_busy = True
        
        task_id = task["task_id"]
        message = task["message"]
        model_to_use = task["model_to_use"]
        session_id = task["session_id"]
        user_id = task["user_id"]

        task_results[task_id] = {"status": "processing"}
        try:
            temp_llm = ChatOllama(model=model_to_use, base_url=base_url)
            result = temp_llm.invoke(message)
            response_text = result.content if hasattr(result, 'content') else str(result)
            
            _store_message(session_id, "assistant", response_text, user_id=user_id)
            task_results[task_id] = {"status": "done", "response": response_text, "session_id": session_id}
        except Exception as e:
            fallback = f"[Fallback error] {str(e)}"
            _store_message(session_id, "assistant", fallback, user_id=user_id)
            task_results[task_id] = {"status": "done", "response": fallback, "session_id": session_id}
        finally:
            worker_busy = False
            task_queue.task_done()

threading.Thread(target=llm_worker, daemon=True).start()




class ChatRequest(BaseModel):
    message: str
    model: str = None  # optional parameter
    session_id: str = None  # allows client to specify existing session
    user_id: str = None  # the logged-in user's ID


class ChatResponse(BaseModel):
    response: str
    session_id: str = None
    task_id: str = None
    status: str = None


@app.get("/")
def root():
    return {"status": "AI Chat API running"}


def _store_message(session_id: str, role: str, content: str, user_id: str = None):
    """Insert a message row into Supabase via REST API."""
    if not session_id:
        session_id = str(uuid4())
    _supabase_insert_chat(session_id, role, content, user_id=user_id)
    return session_id


@app.post("/chat")
def chat(request: ChatRequest, req: Request) -> ChatResponse:
    """
    Main chat endpoint.  Stores both the user message and the model response in Supabase.
    """
    try:
        message = request.message
        # Get user_id from request body first, fall back to header
        user_id = request.user_id or req.headers.get("x-user-id")
        print(f"[DEBUG] user_id = {user_id}")

        # Truncate very long messages to avoid overwhelming the model
        if len(message) > 100000:
            message = message[:100000] + "\n\n[Message truncated to avoid overflow...]"

        session_id = request.session_id or str(uuid4())

        # record the incoming user message IMMEDIATELY so it persists across refreshes
        _store_message(session_id, "user", message, user_id=user_id)

        if not OLLAMA_AVAILABLE:
            # try OpenAI as a fallback if API key is configured
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key:
                try:
                    # use new OpenAI client interface (>=1.0.0)
                    client = openai.OpenAI(api_key=openai_key)
                    resp = client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": message}],
                        temperature=0.7,
                    )
                    # the response structure mirrors previous version
                    response_text = resp.choices[0].message["content"]
                    _store_message(session_id, "assistant", response_text, user_id=user_id)
                    return ChatResponse(response=response_text, session_id=session_id)
                except Exception as e:
                    fallback = f"[Fallback error] {str(e)}"
            else:
                fallback = "[Offline mode] Ollama server not reachable. This is a placeholder response."
            # store assistant fallback for history
            _store_message(session_id, "assistant", fallback, user_id=user_id)
            return ChatResponse(response=fallback, session_id=session_id)

        model_to_use = request.model or os.getenv("DEFAULT_OLLAMA_MODEL", "qwen3:4b")
        # verify the model actually exists locally
        available = get_local_models()
        if model_to_use not in available:
            return ChatResponse(response=f"Error: model '{model_to_use}' not found locally.", session_id=session_id)
            
        # Enqueue the task for background processing
        task_id = str(uuid4())
        
        # If the worker is idle and queue is empty, it will process immediately
        if not worker_busy and task_queue.empty():
            initial_status = "processing"
        else:
            initial_status = "queued"
            
        task_results[task_id] = {"status": initial_status}
        task_queue.put({
            "task_id": task_id,
            "message": message,
            "model_to_use": model_to_use,
            "session_id": session_id,
            "user_id": user_id
        })

        return ChatResponse(response="Queued...", session_id=session_id, task_id=task_id, status=initial_status)
    except Exception as e:
        return ChatResponse(response=f"Error processing request: {str(e)}")


@app.get("/chat/status/{task_id}")
def chat_status(task_id: str):
    """Poll the status of a queued chat response."""
    return task_results.get(task_id, {"status": "not_found"})


@app.get("/sessions")
def get_all_sessions(req: Request):
    """Return all sessions for the current user, grouped by session_id."""
    user_id = req.headers.get("x-user-id")
    try:
        where = f"user_id=eq.{user_id}" if user_id else ""
        data = _supabase_query(where_clause=where, order="created_at", ascending=True)
    except Exception as e:
        return {"error": str(e)}
    sessions = defaultdict(lambda: {"id": None, "messages": []})
    for row in data:
        sid = row.get("session_id")
        sessions[sid]["id"] = sid
        sessions[sid]["messages"].append({
            "role": row.get("role"),
            "content": row.get("content"),
            "created_at": row.get("created_at"),
        })
    return sessions


@app.get("/sessions/{session_id}")
def get_session(session_id: str, req: Request):
    user_id = req.headers.get("x-user-id")
    try:
        url = f"{SUPABASE_URL}/rest/v1/chats?select=*&session_id=eq.{session_id}&order=created_at.asc"
        if user_id:
            url += f"&user_id=eq.{user_id}"
        data = requests.get(url, headers=SUPABASE_HEADERS).json()
    except Exception as e:
        return {"error": str(e)}
    return {"messages": [{"role": r.get("role"), "content": r.get("content"), "created_at": r.get("created_at")} for r in data]}


@app.delete("/sessions/{session_id}")
def delete_session(session_id: str, req: Request):
    user_id = req.headers.get("x-user-id")
    try:
        where = f"session_id=eq.{session_id}"
        if user_id:
            where += f"&user_id=eq.{user_id}"
        _supabase_delete(where)
    except Exception as e:
        return {"error": str(e)}
    return {"status": "ok"}


@app.delete("/sessions")
def delete_all_sessions(req: Request):
    user_id = req.headers.get("x-user-id")
    try:
        where = f"user_id=eq.{user_id}" if user_id else ""
        _supabase_delete(where)
    except Exception as e:
        return {"error": str(e)}
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    print("Starting AI Chat API server on http://localhost:8000")
    print("Frontend should run on http://localhost:3000 or http://localhost:3001")
    uvicorn.run(app, host="0.0.0.0", port=8000)
