import React from 'react';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2 p-3"
    >
      <div className="flex space-x-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
    </motion.div>
  );
}
