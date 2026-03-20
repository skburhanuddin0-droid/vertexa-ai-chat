import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ messages, loading, queueStatus, onEditMessage, editingIdx, editingText, setEditingText, onEditSubmit }) {
  const bottomRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto bg-light-bg dark:bg-dark-bg scroll-smooth">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-8">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center text-center space-y-6 pt-24 pb-16"
          >
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse-glow shadow-lg">
              <span className="text-3xl text-white">✨</span>
            </div>
            <h1 className="text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Hello, how can I help?
            </h1>
          </motion.div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              onEdit={(content) => onEditMessage(idx, content !== null ? msg.content : null)}
              isEditing={editingIdx === idx && msg.role === 'user'}
              editingText={editingIdx === idx ? editingText : ''}
              setEditingText={setEditingText}
              onEditSubmit={onEditSubmit}
              loading={loading}
            />
          ))
        )}
        {loading && !queueStatus && <TypingIndicator />}
        {queueStatus && (
          <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm italic w-fit ml-4 border border-blue-100 dark:border-blue-800 shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            {queueStatus}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
