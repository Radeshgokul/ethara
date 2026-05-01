export const statusConfig = {
  TODO: { label: 'To Do', class: 'badge-todo', color: '#94a3b8' },
  IN_PROGRESS: { label: 'In Progress', class: 'badge-in-progress', color: '#3b82f6' },
  IN_REVIEW: { label: 'In Review', class: 'badge-in-review', color: '#f59e0b' },
  DONE: { label: 'Done', class: 'badge-done', color: '#10b981' },
};

export const priorityConfig = {
  LOW: { label: 'Low', class: 'badge-low', color: '#94a3b8' },
  MEDIUM: { label: 'Medium', class: 'badge-medium', color: '#3b82f6' },
  HIGH: { label: 'High', class: 'badge-high', color: '#f97316' },
  URGENT: { label: 'Urgent', class: 'badge-urgent', color: '#ef4444' },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status];
  return <span className={`badge ${config?.class}`}>{config?.label || status}</span>;
}

export function PriorityBadge({ priority }) {
  const config = priorityConfig[priority];
  return <span className={`badge ${config?.class}`}>{config?.label || priority}</span>;
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>
      {role}
    </span>
  );
}

export function OverdueBadge() {
  return (
    <span className="badge bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse-slow">
      Overdue
    </span>
  );
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'DONE') return false;
  return new Date(dueDate) < new Date();
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  // Generate consistent color from name
  const colors = [
    'from-brand-500 to-violet-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-sky-500 to-blue-500',
    'from-purple-500 to-indigo-500',
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center font-semibold text-white ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
