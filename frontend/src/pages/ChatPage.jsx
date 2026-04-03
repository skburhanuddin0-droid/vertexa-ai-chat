import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import useChatSessions from '../hooks/useChatSessions';
import { api } from '../utils/api';

export default function ChatPage({ session }) {
  const userId = session?.user?.id;
  const {
    sessions,
    activeId,
    setActiveId,
    createSession,
    deleteSession,
    addMessage,
    truncateSession,
    loaded,
  } = useChatSessions();

  const [loading, setLoading] = useState(false);
  const STATIC_MODELS = ['qwen3:4b', 'deepseek-r1:8b', 'qwen:latest', 'gpt-oss:20b'];
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('model') || '');
  const [backendError, setBackendError] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Always start with a fresh blank session on load/login
  useEffect(() => {
    if (loaded && !activeId) {
      createSession();
    }
  }, [loaded, activeId]);

  // fetch server status and model list on startup
  useEffect(() => {
    // get server status
    api.get('/status').then(resp => {
      setServerStatus(resp.data);
    }).catch(err => {
      console.error('Failed to fetch server status', err);
      setServerStatus({ ollama_available: false, status_message: '❌ Backend unreachable' });
    });

    api.get('/models').then(resp => {
      const models = resp.data.models || [];
      setAvailableModels(models);
      if (!selectedModel && models.length > 0) {
        setSelectedModel(models[0]);
        localStorage.setItem('model', models[0]);
      }
    }).catch(err => {
      console.error('Failed to fetch models, using static list', err);
      setAvailableModels(STATIC_MODELS);
      if (!selectedModel) {
        setSelectedModel(STATIC_MODELS[0]);
        localStorage.setItem('model', STATIC_MODELS[0]);
      }
    });
  }, []);

  // persist selected model
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('model', selectedModel);
    }
  }, [selectedModel]);

  const handleEditMessage = (idx, content) => {
    if (content !== null) {
      setEditingIdx(idx);
      setEditingText(content);
    } else {
      setEditingIdx(null);
      setEditingText('');
    }
  };

  const handleEditSubmit = async (newText) => {
    if (!activeId || editingIdx === null) return;

    // Remove the edited message and all following messages from the session
    truncateSession(activeId, editingIdx);

    setEditingIdx(null);
    setEditingText('');

    // Send the new edited message (will be appended to the now-trimmed session)
    await handleSend(newText);
  };

  const handleSend = async text => {
    let currentSessionId = activeId;
    if (!currentSessionId) {
      currentSessionId = createSession();
    }
    const userMsg = { role: 'user', content: text };
    addMessage(currentSessionId, userMsg);

    setLoading(true);
    setQueueStatus(null);
    try {
      const resp = await api.post('/chat', { message: text, model: selectedModel, session_id: currentSessionId, user_id: userId });

      // Handle Queued or immediately Processing async response
      if (resp.data.status === 'queued' || resp.data.status === 'processing') {
        const taskId = resp.data.task_id;
        const assignedSessionId = resp.data.session_id;

        if (assignedSessionId && assignedSessionId !== currentSessionId) {
          setActiveId(assignedSessionId);
        }

        if (resp.data.status === 'queued') {
          setQueueStatus("GPU is occupied, your task is added to queue...");
        } else {
          setQueueStatus(null);
        }

        // Start polling for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResp = await api.get(`/chat/status/${taskId}`);
            const statusData = statusResp.data;

            if (statusData.status === 'processing') {
              setQueueStatus(prev => {
                if (prev && prev.includes('queue')) {
                  setTimeout(() => setQueueStatus(prevStatus => prevStatus === "Processing your request..." ? null : prevStatus), 2500);
                  return "Processing your request...";
                }
                return prev;
              });
            } else if (statusData.status === 'done' || statusData.status === 'error') {
              clearInterval(pollInterval);
              setQueueStatus(null);
              setLoading(false);

              // Use the session_id returned from the backend in the statusData, or fallback to assigned
              const targetSessionId = statusData.session_id || assignedSessionId || currentSessionId;

              if (statusData.status === 'error') {
                addMessage(targetSessionId, { role: 'assistant', content: `Error: ${statusData.error}` });
              } else {
                addMessage(targetSessionId, { role: 'assistant', content: statusData.response });
              }
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
            // Do NOT clear interval on general network errors (e.g. 429 Too Many Requests from ngrok)
            // It will just try again on the next tick
            if (pollErr.response && pollErr.response.status === 404) {
              clearInterval(pollInterval);
              setQueueStatus(null);
              setLoading(false);
              const targetSessionId = assignedSessionId || currentSessionId;
              addMessage(targetSessionId, { role: 'assistant', content: 'Error: Task not found on server.' });
            }
          }
        }, 4000);

        return; // Early return, loading remains true while polling
      }

      // Legacy fallback for immediate processing
      if (resp.data.session_id && resp.data.session_id !== currentSessionId) {
        setActiveId(resp.data.session_id);
      }
      const aiMsg = { role: 'assistant', content: resp.data.response };
      addMessage(resp.data.session_id || currentSessionId, aiMsg);
      setLoading(false);
    } catch (e) {
      const errMsg = { role: 'assistant', content: 'Error: failed to reach backend.' };
      addMessage(currentSessionId, errMsg);
      setBackendError('Cannot contact backend API');
      setLoading(false);
    }
  };

  const currentMessages = activeId ? sessions[activeId]?.messages || [] : [];

  return (
    <div className="flex h-full bg-light-bg dark:bg-dark-bg">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        setActiveId={setActiveId}
        createSession={createSession}
        deleteSession={deleteSession}
        availableModels={availableModels}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top App Bar */}
        <header className="sticky top-0 z-10 w-full flex items-center justify-between p-4 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 hidden sm:block">VERTEXA</h2>
          </div>
          <div className="flex items-center space-x-4">
            {serverStatus && (
              <div className={`text-xs px-2 py-1 rounded-full font-medium ${serverStatus.ollama_available
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                }`}>
                {serverStatus.ollama_available ? 'Online' : 'Offline'}
              </div>
            )}

            {availableModels.length > 0 && (
              <div className="relative group">
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  className="appearance-none bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg px-4 py-2 pr-8 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>
            )}
          </div>
        </header>

        {backendError && (
          <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 text-center py-2 text-sm mx-4 rounded-lg mt-2">
            {backendError}
          </div>
        )}
        <ChatWindow
          messages={currentMessages}
          loading={loading}
          queueStatus={queueStatus}
          onEditMessage={handleEditMessage}
          editingIdx={editingIdx}
          editingText={editingText}
          setEditingText={setEditingText}
          onEditSubmit={handleEditSubmit}
        />
        <ChatInput onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
}
