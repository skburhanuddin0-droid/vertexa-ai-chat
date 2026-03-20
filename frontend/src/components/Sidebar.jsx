import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../utils/supabaseClient';

export default function Sidebar({
  sessions,
  activeId,
  setActiveId,
  createSession,
  deleteSession,
  availableModels = [],
  selectedModel,
  setSelectedModel,
}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-[#f0f4f9] dark:bg-[#1e1f20] text-light-text dark:text-dark-text border-r border-transparent dark:border-gray-800 transition-colors">
      {/* Header */}
      <div className="p-4 space-y-4 pt-6">
        <div className="flex justify-center mb-2 px-2">
          <h1 className="text-2xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            VERTEXA
          </h1>
        </div>
        <motion.button
          onClick={createSession}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-start space-x-3 px-5 py-3 rounded-full bg-white dark:bg-[#2e2f30] hover:bg-gray-100 dark:hover:bg-[#3e3f40] text-gray-700 dark:text-gray-200 font-medium transition-colors cursor-pointer border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <span className="text-xl leading-none block mb-1 text-gray-500 max-w-[12px]">+</span>
          <span>New chat</span>
        </motion.button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {Object.keys(sessions).length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-500 text-sm py-8 font-medium">No recent chats</p>
        ) : (
          Object.entries(sessions).map(([id, session]) => (
            <div
              key={id}
              onClick={() => {
                setActiveId(id);
                setShowMobileMenu(false);
              }}
              className={`group px-4 py-2.5 rounded-full cursor-pointer transition-all flex items-center justify-between space-x-2 ${id === activeId
                ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-medium'
                : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                }`}
            >
              <span className="truncate text-[15px] flex-1">
                {session.messages?.[0]?.content?.substring(0, 25) || 'New Chat'}{' '}
                {session.messages?.[0]?.content?.length > 25 ? '...' : ''}
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  deleteSession(id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => {
              Object.keys(sessions).forEach(deleteSession);
              setShowMobileMenu(false);
            }}
            className="text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Clear chats
          </button>
          <ThemeToggle />
        </div>

        {user && (
          <div className="flex items-center justify-between bg-white dark:bg-[#2e2f30] p-2 rounded-xl shadow-sm border border-transparent dark:border-gray-700 mt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col overflow-hidden min-w-0 pr-2">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {user.user_metadata?.full_name || 'User'}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-dark-surface hover:bg-gray-100 dark:hover:bg-gray-800 text-light-text dark:text-dark-text"
      >
        ☰
      </motion.button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden md:flex md:w-64 md:flex-shrink-0 md:border-r-2 md:border-gray-300 md:dark:border-gray-800"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.div
        animate={{ opacity: showMobileMenu ? 1 : 0, pointerEvents: showMobileMenu ? 'auto' : 'none' }}
        className="fixed inset-0 z-40 md:hidden bg-black/50"
        onClick={() => setShowMobileMenu(false)}
      >
        <motion.div
          animate={{ x: showMobileMenu ? 0 : -280 }}
          className="w-64 h-full"
          onClick={e => e.stopPropagation()}
        >
          <SidebarContent />
        </motion.div>
      </motion.div>
    </>
  );
}
