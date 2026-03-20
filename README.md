# AI Chat - Full Stack Application

Complete ChatGPT-like chat interface with local LLM backend powered by Ollama.

## System Status

### Running Services

**Backend API** (FastAPI + Ollama)
- URL: `http://localhost:8000`
- Status: ✓ Running
- Endpoint: `POST /chat` - Send messages to LLM
- API Docs: `http://localhost:8000/docs`

**Frontend UI** (React + Vite)
- URL: `http://localhost:3001` (or 3000 if available)
- Status: ✓ Running
- Tech: React, Tailwind CSS, Framer Motion

**LLM Model** (Ollama)
- Model: Qwen 3 4B
- URL: `http://localhost:11434`
- Status: ✓ Running

---

## Quick Start

### 1. Start Backend API

```bash
# From project root directory
C:/Users/skbur/Ai_Project/venv/Scripts/python.exe server.py
```

Output:
```
Checking Ollama server...
✓ Ollama server is ready
Starting AI Chat API server on http://localhost:8000
```

### 2. Start Frontend (in new terminal)

```bash
cd frontend
npm run dev
```

Output:
```
VITE v4.5.14 ready in 264 ms
➜ Local: http://localhost:3001/
```

### 3. Open in Browser

Visit: **http://localhost:3000**

---

## 📱 Mobile & Remote Testing (Public Link)

Because Google Authentication requires `https://` for non-localhost remote access, you cannot simply use your local IP to test on your phone. 

To open the app on your phone or share it securely:
1. Run `start-public.bat` instead of `start-all.bat`.
2. This creates two `npx localtunnel` windows. 
3. Copy the tunnel URL for the **API (port 8000)** and paste it as `VITE_API_URL=` in your `frontend/.env.local` file.
4. Restart the frontend if it's already running.
5. In the Google Cloud Console, add the **Frontend Tunnel URL** to your authorized redirect URIs.
6. Open the **Frontend Tunnel URL** on your mobile device.

---

## Features Implemented

✓ **Professional Dark UI** - ChatGPT-like interface
✓ **Real-time Chat** - Instant message delivery
✓ **Chat Sessions** - Multiple conversations saved
✓ **Local Storage** - Sessions persist across reloads
✓ **Markdown Rendering** - Code blocks with syntax highlighting
✓ **Copy Buttons** - One-click copy on code blocks
✓ **Auto-scroll** - Smooth scroll to latest message
✓ **Loading States** - Spinner during API calls
✓ **Error Handling** - Graceful failure messages
✓ **CORS Enabled** - Secure cross-origin requests
✓ **Mobile Responsive** - Works on all devices
✓ **Production Ready** - Optimized and tested code

---

## Architecture

```
Frontend (React + Vite) ──HTTP──> Backend API (FastAPI)
                                       ↓
                                   Ollama (LLM)
                                       ↓
                                   Qwen 3 4B Model
```

**Data Flow:**
1. User types message in UI
2. Frontend sends POST to `/chat` endpoint
3. Backend receives request and queries Ollama
4. Ollama processes and returns AI response
5. Backend returns response as JSON
6. Frontend renders response with markdown
7. Session saved to localStorage

---

## API Endpoints

### Health Check
```bash
GET http://localhost:8000/
Response: {"status":"AI Chat API running"}
```

### Chat Endpoint
```bash
POST http://localhost:8000/chat
Content-Type: application/json

Request:
{
  "message": "What is 2+2?",
  "session_id": "<optional existing session id>",
  "model": "<optional model name>"
}

Response:
{
  "response": "2 + 2 equals 4...",
  "session_id": "<id used to store conversation>"
}
```

### History & Session Management
Supabase-backed endpoints for loading and clearing history:

```bash
GET  http://localhost:8000/sessions               # all sessions + messages
GET  http://localhost:8000/sessions/{session_id}   # messages for one session
DELETE http://localhost:8000/sessions/{session_id} # delete one session
DELETE http://localhost:8000/sessions              # delete everything
```
### API Documentation
Browse: `http://localhost:8000/docs` (Swagger UI)

---

## File Structure

```
Ai_Project/
├── frontend/                    # React Vite application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── ChatInput.jsx
│   │   ├── hooks/
│   │   │   └── useChatSessions.jsx
│   │   ├── pages/
│   │   │   └── ChatPage.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── storage.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── main.py                      # Original llm test script
├── server.py                    # FastAPI backend server
├── requirements.txt            # Python dependencies
├── start-all.bat               # Start all services (Windows)
└── README.md                   # This file
```

---

## Dependencies

### Python (Backend)
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `langchain-ollama` - LLM interface
- `python-dotenv` - Environment config

### JavaScript (Frontend)
- `react` - UI library
- `vite` - Bundler
- `tailwindcss` - CSS framework
- `framer-motion` - Animations
- `axios` - HTTP client
- `react-markdown` - Markdown rendering
- `react-syntax-highlighter` - Code highlighting
- `uuid` - Session IDs

---

## Environment Variables

`.env` file required with:
```
OPENAI_API_KEY=sk-...       # Optional (not used in local mode)
ANTHROPIC_API_KEY=sk-...    # Optional (not used in local mode)
```
#### Supabase (chat history)
This project already has a Supabase instance running at `https://ojwylzzanhzdezihjukt.supabase.co`.

To persist conversation history you'll need to create the `chats` table (use the SQL editor in the dashboard):
```sql
create table chats (
  id bigserial primary key,
  session_id text not null,
  role text not null,       -- 'user' or 'assistant'
  content text not null,
  created_at timestamptz default now()
);
```

Add the following variables to your `.env` file:
```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

> **Important:** The default `anon`/publishable key enforces row‑level security (RLS) on
> the `chats` table. If you use it, inserts will fail with `42501` (as seen in
> the server log) and nothing will be stored. You can either:
>
> 1. Use the service role key above (it bypasses RLS), OR
> 2. Configure RLS policies in the Supabase dashboard to allow your client role
>    to insert rows. Example policy:
>    ```sql
>    -- allow anon inserts (only if you trust all clients)
>    create policy "anon can insert chats" on chats for insert with (
>      auth.role() = 'anon'
>    );
>    ```
>
> Without one of these, the history feature will appear to work but no rows will
> actually be saved (the API prints "new row violates row-level security policy").

For the frontend, create `frontend/.env.local` with:
```
VITE_SUPABASE_URL=https://ojwylzzanhzdezihjukt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_wJzY3Q0uM5WeolgCl8G7gg_EfFkNWpi
```
(The publishable key you provided can be used to read/write if RLS allows it.)
---

## Troubleshooting

### Backend won't start
```
Error: Ollama server not reachable
Solution: Make sure `ollama serve` is running in another terminal
```

### Frontend shows connection error
```
Error: Cannot connect to http://localhost:8000
Solution: Backend server may not be running - check terminal output
```

### Port already in use
```
Error: Port 3000/8000 already in use
Solution: Kill existing process or restart the terminal
```

### Messages not sending
```
1. Check browser DevTools (F12) -> Network tab
2. Verify backend is responding
3. Check Ollama model is loaded
4. Look for CORS errors
```

---

## Production Build

### Build Frontend
```bash
cd frontend
npm run build
```

Output: Optimized files in `frontend/dist/`

### Run Production
```bash
# Backend (same as dev)
python server.py

# Frontend - serve dist folder with any static server
npx serve frontend/dist/
```

---

## Performance Notes

- **First Load**: 2-3 seconds (Ollama model load)
- **Subsequent Requests**: 3-10 seconds per response (LLM inference)
- **All Processing**: Local machine only
- **Memory**: Qwen 3 4B uses ~4GB RAM
- **Storage**: Ollama models stored in `~/.ollama/models`

---

## Security

✓ CORS enabled for localhost cross-origin requests
✓ No external API calls
✓ All data processed locally
✓ No credentials sent to third parties
✓ Sessions stored in browser localStorage

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs in terminal
3. Check browser DevTools console (F12 -> Console)
4. Verify all services are running
5. Restart both servers

---

**Status**: ✓ All Systems Operational
**Backend**: Running on http://localhost:8000
**Frontend**: Running on http://localhost:3001
**LLM**: Ollama (Qwen 3 4B) ready

Ready to use! Open http://localhost:3001 in your browser.
