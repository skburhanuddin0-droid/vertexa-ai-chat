import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';

export default function ChatInput({ onSend, loading }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const textareaRef = useRef();
  const fileInputRef = useRef();
  const dropZoneRef = useRef();

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() || file) {
        submit();
      }
    }
  };

  useEffect(() => {
    if (!loading) textareaRef.current?.focus();
  }, [loading]);

  const handleFileSelect = async e => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDragActive(false);
    }
  };

  const handleDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const submit = async () => {
    if (text.trim() || file) {
      if (file) {
        setIsUploading(true);
        let publicUrl = null;

        try {
          // Get user ID
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id || 'anonymous';

          // Generate unique path
          const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = `${userId}/${fileName}`;

          // Upload to Supabase 
          const { error } = await supabase.storage
            .from('chat-files')
            .upload(filePath, file);

          if (error) throw error;

          // Get public URL
          const { data } = supabase.storage
            .from('chat-files')
            .getPublicUrl(filePath);

          publicUrl = data.publicUrl;
        } catch (err) {
          console.error('File upload failed:', err);
          // Proceed anyway but without publicUrl
        }

        const isTextFile = file.type.startsWith('text/') ||
          file.name.match(/\.(txt|js|py|jsx|tsx|ts|json|md|html|css|cpp|java|cs|go|rs|rb|php|xml|yaml|yml|sql|sh|bash)$/i);

        const fileLink = publicUrl ? `[Uploaded File: ${file.name}](${publicUrl})` : `[File: ${file.name}]`;

        if (isTextFile || file.type.includes('json') || file.type.includes('xml')) {
          const reader = new FileReader();
          reader.onload = event => {
            const fileContent = event.target.result;
            const message = `${fileLink} (Type: ${file.type || 'text'})
\n--- File Content ---\n${fileContent}\n--- End Content ---\n\n${text ? text : ''}`;

            onSend(message);
            clearInput();
            setIsUploading(false);
          };
          reader.readAsText(file);
        } else {
          // Send metadata for binary files (LLM can't natively read PDF/images without vision or external tools)
          const message = `${fileLink}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)}KB\n\n${text ? text : ''}`;
          onSend(message);
          clearInput();
          setIsUploading(false);
        }
      } else {
        onSend(text.trim());
        clearInput();
      }
    }
  };

  const clearInput = () => {
    setText('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 px-4 md:px-8 pb-4 pt-2 pointer-events-none z-20 bg-gradient-to-t from-light-bg dark:from-dark-bg via-light-bg/80 dark:via-dark-bg/80 to-transparent">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto pointer-events-auto w-full"
      >
        {file && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/80 px-4 py-3 rounded-t-3xl text-sm border border-b-0 border-gray-200 dark:border-gray-700 shadow-md mx-4 mb-[-16px] backdrop-blur-md">
            <span className="truncate text-gray-700 dark:text-gray-300 font-medium">📎 {file.name} ({(file.size / 1024).toFixed(1)}KB)</span>
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-red-500 font-bold ml-2 flex-shrink-0 transition-colors bg-gray-200 dark:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}
        <div
          ref={dropZoneRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex items-end gap-3 p-2.5 rounded-[2rem] shadow-lg border backdrop-blur-xl transition-all bg-white/90 dark:bg-[#1e1f20]/90 ${dragActive
            ? 'border-blue-500 scale-[1.02]'
            : 'border-gray-200 dark:border-gray-700 hover:shadow-xl'
            }`}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || isUploading}
            className="w-12 h-12 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 flex-shrink-0 transition-colors ml-1 mb-0.5"
            title="Attach file or drag & drop"
          >
            <span className="text-2xl leading-none font-light">＋</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading || isUploading}
            accept="*/*"
          />
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-gray-800 dark:text-gray-100 py-3.5 resize-none focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 max-h-40 text-[16px] leading-relaxed w-full min-h-[52px]"
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || isUploading}
            placeholder="Ask VERTEXA anything..."
          />
          <button
            onClick={submit}
            disabled={loading || isUploading || (!text.trim() && !file)}
            className={`w-12 h-12 flex flex-shrink-0 items-center justify-center rounded-full transition-all mr-1 mb-0.5 ${(text.trim() || file) && (!loading && !isUploading)
              ? 'bg-black dark:bg-white text-white dark:text-black shadow-md hover:scale-105'
              : 'bg-transparent text-gray-300 dark:text-gray-600'
              }`}
          >
            {(loading || isUploading) ? (
              <span className="inline-block animate-pulse text-xl">•••</span>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
