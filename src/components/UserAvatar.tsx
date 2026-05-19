'use client';

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2.5 h-2.5 border-[1.5px]' },
  md: { container: 'w-10 h-10', text: 'text-sm', dot: 'w-3 h-3 border-2' },
  lg: { container: 'w-14 h-14', text: 'text-lg', dot: 'w-3.5 h-3.5 border-2' },
};

const colors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-600',
];

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % colors.length;
}

export default function UserAvatar({ name, avatar, isOnline, size = 'md' }: UserAvatarProps) {
  const s = sizeMap[size];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colorClass = colors[getColorIndex(name)];

  return (
    <div className="relative inline-flex shrink-0">
      {avatar ? (
        <img src={avatar} alt={name} className={`${s.container} rounded-full object-cover`} />
      ) : (
        <div className={`${s.container} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
          <span className={`${s.text} font-semibold text-white`}>{initials}</span>
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 ${s.dot} rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
          }`}
          style={{ borderColor: 'var(--bg-secondary)' }}
        />
      )}
    </div>
  );
}
