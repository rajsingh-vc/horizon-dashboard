import { useState, useEffect } from 'react';
import { ArrowUp, Activity, MapPin, Wrench, Ticket, Calendar, Users } from 'lucide-react';

export default function QuickNav({ theme = 'dark' }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const sections = [
        { id: 'overview-section', name: 'overview' },
        { id: 'sites-section', name: 'sites' },
        { id: 'assets-section', name: 'assets' },
        { id: 'servicedesk-section', name: 'servicedesk' },
        { id: 'ppm-section', name: 'ppm' },
        { id: 'workforce-section', name: 'workforce' }
      ];

      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sec.name);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'overview-section', name: 'overview', label: 'Overview', icon: Activity },
    { id: 'sites-section', name: 'sites', label: 'Sites', icon: MapPin },
    { id: 'assets-section', name: 'assets', label: 'Assets', icon: Wrench },
    { id: 'servicedesk-section', name: 'servicedesk', label: 'Service Desk', icon: Ticket },
    { id: 'ppm-section', name: 'ppm', label: 'PPM', icon: Calendar },
    { id: 'workforce-section', name: 'workforce', label: 'Workforce', icon: Users }
  ];

  return (
    <>
      {/* Floating Bottom Center Section Switcher */}
      <nav
        aria-label="Dashboard quick navigation"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          borderRadius: '9999px',
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(14, 19, 30, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isLight
            ? '0 10px 30px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.9)'
            : '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          maxWidth: '92vw',
          overflowX: 'auto',
          transition: 'all 0.3s ease'
        }}
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.name;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: isActive ? '#00C853' : 'transparent',
                color: isActive ? '#090D14' : (isLight ? '#475569' : '#CBD5E1'),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 2px 10px rgba(0, 200, 83, 0.4)' : 'none'
              }}
            >
              <IconComponent size={13} strokeWidth={2.4} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floating Back-To-Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          title="Back to Top"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 40,
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: isLight ? '#FFFFFF' : '#121826',
            border: isLight ? '1px solid #CBD5E1' : '1px solid rgba(0, 200, 83, 0.4)',
            boxShadow: isLight
              ? '0 4px 14px rgba(15, 23, 42, 0.1)'
              : '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(0, 200, 83, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLight ? '#047857' : '#00E676',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            animation: 'fadeInUp 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00C853';
            e.currentTarget.style.color = '#090D14';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLight ? '#FFFFFF' : '#121826';
            e.currentTarget.style.color = isLight ? '#047857' : '#00E676';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      )}
    </>
  );
}
