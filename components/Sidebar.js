'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const Icons = {
    Dashboard: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>,
    Carbon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20"/><path d="M5 20V8l7-3v15"/><path d="M12 20V4l7 3v13"/></svg>,
    Reduction: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>,
    Analytics: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
    Reports: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    Help: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
    Logo: <svg width="24" height="24" fill="hsl(var(--primary))" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path fill="hsl(var(--sidebar))" d="M12 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"/></svg>
  };

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Icons.Dashboard },
    { name: 'Carbon Emissions', href: '/dashboard/data-entry', icon: Icons.Carbon },
    { name: 'Reduction Initiatives', href: '/dashboard/initiatives', icon: Icons.Reduction }, 
    { name: 'Analytics', href: '#', icon: Icons.Analytics }, 
    { name: 'Generate Reports', href: '/dashboard/reports', icon: Icons.Reports },
    { name: 'Help & Support', href: '/dashboard/settings', icon: Icons.Help },
  ];

  return (
    <aside style={{ 
      width: '260px', 
      height: '100vh', 
      position: 'sticky', 
      top: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'hsl(var(--sidebar))',
      color: 'hsl(var(--sidebar-foreground))',
      padding: '2rem 0', 
      borderTopRightRadius: '1.75rem',
      borderBottomRightRadius: '1.75rem',
      boxShadow: '4px 0 20px rgba(0,0,0,0.05)'
    }}>
      
      <div style={{ marginBottom: '2.5rem', padding: '0 2rem' }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          margin: 0, 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          letterSpacing: '-0.02em'
        }}>
          {Icons.Logo} CarbonFlow
        </h1>
        <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, marginTop: '0.1rem', fontWeight: 500, paddingLeft: '2.2rem' }}>
          Solutions
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, padding: '0 1rem' }}>
        {navLinks.map((link) => {
          const isDashboard = link.href === '/dashboard' && pathname === '/dashboard';
          const isOtherActive = link.href !== '/dashboard' && link.href !== '#' && pathname.includes(link.href);
          const isActive = isDashboard || isOtherActive;
          
          return (
            <Link 
              key={link.name} 
              href={link.href}
              style={{
                textDecoration: 'none',
                color: isActive ? 'hsl(var(--primary-foreground))' : 'rgba(255,255,255,0.7)',
                padding: '0.85rem 1.25rem',
                borderRadius: '2rem', 
                background: isActive ? 'hsl(var(--primary))' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                transition: 'all 0.2s ease',
                fontSize: '0.9rem'
              }}
              onMouseOver={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseOut={e => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ display: 'flex', opacity: isActive ? 1 : 0.8 }}>{link.icon}</span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ margin: 'auto 1.5rem 0 1.5rem', padding: '1.25rem', background: 'hsl(var(--primary))', borderRadius: '1.25rem', color: 'hsl(var(--primary-foreground))', boxShadow: '0 4px 15px rgba(196, 240, 58, 0.4)' }}>
         <p style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Did you know that..?</p>
         <p style={{ fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 500, margin: '0 0 0.75rem 0' }}>Optimizing supply chain routing can reduce your organization's Scope 1 emissions by up to <strong>15% annually</strong>!</p>
         <button style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>View Strategies</button>
      </div>
    </aside>
  );
}
