'use client';

import { useChatStore } from '@/store/chat-store';
import UserAvatar from './UserAvatar';
import { Search, MoreVertical, Phone, Video, ArrowLeft, Sun, Moon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ChatHeader() {
  const { otherUser, isOtherTyping, isDarkMode, toggleDarkMode, toggleSidebar } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/login');
  };

  if (!otherUser) return null;

  const statusText = isOtherTyping
    ? 'typing...'
    : otherUser.isOnline
    ? 'online'
    : `last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })}`;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={toggleSidebar}
        className="md:hidden p-1.5 rounded-lg hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <UserAvatar name={otherUser.name} avatar={otherUser.avatar} isOnline={otherUser.isOnline} size="md" />

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {otherUser.name}
        </h2>
        <p
          className={`text-xs truncate ${isOtherTyping ? 'text-emerald-500 font-medium' : ''}`}
          style={!isOtherTyping ? { color: otherUser.isOnline ? '#00a884' : 'var(--text-secondary)' } : {}}
        >
          {statusText}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}>
          <Phone className="w-5 h-5" />
        </button>
        <button
          onClick={() => useChatStore.getState().setIsSearchOpen(true)}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Search className="w-5 h-5" />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-xl border z-50 py-1 animate-fade-in"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => { toggleDarkMode(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button
                onClick={() => { toggleSidebar(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Contact Info
              </button>
              <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
