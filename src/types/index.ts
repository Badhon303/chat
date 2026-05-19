export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isOnline: boolean;
  lastSeen: string;
}

export interface Message {
  id: string;
  content: string | null;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'SYSTEM';
  status: 'SENT' | 'DELIVERED' | 'SEEN';
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  receiverId: string;
  replyToId: string | null;
  replyTo?: Message | null;
  sender: User;
  receiver: User;
  reactions: Reaction[];
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
  user: User;
}

export interface TypingEvent {
  userId: string;
  isTyping: boolean;
}

export interface OnlineStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface SocketMessage {
  message: Message;
}

export interface MessageReadEvent {
  messageIds: string[];
  readBy: string;
}

export interface ReactionEvent {
  reaction: Reaction;
  messageId: string;
  action: 'add' | 'remove';
}

export interface DeleteMessageEvent {
  messageId: string;
  deletedBy: string;
}

export interface EditMessageEvent {
  messageId: string;
  content: string;
  editedBy: string;
}

export interface PinMessageEvent {
  messageId: string;
  isPinned: boolean;
}
