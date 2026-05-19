'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, X, Image as ImageIcon, Mic } from 'lucide-react';
import { useChatStore } from '@/store/chat-store';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageInputProps {
  onSend: (content: string, type?: string, file?: { url: string; name: string; size: number; type: string }) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export default function MessageInput({ onSend, onTypingStart, onTypingStop }: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { replyingTo, editingMessage, setReplyingTo, setEditingMessage, isDarkMode } = useChatStore();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [replyingTo]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
    onTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTypingStop(), 2000);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !editingMessage) return;
    onSend(trimmed);
    setText('');
    setReplyingTo(null);
    setEditingMessage(null);
    onTypingStop();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
      setEditingMessage(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const isImage = file.type.startsWith('image/');
      onSend(text.trim() || '', isImage ? 'IMAGE' : 'FILE', {
        url: data.url,
        name: data.name,
        size: data.size,
        type: data.type,
      });
      setText('');
    } catch {
      console.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setText((prev) => prev + emoji.native);
    textareaRef.current?.focus();
  };

  return (
    <div className="shrink-0" style={{ background: 'var(--bg-secondary)' }}>
      {/* Reply / Edit bar */}
      <AnimatePresence>
        {(replyingTo || editingMessage) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-4 py-2 border-t border-l-4"
              style={{
                borderTopColor: 'var(--border)',
                borderLeftColor: editingMessage ? '#f59e0b' : 'var(--accent)',
                background: 'var(--bg-primary)',
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: editingMessage ? '#f59e0b' : 'var(--accent)' }}>
                  {editingMessage ? 'Editing message' : `Replying to ${replyingTo?.sender?.name}`}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {editingMessage?.content || replyingTo?.content}
                </p>
              </div>
              <button
                onClick={() => { setReplyingTo(null); setEditingMessage(null); setText(''); }}
                className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-4 z-50"
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme={isDarkMode ? 'dark' : 'light'}
              previewPosition="none"
              skinTonePosition="none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
          style={{ color: showEmoji ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 disabled:opacity-50"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />

        <div
          className="flex-1 rounded-2xl px-4 py-2.5 min-h-[44px] flex items-center"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full bg-transparent outline-none resize-none text-sm max-h-[120px]"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {text.trim() || editingMessage ? (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={handleSend}
            className="p-2.5 rounded-full text-white shrink-0 transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'var(--accent)' }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        ) : (
          <button
            className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
