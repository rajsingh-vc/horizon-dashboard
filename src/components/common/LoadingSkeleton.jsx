export default function LoadingSkeleton({ variant = 'card', height, count = 1 }) {
  const items = Array.from({ length: count });

  if (variant === 'kpi') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', width: '100%' }}>
        {items.map((_, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', minHeight: '160px' }}>
            <div className="skeleton" style={{ width: '60%', height: '14px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '45%', height: '36px', marginBottom: '16px' }} />
            <div className="skeleton" style={{ width: '80%', height: '12px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '100%', height: '6px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="glass-card" style={{ padding: '20px', width: '100%' }}>
        <div className="skeleton" style={{ width: '25%', height: '20px', marginBottom: '16px' }} />
        {items.map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            <div className="skeleton" style={{ flex: 2, height: '32px' }} />
            <div className="skeleton" style={{ flex: 1, height: '32px' }} />
            <div className="skeleton" style={{ flex: 1, height: '32px' }} />
            <div className="skeleton" style={{ flex: 1, height: '32px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {items.map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            height: height || '120px',
            width: '100%',
            borderRadius: '12px'
          }}
        />
      ))}
    </div>
  );
}
