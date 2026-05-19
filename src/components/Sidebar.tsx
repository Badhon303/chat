'use client';

import { useChatStore } from '@/store/chat-store';
import UserAvatar from './UserAvatar';
import { X, Image as ImageIcon, FileText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const { currentUser, otherUser, isSidebarOpen, setIsSidebarOpen, messages } = useChatStore();

  const mediaMessages = messages.filter(m => m.type === 'IMAGE' && !m.isDeleted);
  const fileMessages = messages.filter(m => m.type === 'FILE' && !m.isDeleted);
  const pinnedMessages = messages.filter(m => m.isPinned && !m.isDeleted);

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[340px] max-w-full z-50 overflow-y-auto border-l"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b sticky top-0 z-10"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Contact Info</h3>
            </div>

            {/* Profile */}
            {otherUser && (
              <div className="flex flex-col items-center py-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <UserAvatar name={otherUser.name} avatar={otherUser.avatar} isOnline={otherUser.isOnline} size="lg" />
                <h4 className="mt-3 font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {otherUser.name}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{otherUser.email}</p>
                <p className="text-xs mt-1" style={{ color: otherUser.isOnline ? '#00a884' : 'var(--text-secondary)' }}>
                  {otherUser.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}`}
                </p>
              </div>
            )}

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h5 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                  📌 Pinned Messages ({pinnedMessages.length})
                </h5>
                <div className="space-y-2">
                  {pinnedMessages.slice(0, 5).map(m => (
                    <div key={m.id} className="p-2 rounded-lg text-sm" style={{ background: 'var(--bg-primary)' }}>
                      <p className="line-clamp-2" style={{ color: 'var(--text-primary)' }}>{m.content}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {format(new Date(m.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Media */}
            {mediaMessages.length > 0 && (
              <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h5 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> Media ({mediaMessages.length})
                </h5>
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaMessages.slice(0, 9).map(m => (
                    <img
                      key={m.id}
                      src={m.fileUrl || ''}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shared Files */}
            {fileMessages.length > 0 && (
              <div className="p-4">
                <h5 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <FileText className="w-3.5 h-3.5 inline mr-1" /> Files ({fileMessages.length})
                </h5>
                <div className="space-y-2">
                  {fileMessages.slice(0, 10).map(m => (
                    <a
                      key={m.id}
                      href={m.fileUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ background: 'var(--bg-primary)' }}
                    >
                      <FileText className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{m.fileName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {m.fileSize ? `${(m.fileSize / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
