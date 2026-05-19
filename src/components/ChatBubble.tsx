'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Reply, Pencil, Trash2, Pin, Smile, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useChatStore } from '@/store/chat-store';
import type { Message } from '@/types';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onPin: (id: string, pinned: boolean) => void;
}

const quickEmojis = ['❤️', '😂', '😮', '😢', '👍', '🙏'];

export default function ChatBubble({ message, isMine, onReply, onEdit, onDelete, onReact, onPin }: ChatBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useChatStore();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const statusIcon = () => {
    if (!isMine) return null;
    switch (message.status) {
      case 'SENT': return <Check className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />;
      case 'DELIVERED': return <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />;
      case 'SEEN': return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return (
        <p className="italic text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
          🚫 This message was deleted
        </p>
      );
    }
    switch (message.type) {
      case 'IMAGE':
        return (
          <div className="space-y-1">
            <img
              src={message.fileUrl || ''}
              alt={message.fileName || 'Image'}
              className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
            />
            {message.content && <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{message.content}</p>}
          </div>
        );
      case 'FILE':
        return (
          <a
            href={message.fileUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.05)' }}
          >
            <FileText className="w-8 h-8 shrink-0" style={{ color: 'var(--accent)' }} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {message.fileName}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'File'}
              </p>
            </div>
          </a>
        );
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
            {message.content}
          </p>
        );
    }
  };

  const groupedReactions = message.reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-0.5 group`}
    >
      <div
        className="relative max-w-[75%] lg:max-w-[60%]"
        ref={actionsRef}
        onMouseEnter={() => !message.isDeleted && setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
      >
        {/* Reply preview */}
        {message.replyTo && !message.replyTo.isDeleted && (
          <div
            className={`text-xs px-3 py-2 rounded-t-xl border-l-2 mb-[-4px] ${isMine ? 'rounded-tr-xl' : 'rounded-tl-xl'}`}
            style={{
              background: isMine ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
              borderLeftColor: 'var(--accent)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="font-semibold block" style={{ color: 'var(--accent)' }}>
              {message.replyTo.sender?.name}
            </span>
            <span className="line-clamp-1">{message.replyTo.content}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-3 py-2 shadow-sm ${
            isMine
              ? 'rounded-2xl rounded-tr-sm'
              : 'rounded-2xl rounded-tl-sm'
          } ${message.isPinned ? 'ring-2 ring-amber-400/50' : ''}`}
          style={{
            background: isMine ? 'var(--bg-bubble-sent)' : 'var(--bg-bubble-received)',
          }}
        >
          {message.isPinned && (
            <div className="flex items-center gap-1 mb-1">
              <Pin className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] text-amber-500 font-medium">Pinned</span>
            </div>
          )}

          {renderContent()}

          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {message.isEdited && (
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>edited</span>
            )}
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>
            {statusIcon()}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  reactions.some(r => r.userId === currentUser?.id)
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10'
                    : ''
                }`}
                style={{ borderColor: reactions.some(r => r.userId === currentUser?.id) ? undefined : 'var(--border)', background: reactions.some(r => r.userId === currentUser?.id) ? undefined : 'var(--bg-secondary)' }}
              >
                <span>{emoji}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{reactions.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div
            className={`absolute top-0 ${isMine ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} flex items-center gap-0.5 animate-fade-in`}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReply(message)}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Reply className="w-4 h-4" />
            </button>
            {isMine && (
              <>
                <button
                  onClick={() => onEdit(message)}
                  className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => onPin(message.id, !message.isPinned)}
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              style={{ color: message.isPinned ? '#f59e0b' : 'var(--text-secondary)' }}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick reactions */}
        {showReactions && (
          <div
            className={`absolute ${isMine ? 'right-0' : 'left-0'} -top-10 flex items-center gap-1 px-2 py-1.5 rounded-full shadow-lg border animate-fade-in z-10`}
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReact(message.id, emoji); setShowReactions(false); }}
                className="text-lg hover:scale-125 transition-transform p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
