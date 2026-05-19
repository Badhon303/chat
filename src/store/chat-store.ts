import { create } from 'zustand';
import type { Message, User } from '@/types';

interface ChatState {
  messages: Message[];
  currentUser: User | null;
  otherUser: User | null;
  isTyping: boolean;
  isOtherTyping: boolean;
  isConnected: boolean;
  replyingTo: Message | null;
  editingMessage: Message | null;
  searchQuery: string;
  searchResults: Message[];
  isSearchOpen: boolean;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  unreadCount: number;

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  prependMessages: (messages: Message[]) => void;
  setCurrentUser: (user: User | null) => void;
  setOtherUser: (user: User | null) => void;
  setIsTyping: (isTyping: boolean) => void;
  setIsOtherTyping: (isTyping: boolean) => void;
  setIsConnected: (isConnected: boolean) => void;
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Message[]) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  toggleDarkMode: () => void;
  setIsDarkMode: (isDark: boolean) => void;
  toggleSidebar: () => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  markMessagesAsSeen: (messageIds: string[]) => void;
  addReaction: (messageId: string, reaction: Message['reactions'][0]) => void;
  removeReaction: (messageId: string, reactionId: string) => void;
  setUnreadCount: (count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentUser: null,
  otherUser: null,
  isTyping: false,
  isOtherTyping: false,
  isConnected: false,
  replyingTo: null,
  editingMessage: null,
  searchQuery: '',
  searchResults: [],
  isSearchOpen: false,
  isDarkMode: true,
  isSidebarOpen: false,
  unreadCount: 0,

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true, content: 'This message was deleted' } : msg
      ),
    })),
  prependMessages: (messages) =>
    set((state) => ({
      messages: [...messages, ...state.messages],
    })),
  setCurrentUser: (user) => set({ currentUser: user }),
  setOtherUser: (user) => set({ otherUser: user }),
  setIsTyping: (isTyping) => set({ isTyping }),
  setIsOtherTyping: (isTyping) => set({ isOtherTyping: isTyping }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setReplyingTo: (message) => set({ replyingTo: message }),
  setEditingMessage: (message) => set({ editingMessage: message }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', JSON.stringify(newMode));
        document.documentElement.classList.toggle('dark', newMode);
      }
      return { isDarkMode: newMode };
    }),
  setIsDarkMode: (isDark) => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    set({ isDarkMode: isDark });
  },
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  markMessagesAsSeen: (messageIds) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        messageIds.includes(msg.id) ? { ...msg, status: 'SEEN' as const } : msg
      ),
    })),
  addReaction: (messageId, reaction) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, reactions: [...msg.reactions, reaction] }
          : msg
      ),
    })),
  removeReaction: (messageId, reactionId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, reactions: msg.reactions.filter((r) => r.id !== reactionId) }
          : msg
      ),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
