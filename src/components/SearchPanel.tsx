'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { Search, X, ArrowDown, ArrowUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPanel() {
  const { isSearchOpen, setIsSearchOpen, messages } = useChatStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof messages>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const found = messages.filter(
      m => m.content && !m.isDeleted && m.content.toLowerCase().includes(q)
    );
    setResults(found);
    setActiveIndex(0);
  }, [query, messages]);

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-400/50');
      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400/50'), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b overflow-hidden"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
            {results.length > 0 && (
              <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                {activeIndex + 1}/{results.length}
              </span>
            )}
            <div className="flex items-center gap-1">
              {results.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const newIdx = (activeIndex - 1 + results.length) % results.length;
                      setActiveIndex(newIdx);
                      scrollToMessage(results[newIdx].id);
                    }}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const newIdx = (activeIndex + 1) % results.length;
                      setActiveIndex(newIdx);
                      scrollToMessage(results[newIdx].id);
                    }}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
