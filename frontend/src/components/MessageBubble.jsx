import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github as codeStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { motion } from 'framer-motion';

export default function MessageBubble({ message, onEdit, isEditing, editingText, setEditingText, onEditSubmit, loading }) {
  const ref = useRef();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isUser = message.role === 'user';

  const handleCopyCode = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyMsg = () => {
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      ref={ref}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className={`group flex flex-col w-full max-w-[90%] md:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Edit mode */}
        {isEditing && isUser && (
          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-200 dark:border-yellow-700 w-full">
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="w-full p-2 border border-yellow-300 dark:border-yellow-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm mb-2"
              rows="3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => onEditSubmit(editingText)}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Save & Resend
              </button>
              <button
                onClick={() => onEdit(null)}
                className="px-3 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Message bubble */}
        {isUser ? (
          <div className="w-fit px-5 py-3.5 rounded-[1.5rem] rounded-tr-sm bg-gray-100 dark:bg-[#2e2f30] text-gray-800 dark:text-gray-200 border border-transparent self-end text-[16px]">
            <ReactMarkdown
              className="break-words whitespace-pre-wrap"
              components={{
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                a: ({ node, ...props }) => <a className={isUser ? 'underline' : 'text-blue-600 dark:text-blue-400 underline'} {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-2">
                    <table className="border-collapse border border-gray-400 dark:border-gray-600" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-gray-400 dark:border-gray-600 px-2 py-1 bg-gray-200 dark:bg-gray-700" {...props} />
                ),
                td: ({ node, ...props }) => <td className="border border-gray-400 dark:border-gray-600 px-2 py-1" {...props} />,
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <div className="relative my-2">
                      <CopyToClipboard text={String(children).replace(/\n$/, '')} onCopy={handleCopyCode}>
                        <button className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-700 dark:bg-gray-800 opacity-70 hover:opacity-100 text-white transition-opacity" title="Copy code">
                          {copiedCode ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          )}
                        </button>
                      </CopyToClipboard>
                      <SyntaxHighlighter
                        style={codeStyle}
                        language={match[1]}
                        PreTag="div"
                        className="rounded !bg-gray-900 !m-0"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className={`bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm ${isUser ? 'text-gray-900' : 'text-light-text dark:text-dark-text'}`} {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-gray-400 dark:border-gray-600 pl-3 my-2 opacity-70 italic" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex gap-4 w-full md:max-w-[85%] self-start px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-transparent bg-gradient-to-tr from-blue-500 to-purple-500 overflow-hidden text-white font-extrabold text-lg">
              V
            </div>
            <div className="flex-1 text-gray-800 dark:text-gray-200 pt-1 text-[16px]">
              <ReactMarkdown
                className="break-words prose prose-lg dark:prose-invert max-w-none"
                components={{
                  p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  a: ({ node, ...props }) => <a className="text-blue-600 dark:text-blue-400 underline" {...props} />,
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-4 bg-light-surface dark:bg-dark-surface rounded-lg">
                      <table className="border-collapse w-full" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold" {...props} />
                  ),
                  td: ({ node, ...props }) => <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm" {...props} />,
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative my-4 rounded-xl overflow-hidden group border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex bg-gray-100 dark:bg-gray-900 px-4 py-2 text-xs font-medium text-gray-500 justify-between items-center border-b border-gray-200 dark:border-gray-800">
                          <span>{match[1]}</span>
                          <CopyToClipboard text={String(children).replace(/\n$/, '')} onCopy={handleCopyCode}>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                              {copiedCode ? (
                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg><span className="text-green-500">Copied!</span></>
                              ) : (
                                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy code</span></>
                              )}
                            </button>
                          </CopyToClipboard>
                        </div>
                        <SyntaxHighlighter
                          style={codeStyle}
                          language={match[1]}
                          PreTag="div"
                          className="!bg-light-surface dark:!bg-dark-surface !m-0 p-4 text-sm"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={`bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm text-pink-600 dark:text-pink-400`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500 rounded-r-lg p-3 my-4 italic text-gray-700 dark:text-gray-300" {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Action buttons below message */}
        <div className={`flex gap-1 mt-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${isUser ? 'justify-end pr-3' : 'justify-start ml-12'} h-8`}>
          {!isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex gap-1"
            >
              {/* Copy button */}
              <CopyToClipboard text={message.content} onCopy={handleCopyMsg}>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-full text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700 transition-all opacity-60 hover:opacity-100"
                  title="Copy"
                >
                  {copiedMsg ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                </button>
              </CopyToClipboard>

              {/* Edit button (only for user messages) */}
              {isUser && (
                <button
                  onClick={() => !loading && onEdit(message.content)}
                  disabled={loading}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-black dark:text-white transition-all 
                    ${loading 
                      ? 'opacity-20 cursor-not-allowed' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 opacity-60 hover:opacity-100'}`}
                  title={loading ? "Cannot edit while AI is thinking" : "Edit"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
