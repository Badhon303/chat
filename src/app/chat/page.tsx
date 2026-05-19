'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import ChatHeader from '@/components/ChatHeader';
import ChatBubble from '@/components/ChatBubble';
import MessageInput from '@/components/MessageInput';
import TypingIndicator from '@/components/TypingIndicator';
import Sidebar from '@/components/Sidebar';
import SearchPanel from '@/components/SearchPanel';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Message } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const {
    messages, currentUser, otherUser, isOtherTyping,
    setMessages, addMessage, updateMessage, removeMessage, prependMessages,
    setCurrentUser, setOtherUser, setIsOtherTyping, setIsConnected,
    replyingTo, editingMessage, setReplyingTo, setEditingMessage,
    markMessagesAsSeen, addReaction, removeReaction, isDarkMode, setIsDarkMode,
  } = useChatStore();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setIsDarkMode(JSON.parse(saved));
    } else {
      setIsDarkMode(true);
    }
  }, [setIsDarkMode]);

  // Fetch current user and other user
  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, otherRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/users/other'),
        ]);

        if (!meRes.ok) {
          router.push('/login');
          return;
        }

        const meData = await meRes.json();
        const otherData = await otherRes.json();

        setCurrentUser(meData.user);
        setOtherUser(otherData.user);

        // Fetch messages
        const msgRes = await fetch('/api/messages?limit=50');
        const msgData = await msgRes.json();
        setMessages(msgData.messages);
        setCursor(msgData.nextCursor);
        setHasMore(!!msgData.nextCursor);

        // Connect socket
        const socket = connectSocket(meData.user.id);

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        socket.on('message:receive', (data: { message: Message }) => {
          addMessage(data.message);
          // Mark as read
          fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds: [data.message.id] }),
          });
          socket.emit('message:read', {
            messageIds: [data.message.id],
            senderId: data.message.senderId,
          });
        });

        socket.on('message:delivered', (data: { messageId: string }) => {
          updateMessage(data.messageId, { status: 'DELIVERED' });
        });

        socket.on('message:seen', (data: { messageIds: string[] }) => {
          markMessagesAsSeen(data.messageIds);
        });

        socket.on('typing:update', (data: { userId: string; isTyping: boolean }) => {
          if (data.userId !== meData.user.id) {
            setIsOtherTyping(data.isTyping);
          }
        });

        socket.on('user:online', (data: { userId: string; isOnline: boolean; lastSeen: string }) => {
          if (data.userId !== meData.user.id) {
            setOtherUser({
              ...otherData.user,
              isOnline: data.isOnline,
              lastSeen: data.lastSeen,
            });
          }
        });

        socket.on('message:reaction:update', (data: { reaction: Message['reactions'][0]; messageId: string; action: string }) => {
          if (data.action === 'add') {
            addReaction(data.messageId, data.reaction);
          } else {
            removeReaction(data.messageId, data.reaction.id);
          }
        });

        socket.on('message:deleted', (data: { messageId: string }) => {
          removeMessage(data.messageId);
        });

        socket.on('message:edited', (data: { messageId: string; content: string }) => {
          updateMessage(data.messageId, { content: data.content, isEdited: true });
        });

        socket.on('message:pinned', (data: { messageId: string; isPinned: boolean }) => {
          updateMessage(data.messageId, { isPinned: data.isPinned });
        });

        // Mark all received unread as seen
        const unread = msgData.messages
          .filter((m: Message) => m.receiverId === meData.user.id && m.status !== 'SEEN')
          .map((m: Message) => m.id);
        if (unread.length > 0) {
          fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds: unread }),
          });
          socket.emit('message:read', {
            messageIds: unread,
            senderId: otherData.user.id,
          });
        }
      } catch (err) {
        console.error('Init error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => disconnectSocket();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOtherTyping, loadingMore]);

  // Infinite scroll
  const handleScroll = useCallback(async () => {
    const container = chatContainerRef.current;
    if (!container || loadingMore || !hasMore) return;

    if (container.scrollTop < 100) {
      setLoadingMore(true);
      const prevHeight = container.scrollHeight;
      try {
        const res = await fetch(`/api/messages?limit=50${cursor ? `&cursor=${cursor}` : ''}`);
        const data = await res.json();
        if (data.messages.length > 0) {
          prependMessages(data.messages);
          setCursor(data.nextCursor);
          setHasMore(!!data.nextCursor);
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - prevHeight;
          });
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error('Load more error:', err);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [cursor, hasMore, loadingMore, prependMessages]);

  // Send message
  const handleSend = async (
    content: string,
    type?: string,
    file?: { url: string; name: string; size: number; type: string }
  ) => {
    if (!currentUser || !otherUser) return;

    if (editingMessage) {
      // Edit existing message
      try {
        const res = await fetch(`/api/messages/${editingMessage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          updateMessage(editingMessage.id, { content, isEdited: true });
          getSocket().emit('message:edit', {
            messageId: editingMessage.id,
            content,
            receiverId: otherUser.id,
          });
          setEditingMessage(null);
        }
      } catch (err) {
        toast.error('Failed to edit message');
      }
      return;
    }

    // Create new message
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content || null,
          type: type || 'TEXT',
          receiverId: otherUser.id,
          replyToId: replyingTo?.id || null,
          fileUrl: file?.url,
          fileName: file?.name,
          fileSize: file?.size,
          fileType: file?.type,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addMessage(data.message);
        getSocket().emit('message:send', { message: data.message });
        setReplyingTo(null);
      }
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        removeMessage(messageId);
        getSocket().emit('message:delete', {
          messageId,
          receiverId: otherUser?.id,
        });
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch('/api/messages/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji }),
      });
      const data = await res.json();
      if (data.action === 'added') {
        addReaction(messageId, data.reaction);
      } else {
        removeReaction(messageId, data.reaction.id);
      }
      getSocket().emit('message:reaction', {
        reaction: data.reaction,
        messageId,
        action: data.action,
        receiverId: otherUser?.id,
      });
    } catch {
      toast.error('Reaction failed');
    }
  };

  const handlePin = async (messageId: string, isPinned: boolean) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });
      if (res.ok) {
        updateMessage(messageId, { isPinned });
        getSocket().emit('message:pin', {
          messageId,
          isPinned,
          receiverId: otherUser?.id,
        });
      }
    } catch {
      toast.error('Pin failed');
    }
  };

  const handleTypingStart = () => {
    if (otherUser) {
      getSocket().emit('typing:start', { receiverId: otherUser.id });
    }
  };

  const handleTypingStop = () => {
    if (otherUser) {
      getSocket().emit('typing:stop', { receiverId: otherUser.id });
    }
  };

  // Date separator helper
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00a884, #008f72)' }}>
            <MessageCircle className="w-8 h-8 text-white animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading your messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatHeader />
        <SearchPanel />

        {/* Messages */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto chat-pattern"
        >
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-secondary)' }}>
                <MessageCircle className="w-10 h-10" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <p className="text-center" style={{ color: 'var(--text-secondary)' }}>
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg, idx) => {
                const msgDate = new Date(msg.createdAt);
                const prevDate = idx > 0 ? new Date(messages[idx - 1].createdAt) : null;
                const showDate = !prevDate || !isSameDay(msgDate, prevDate);
                const showAvatar =
                  idx === 0 ||
                  messages[idx - 1].senderId !== msg.senderId ||
                  showDate;

                return (
                  <div key={msg.id} id={`msg-${msg.id}`}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span
                          className="px-4 py-1.5 rounded-full text-xs font-medium shadow-sm"
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {getDateLabel(msgDate)}
                        </span>
                      </div>
                    )}
                    <ChatBubble
                      message={msg}
                      isMine={msg.senderId === currentUser?.id}
                      showAvatar={showAvatar}
                      onReply={setReplyingTo}
                      onEdit={setEditingMessage}
                      onDelete={handleDelete}
                      onReact={handleReact}
                      onPin={handlePin}
                    />
                  </div>
                );
              })}

              {isOtherTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <MessageInput
          onSend={handleSend}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>

      <Sidebar />
    </div>
  );
}
