import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function EmptyState({ 
  icon = 'shield', 
  title = 'No Items Found', 
  description = 'Everything is currently running within defined operating thresholds.',
  action = null
}) {
  const IconComponent = icon === 'shield' ? ShieldCheck : CheckCircle2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 24px',
        textAlign: 'center',
        minHeight: '220px',
        background: 'var(--glass-bg)',
        borderRadius: '12px',
        border: '1px dashed var(--glass-border)'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 200, 83, 0.12)',
          border: '1px solid rgba(0, 200, 83, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          color: '#00E676'
        }}
      >
        <IconComponent size={24} strokeWidth={2} />
      </div>

      <h4
        style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '6px'
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          maxWidth: '300px',
          lineHeight: '1.45'
        }}
      >
        {description}
      </p>

      {action && (
        <div style={{ marginTop: '16px' }}>
          {action}
        </div>
      )}
    </div>
  );
}
