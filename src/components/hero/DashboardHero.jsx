export default function DashboardHero({
  activeSiteCount = 21,
  theme = 'dark'
}) {
  const isLight = theme === 'light';

  return (
    <section
      style={{
        padding: '24px 0 20px 0',
        position: 'relative'
      }}
    >
      {/* Signature Horizon Geometric Mountain Hero Banner */}
      <div
        className="glass-card"
        style={{
          position: 'relative',
          padding: '28px 32px',
          borderRadius: '20px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(14, 19, 30, 0.95) 0%, rgba(9, 13, 20, 0.98) 100%)',
          border: isLight ? '1px solid rgba(226, 232, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isLight
            ? '0 10px 30px -4px rgba(15, 23, 42, 0.08), 0 0 20px -2px rgba(0, 200, 83, 0.08)'
            : '0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 30px -5px rgba(0, 200, 83, 0.1)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Background SVG Artwork: Exact Geometric Horizon Facets from the Brand Identity */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            opacity: isLight ? 0.45 : 0.92,
            transition: 'opacity 0.3s ease'
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1200 320"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Left Orange-to-Magenta-to-Purple Facet Gradient */}
              <linearGradient id="facet-orange-magenta" x1="0%" y1="100%" x2="60%" y2="0%">
                <stop offset="0%" stopColor="#FF3D00" stopOpacity="0.95" />
                <stop offset="30%" stopColor="#FF5B22" stopOpacity="0.9" />
                <stop offset="65%" stopColor="#D946EF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.6" />
              </linearGradient>

              {/* Center Emerald-to-Purple/Violet Facet Gradient */}
              <linearGradient id="facet-emerald-violet" x1="0%" y1="100%" x2="80%" y2="0%">
                <stop offset="0%" stopColor="#00E676" stopOpacity="0.9" />
                <stop offset="25%" stopColor="#00C853" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#4F46E5" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.4" />
              </linearGradient>

              {/* Charcoal / Slate Mountain Polygon Gradients */}
              <linearGradient id="dark-mountain-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isLight ? "#CBD5E1" : "#172033"} stopOpacity="0.95" />
                <stop offset="100%" stopColor={isLight ? "#E2E8F0" : "#0C101A"} stopOpacity="0.98" />
              </linearGradient>

              {/* Neon Glow Filters */}
              <filter id="neon-glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FF5B22" floodOpacity={isLight ? 0.4 : 0.8} />
              </filter>
              <filter id="neon-glow-green" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00E676" floodOpacity={isLight ? 0.4 : 0.8} />
              </filter>
            </defs>

            {/* Far Background Subtle Horizon Ridge */}
            <polygon points="0,320 180,180 340,260 520,140 760,280 1200,160 1200,320" fill="url(#dark-mountain-1)" opacity="0.6" />

            {/* Left Geometric Peak: Dark Facet */}
            <polygon points="-50,320 120,130 220,320" fill={isLight ? "#E2E8F0" : "#121826"} opacity="0.9" />

            {/* LEFT VIBRANT FACET: Orange-to-Magenta-to-Purple (as seen in card!) */}
            <polygon points="-20,320 120,130 50,320" fill="url(#facet-orange-magenta)" />
            {/* Left Peak Razor Neon Stroke */}
            <line x1="-20" y1="320" x2="120" y2="130" stroke="#FF6B00" strokeWidth="2.5" filter="url(#neon-glow-orange)" />

            {/* CENTER MAIN PEAK */}
            <polygon points="120,320 380,80 620,320" fill={isLight ? "#F1F5F9" : "#0E1422"} />

            {/* CENTER FACET: Emerald Green fading into Violet/Purple */}
            <polygon points="210,320 380,80 490,320" fill="url(#facet-emerald-violet)" opacity="0.85" />
            {/* Center Peak Neon Green Ridge Line */}
            <line x1="210" y1="320" x2="380" y2="80" stroke="#00E676" strokeWidth="2.5" filter="url(#neon-glow-green)" />
            <line x1="380" y1="80" x2="620" y2="320" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.7" />

            {/* RIGHT MOUNTAIN PEAK with Neon Orange Line Accent (as on the right of the brand card) */}
            <polygon points="980,320 1140,220 1250,320" fill={isLight ? "#E2E8F0" : "#111624"} opacity="0.7" />
            <line x1="980" y1="320" x2="1140" y2="220" stroke="#FF5B22" strokeWidth="2" filter="url(#neon-glow-orange)" />
            <line x1="1140" y1="220" x2="1250" y2="320" stroke="#FF5B22" strokeWidth="2" filter="url(#neon-glow-orange)" />

            {/* Architectural Grid / Hex Pattern Overlays */}
            <line x1="380" y1="80" x2="420" y2="320" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255, 255, 255, 0.08)"} strokeDasharray="4 4" />
            <line x1="280" y1="180" x2="520" y2="320" stroke="rgba(0, 230, 118, 0.15)" />
          </svg>
        </div>

        {/* Hero Content Layer */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          {/* Left Title & Status Area */}
          <div style={{ maxWidth: '780px' }}>
            {/* Top Operational Telemetry Badge - Clean single pill as requested */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: isLight ? 'rgba(0, 200, 83, 0.1)' : 'rgba(0, 200, 83, 0.15)',
                  border: isLight ? '1px solid rgba(0, 200, 83, 0.3)' : '1px solid rgba(0, 200, 83, 0.35)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: isLight ? '#047857' : '#00E676',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                <span>Pan India Dashboard</span>
              </div>
            </div>

            {/* Operational Summary Description */}
            <p
              style={{
                fontSize: '0.9375rem',
                color: isLight ? '#334155' : '#CBD5E1',
                margin: '2px 0 0 0',
                lineHeight: 1.55,
                fontWeight: 500,
                maxWidth: '720px'
              }}
            >
              Centralized monitoring for facility health, service SLA compliance, asset lifecycle telemetry, and workforce deployment across {activeSiteCount} Grade-A Industrial Parks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
