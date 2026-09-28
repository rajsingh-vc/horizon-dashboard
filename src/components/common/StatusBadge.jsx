import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

export default function StatusBadge({ type = 'neutral', label, icon = true, size = 'sm' }) {
  const getStyle = () => {
    switch (type) {
      case 'success':
      case 'operational':
      case 'completed':
      case 'active':
      case 'compliant':
        return {
          bg: 'rgba(0, 200, 83, 0.12)',
          text: '#00E676',
          border: 'rgba(0, 200, 83, 0.35)',
          Icon: CheckCircle2,
          dotColor: '#00E676'
        };
      case 'warning':
      case 'breakdown':
      case 'pending':
        return {
          bg: 'rgba(255, 91, 34, 0.12)',
          text: '#FF7A45',
          border: 'rgba(255, 91, 34, 0.35)',
          Icon: AlertTriangle,
          dotColor: '#FF5B22'
        };
      case 'danger':
      case 'critical':
      case 'overdue':
      case 'non-compliant':
        return {
          bg: 'rgba(248, 113, 113, 0.12)',
          text: '#F87171',
          border: 'rgba(248, 113, 113, 0.35)',
          Icon: AlertCircle,
          dotColor: '#EF4444'
        };
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.06)',
          text: '#94A3B8',
          border: 'rgba(255, 255, 255, 0.12)',
          Icon: Clock,
          dotColor: '#94A3B8'
        };
    }
  };

  const style = getStyle();
  const IconComponent = style.Icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '3px 9px' : '5px 12px',
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap'
      }}
    >
      {icon && <IconComponent size={size === 'sm' ? 12 : 14} strokeWidth={2.2} />}
      {label}
    </span>
  );
}
