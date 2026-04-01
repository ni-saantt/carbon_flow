'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Reports() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('Member');
  const router = useRouter();

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      const { data: userData } = await supabase.from('users').select('organization_id, role').eq('id', session.user.id).single();
      if (userData?.role) setRole(userData.role);
      setUser(session.user);
      
      if (userData?.organization_id) {
        const { data } = await supabase
          .from('activity_data')
          .select('*, emission_factors(*)')
          .eq('organization_id', userData.organization_id)
          .order('date_logged', { ascending: false });
        if (data) setLogs(data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [router]);

  const handleDownload = () => {
    const headers = ['Date', 'Category', 'Activity Source', 'Quantity', 'Unit', 'Emission Factor', 'Total kg CO2e'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.date_logged,
        `"${log.emission_factors?.category || 'Unknown'}"`,
        `"${log.emission_factors?.source || 'Custom'}"`,
        log.quantity,
        log.emission_factors?.unit || 'N/A',
        log.emission_factors?.factor || 0,
        log.carbon_emission.toFixed(2)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'carbonflow_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading reports...</div>;

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* SVGs Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, maxWidth: '450px' }}>
          <div style={{ background: 'white', padding: '0.75rem 1.75rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid hsl(var(--border))' }}>
            <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Type here to search.." style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', boxShadow: 'none', padding: 0, fontSize: '0.95rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.25rem', opacity: 0.9, alignItems: 'center' }}>
             <span style={{ cursor: 'pointer', display: 'flex' }}>
               <svg width="22" height="22" fill="#fcd34d" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
             </span>
             <span style={{ cursor: 'pointer', display: 'flex' }}>
               <svg width="22" height="22" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
             </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.5rem 1.25rem 0.5rem 0.5rem', borderRadius: '2rem', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid hsl(var(--border))' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'hsl(var(--sidebar))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
              {userInitials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', textTransform: 'capitalize' }}>{userName}</span>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, textTransform: 'capitalize' }}>{role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main White Reporting Card */}
      <div className="glass" style={{ padding: '2.5rem', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Generate Report</h2>
            <button onClick={handleDownload} style={{ padding: '0.7rem 1.5rem', borderRadius: '2rem', border: '1px solid hsl(var(--primary))', background: 'hsla(var(--primary), 0.15)', color: '#111827', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Report
            </button>
         </div>

         {/* Filters Row */}
         <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select style={{ flex: 1, minWidth: '180px', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', fontWeight: 600, fontSize: '0.85rem', color: '#111827', appearance: 'none', background: 'white url("data:image/svg+xml;utf8,<svg fill=\'%236b7280\' height=\'20\' viewBox=\'0 0 24 24\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 0.75rem center' }}>
              <option>All Categories</option>
              <option>Energy</option>
              <option>Fuel Emissions</option>
            </select>
            <select style={{ flex: 1, minWidth: '180px', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', fontWeight: 600, fontSize: '0.85rem', color: '#111827', appearance: 'none', background: 'white url("data:image/svg+xml;utf8,<svg fill=\'%236b7280\' height=\'20\' viewBox=\'0 0 24 24\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 0.75rem center' }}>
              <option>Select Activity Source</option>
            </select>
            <select style={{ flex: 1, minWidth: '180px', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', fontWeight: 600, fontSize: '0.85rem', color: '#111827', appearance: 'none', background: 'white url("data:image/svg+xml;utf8,<svg fill=\'%236b7280\' height=\'20\' viewBox=\'0 0 24 24\' width=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 0.75rem center' }}>
              <option>Date Range (All Time)</option>
            </select>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', border: 'none', background: '#f3f4f6', color: '#374151', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Clear All</button>
              <button style={{ padding: '0.75rem 1.75rem', borderRadius: '0.5rem', border: 'none', background: 'hsl(var(--primary))', color: '#111827', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Generate</button>
            </div>
         </div>

         {/* Data Table Wrapper */}
         <div style={{ flex: 1, overflowX: 'auto', borderTop: '1px solid hsl(var(--border))', marginTop: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={{ padding: '1.25rem 0.5rem', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date <span style={{fontSize: '0.6rem'}}>↕</span></th>
                  <th style={{ padding: '1.25rem 0.5rem', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category <span style={{fontSize: '0.6rem'}}>↕</span></th>
                  <th style={{ padding: '1.25rem 0.5rem', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity / Device <span style={{fontSize: '0.6rem'}}>↕</span></th>
                  <th style={{ padding: '1.25rem 0.5rem', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity <span style={{fontSize: '0.6rem'}}>↕</span></th>
                  <th style={{ padding: '1.25rem 0.5rem', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Multiplier Basis <span style={{fontSize: '0.6rem'}}>↕</span></th>
                  <th style={{ padding: '1.25rem 0.5rem 1.25rem 0.5rem', color: '#6b7280', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total (kg CO2e) <span style={{fontSize: '0.6rem'}}>↕</span></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid hsl(var(--border))', background: 'transparent' }}>
                    <td style={{ padding: '1.5rem 0.5rem', fontSize: '0.9rem', color: '#111827', fontWeight: 700 }}>{log.date_logged}</td>
                    <td style={{ padding: '1.5rem 0.5rem', fontSize: '0.9rem', color: '#4b5563', fontWeight: 500 }}>{log.emission_factors?.category}</td>
                    <td style={{ padding: '1.5rem 0.5rem', fontSize: '0.9rem', color: '#4b5563', fontWeight: 500 }}>{log.emission_factors?.source}</td>
                    <td style={{ padding: '1.5rem 0.5rem', fontSize: '0.9rem', color: '#111827', fontWeight: 700 }}>{log.quantity} <span style={{fontSize: '0.75rem', color: '#6b7280', fontWeight: 500}}>{log.emission_factors?.unit}</span></td>
                    <td style={{ padding: '1.5rem 0.5rem', fontSize: '0.9rem', color: '#4b5563', fontWeight: 500 }}>{log.emission_factors?.factor}</td>
                    <td style={{ padding: '1.5rem 0.5rem 1.5rem 0.5rem', fontSize: '1rem', color: '#111827', fontWeight: 800, textAlign: 'right' }}>{log.carbon_emission.toFixed(2)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', fontWeight: 500 }}>No tracking data found. Generate some activities in Data Entry!</td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>

         {/* Pagination Footer */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: 500 }}>
               <span>Items Per Page</span>
               <select style={{ padding: '0.4rem 0.75rem', borderRadius: '0.25rem', border: '1px solid hsl(var(--border))', background: 'white', outline: 'none', color: '#111827', fontWeight: 600 }}>
                 <option>5</option>
                 <option>10</option>
                 <option>25</option>
               </select>
               <span>1-{Math.min(logs.length, 5)} of {logs.length} items</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <button style={{ padding: '0.5rem 0.75rem', border: 'none', background: '#f3f4f6', borderRadius: '0.5rem', color: '#9ca3af', cursor: 'not-allowed' }}>&lt;</button>
               <button style={{ padding: '0.5rem 0.85rem', border: 'none', background: 'hsl(var(--primary))', borderRadius: '0.5rem', color: '#111827', fontWeight: 700, cursor: 'pointer' }}>1</button>
               <button style={{ padding: '0.5rem 0.85rem', border: 'none', background: 'white', borderRadius: '0.5rem', color: '#4b5563', fontWeight: 500, cursor: 'pointer', border: '1px solid hsl(var(--border))' }}>2</button>
               <button style={{ padding: '0.5rem 0.85rem', border: 'none', background: 'white', borderRadius: '0.5rem', color: '#4b5563', fontWeight: 500, cursor: 'pointer', border: '1px solid hsl(var(--border))' }}>3</button>
               <button style={{ padding: '0.5rem 0.75rem', border: 'none', background: 'white', borderRadius: '0.5rem', color: '#4b5563', cursor: 'pointer', border: '1px solid hsl(var(--border))' }}>&gt;</button>
            </div>
         </div>
      </div>
    </div>
  );
}
