import { Leaf } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <span className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''}`} data-testid="brand-nutrigo">
      <span className="brand-mark"><Leaf size={18} strokeWidth={2.4} /></span>
      <span className="brand-word">nutri<span>go</span></span>
      {!compact && <span className="brand-ai">AI</span>}
    </span>
  );
}
