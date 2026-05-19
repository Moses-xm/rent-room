interface EmptyStateProps {
  text?: string;
}

export function EmptyState({ text = "暂无数据" }: EmptyStateProps) {
  return (
    <div className="py-16 flex flex-col items-center gap-4">
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="30" width="80" height="55" rx="4" fill="#e8e8e8" />
        <path d="M10 34 L50 60 L90 34" stroke="#d0d0d0" strokeWidth="1.5" fill="none" />
        <rect x="22" y="18" width="56" height="48" rx="3" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />
        <line x1="30" y1="30" x2="70" y2="30" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="38" x2="70" y2="38" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="46" x2="56" y2="46" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
        <rect x="68" y="4" width="44" height="30" rx="8" fill="#e0e0e0" />
        <path d="M72 34 L68 40 L80 34" fill="#e0e0e0" />
        <circle cx="82" cy="19" r="3" fill="#bbb" />
        <circle cx="90" cy="19" r="3" fill="#bbb" />
        <circle cx="98" cy="19" r="3" fill="#bbb" />
      </svg>
      <p className="text-sm text-text-muted">{text}</p>
    </div>
  );
}
