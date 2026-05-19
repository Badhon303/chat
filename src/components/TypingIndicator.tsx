'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-2">
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm max-w-fit"
        style={{ background: 'var(--bg-bubble-received)' }}
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--text-secondary)' }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
