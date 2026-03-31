'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Data Entry', href: '/dashboard/data-entry', icon: '✍️' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📑' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <aside className="glass print-hide" style={{ 
      width: '280px', 
      height: '100vh', 
      position: 'sticky', 
      top: 0, 
      padding: '2.5rem 1.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      borderRight: '1px solid rgba(255,255,255,0.03)', 
      backgroundColor: 'rgba(15, 20, 30, 0.5)',
      boxShadow: '4px 0 24px rgba(0,0,0,0.2)' 
    }}>
      
      <div style={{ marginBottom: '3.5rem', paddingLeft: '0.75rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 800, 
          margin: 0, 
          background: 'linear-gradient(to right, #ffffff, hsl(var(--primary)))', 
          WebkitBackgroundClip: 'text', 
          color: 'transparent', 
          letterSpacing: '-0.04em' 
        }}>
          CarbonFlow<span style={{ color: 'hsl(var(--primary))' }}>.</span>
        </h1>
        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, marginTop: '0.2rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Sustainability OS
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              style={{
                textDecoration: 'none',
                color: isActive ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.65)',
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                background: isActive ? 'hsla(var(--primary), 0.1)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.25s ease',
                border: isActive ? '1px solid hsla(var(--primary), 0.2)' : '1px solid transparent',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '0.85rem'
              }}
              onMouseOver={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseOut={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ 
                fontSize: '1.25rem', 
                filter: isActive ? 'drop-shadow(0 0 10px hsla(var(--primary), 0.5))' : 'none', 
                transition: 'all 0.3s ease',
                transform: isActive ? 'scale(1.1)' : 'scale(1)'
              }}>
                {link.icon}
              </span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
         <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>System Status</p>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--primary))', boxShadow: '0 0 12px hsl(var(--primary))', animation: 'pulse-glow 2s infinite' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>Operational</span>
         </div>
      </div>
    </aside>
  );
}
