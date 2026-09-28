export default function HorizonLogo({ 
  size = 40, 
  showText = true, 
  theme = 'dark',
  className = '' 
}) {
  const isLight = theme === 'light';

  return (
    <div 
      className={`horizon-brand-logo ${className}`}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '12px',
        textDecoration: 'none',
        userSelect: 'none',
        cursor: 'pointer',
        flexShrink: 0
      }}
    >
      {/* High-Resolution Horizon Brand Emblem (Square green/orange with upward arrow) */}
      <div
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0,
          borderRadius: '7px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isLight 
            ? '0 2px 8px rgba(15, 23, 42, 0.08), 0 0 1px rgba(0, 0, 0, 0.12)' 
            : '0 4px 16px rgba(0, 200, 83, 0.35), 0 0 1px rgba(255, 255, 255, 0.25)',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <img 
          src="/image.png" 
          alt="Horizon Industrial Parks"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      </div>

      {/* Horizon Brand Wordmark: "HORIZON" with "INDUSTRIAL PARKS" beneath it */}
      {showText && (
        <div 
          style={{ 
            display: 'inline-flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            lineHeight: 1 
          }}
        >
          <span 
            style={{ 
              fontSize: size > 36 ? '1.3125rem' : '1.15rem', 
              fontWeight: 900, 
              letterSpacing: '0.04em', 
              color: isLight ? '#0B0F19' : '#FFFFFF',
              fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
              textTransform: 'uppercase',
              lineHeight: 1,
              transition: 'color 0.2s ease',
              display: 'block'
            }}
          >
            HORIZON
          </span>
          <span 
            style={{ 
              fontSize: size > 36 ? '0.465rem' : '0.41rem', 
              fontWeight: 800, 
              letterSpacing: '0.275em', 
              color: isLight ? '#0B0F19' : '#FFFFFF',
              fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
              textTransform: 'uppercase',
              lineHeight: 1,
              marginTop: '4px',
              marginRight: '-0.275em',
              transition: 'color 0.2s ease',
              display: 'block',
              textAlign: 'center'
            }}
          >
            INDUSTRIAL PARKS
          </span>
        </div>
      )}
    </div>
  );
}
