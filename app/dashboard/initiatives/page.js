'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import ReductionEngine from '@/components/ReductionEngine';

const SUGGESTED_TEMPLATES = [
  { title: "Renewable Energy Adoption", scope_type: "Scope 2 - Indirect", target: 323, metric: "MWh Target", desc: "Transition to renewable energy sources such as solar, wind, or hydroelectric." },
  { title: "Supply Chain Electrification", scope_type: "Scope 3 - Logistics", target: 35, metric: "% EV Target", desc: "Implement electric logistics vehicles for primary distribution routes." },
  { title: "Zero Waste Campus Protocol", scope_type: "Scope 3 - Operations", target: 90, metric: "% Diversion", desc: "Enforce strict recycling and composting programs across all main site facilities." }
];

export default function Initiatives() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [stats, setStats] = useState({ total: 0, topCategory: 'N/A', count: 0 });
  const [orgInitiatives, setOrgInitiatives] = useState([]);
  const [myInitiatives, setMyInitiatives] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const router = useRouter();

  const fetchState = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    setUser(session.user);
    
    // 1. Get User Profile & Setup
    const { data: userData } = await supabase.from('users').select('organization_id, role').eq('id', session.user.id).single();
    if (userData?.organization_id) {
      setOrgId(userData.organization_id);
      setRole(userData.role);
      
      // 2. Hydrate AI Stats
      const { data: logs } = await supabase.from('activity_data').select('carbon_emission').eq('organization_id', userData.organization_id);
      if (logs) {
        setStats({ total: logs.reduce((a, b) => a + (b.carbon_emission || 0), 0), topCategory: 'Energy', count: logs.length });
      }

      // 3. Fetch Organization Initiatives (Company-wide active)
      // Note: Catching errors cleanly until user applies SQL Migration
      const { data: orgInits, error: orgErr } = await supabase.from('organization_initiatives').select('*').order('created_at', { ascending: false });
      if (!orgErr && orgInits) setOrgInitiatives(orgInits);

      // 4. Fetch My Followed Initiatives
      const { data: myInits, error: myErr } = await supabase.from('user_initiatives').select('*, organization_initiatives(*)').eq('user_id', session.user.id);
      if (!myErr && myInits) setMyInitiatives(myInits.map(m => ({ ...m.organization_initiatives, id: m.initiative_id })));
    }
  };

  useEffect(() => { fetchState(); }, [router]);

  const handleLaunchInitiative = async (template) => {
    if (loadingAction || !orgId) return;
    setLoadingAction(true);
    const result = await supabase.from('organization_initiatives').insert({
       organization_id: orgId,
       title: template.title,
       description: template.desc,
       scope_type: template.scope_type,
       target_metric: template.metric,
       target_value: template.target,
       status: 'active'
    });
    if (!result.error) await fetchState();
    setLoadingAction(false);
  };

  const handleJoinInitiative = async (initiativeId) => {
    if (loadingAction || !user) return;
    setLoadingAction(true);
    const result = await supabase.from('user_initiatives').insert({
       user_id: user.id,
       initiative_id: initiativeId,
       status: 'following'
    });
    if (!result.error) await fetchState();
    setLoadingAction(false);
  };

  if (!user || !role) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading collaborative workspace...</div>;

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Pipeline */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, maxWidth: '450px' }}>
          <div style={{ background: 'white', padding: '0.75rem 1.75rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid hsl(var(--border))' }}>
            <svg width="18" height="18" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Type here to search.." style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', boxShadow: 'none', padding: 0, fontSize: '0.95rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1.25rem', opacity: 0.9, alignItems: 'center' }}>
             <svg width="22" height="22" fill="#fcd34d" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
             <svg width="22" height="22" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.5rem 1.25rem 0.5rem 0.5rem', borderRadius: '2rem', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid hsl(var(--border))' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'hsl(var(--sidebar))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>{userInitials}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827', textTransform: 'capitalize' }}>{userName}</span>
              <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, textTransform: 'capitalize' }}>{role}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Admin AI Engine Panel */}
      {role === 'admin' && (
        <div style={{ marginBottom: '2rem' }}>
          <ReductionEngine stats={stats} />
        </div>
      )}

      {/* My Followed Initiatives */}
      {myInitiatives.length > 0 && (
        <div className="glass" style={{ padding: '2.5rem', margin: '2rem 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>My Collaborative Progress</h2>
              <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '2rem', padding: '0.25rem' }}>
                <button style={{ padding: '0.5rem 1.5rem', borderRadius: '2rem', border: 'none', background: 'hsl(var(--primary))', color: '#111827', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Active {String(myInitiatives.length).padStart(2, '0')}</button>
              </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             {myInitiatives.map((init, i) => (
                <div key={init.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: '1rem', padding: '2rem', display: 'flex', gap: '4rem', alignItems: 'center' }}>
                   <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '6px solid #f3f4f6', borderTopColor: '#c4f03a', borderRightColor: i % 2 === 0 ? '#c4f03a' : '#f3f4f6' }}>
                     <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{i % 2 === 0 ? '26%' : '14%'}</span>
                   </div>
                   <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>{init.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Description</p>
                      <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0 0 1rem 0', lineHeight: 1.4 }}>{init.description}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Scope Type</p>
                      <p style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 800, margin: 0 }}>{init.scope_type}</p>
                   </div>
                   <div style={{ width: '200px' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>{init.target_metric}</p>
                        <p style={{ fontSize: '1.25rem', color: '#111827', fontWeight: 800, margin: 0 }}>{init.target_value} <span style={{fontSize: '0.9rem', color: '#6b7280', fontWeight: 500}}>Target</span></p>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Available Company Initiatives to Join */}
      <div className="glass" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
         <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 2rem 0', letterSpacing: '-0.02em' }}>Company Initiatives</h2>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orgInitiatives.length === 0 ? (
               <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                 No active initiatives found for your organization yet.
               </div>
            ) : orgInitiatives.filter(oi => !myInitiatives.some(mi => mi.id === oi.id)).map(init => (
               <div key={init.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: '1rem', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                  <div style={{ width: '56px', height: '56px', background: 'hsl(var(--primary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" fill="none" stroke="hsl(var(--sidebar))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                     <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>{init.scope_type}</p>
                     <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>{init.title}</h4>
                     <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: '0 0 1rem 0' }}>{init.description}</p>
                     <div>
                       <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>{init.target_metric}</p>
                       <p style={{ fontSize: '1.1rem', color: '#111827', fontWeight: 800, margin: 0 }}>{init.target_value}</p>
                     </div>
                  </div>
                  <button onClick={() => handleJoinInitiative(init.id)} disabled={loadingAction} style={{ padding: '0.5rem 1.25rem', borderRadius: '2rem', border: '1px solid hsl(var(--primary))', background: 'hsla(var(--primary), 0.15)', color: '#111827', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.1rem' }}>+</span> Join Program
                  </button>
               </div>
            ))}
         </div>
      </div>

      {/* Admin Action Section - Templates */}
      {role === 'admin' && (
        <div className="glass" style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
           <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>Launch Industry Templates (Admin Only)</h2>
           <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '800px' }}>Select standardized industry frameworks to officially launch as Collaborative Company Initiatives. Once active, your employees will be able to join them tracking impact.</p>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {SUGGESTED_TEMPLATES.map((tmpl, idx) => (
                <div key={idx} style={{ background: '#f9fafb', border: '1px solid hsl(var(--border))', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                   <p style={{ fontSize: '0.75rem', color: 'hsl(var(--sidebar))', fontWeight: 800, margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>{tmpl.scope_type}</p>
                   <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>{tmpl.title}</h4>
                   <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: '0 0 1.5rem 0', flex: 1 }}>{tmpl.desc}</p>
                   <button onClick={() => handleLaunchInitiative(tmpl)} disabled={loadingAction} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: 'hsl(var(--sidebar))', color: 'white', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                     🚀 Launch for Company
                   </button>
                </div>
              ))}
           </div>
        </div>
      )}

    </div>
  );
}
