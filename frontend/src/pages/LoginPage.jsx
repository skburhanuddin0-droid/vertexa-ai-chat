import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';

export default function LoginPage() {
    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                },
            });
            if (error) console.error('Error logging in:', error.message);
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-[#1e1f20] dark:to-black text-light-text dark:text-dark-text transition-colors duration-500 px-4 relative overflow-hidden">
            {/* Subtle decorative glows behind the card */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/20 dark:bg-blue-900/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="w-full max-w-lg p-10 bg-white/70 dark:bg-[#2e2f30]/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl flex flex-col items-center border border-white/50 dark:border-gray-700/50 z-10"
            >
                <h1 className="text-5xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2 text-center mt-2">
                    VERTEXA
                </h1>

                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center mt-2">
                    Welcome to AI Chat
                </h2>

                <p className="text-gray-600 dark:text-gray-400 text-center mb-10 text-lg px-2">
                    Sign in to start chatting with your AI assistant.
                </p>

                <motion.button
                    onClick={handleGoogleLogin}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center justify-center gap-4 bg-white dark:bg-[#1a1a1c] hover:bg-gray-50 dark:hover:bg-black text-gray-800 dark:text-gray-200 font-medium py-4 px-6 rounded-full border border-gray-200 dark:border-gray-800 transition-all shadow-md hover:shadow-lg"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </motion.button>
            </motion.div>
        </div>
    );
}
