'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [org, setOrg] = useState({ name: '', industry: '' });
  const [joinOrgId, setJoinOrgId] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: userData } = await supabase.from('users').select('*, organizations(*)').eq('id', session.user.id).single();
      
      if (userData) {
        setCurrentUser(userData);
        if (userData.organizations) {
          setOrg(userData.organizations);
          // Fetch team safely bypassing restrictive SELECT RLS
          const res = await fetch(`/api/team?orgId=${userData.organizations.id}`);
          const json = await res.json();
          if (json.users) setUsers(json.users);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleCreateOrUpdateOrg = async (e) => {
    e.preventDefault();
    setMessage('Saving...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!org.id) {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: org.name, industry: org.industry, userId: session.user.id })
      });
      const result = await res.json();
      if (res.ok) {
        setOrg(result.organization);
        setMessage('Organization created and linked successfully!');
        const tReq = await fetch(`/api/team?orgId=${result.organization.id}`);
        const tJson = await tReq.json();
        if (tJson.users) setUsers(tJson.users);
      } else setMessage(`Error: ${result.error}`);
    } else {
      const res = await fetch('/api/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: org.id, name: org.name, industry: org.industry })
      });
      const result = await res.json();
      if (res.ok) setMessage('Organization details updated successfully.');
      else setMessage(`Error: ${result.error}`);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    setMessage('Joining...');
    const { data: { session } } = await supabase.auth.getSession();
    
    const res = await fetch('/api/organizations/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: joinOrgId, userId: session.user.id })
    });
    const result = await res.json();
    
    if (res.ok) {
      setOrg(result.organization);
      setMessage(`Successfully joined ${result.organization.name}!`);
      const tReq = await fetch(`/api/team?orgId=${result.organization.id}`);
      const tJson = await tReq.json();
      if (tJson.users) setUsers(tJson.users);
    } else {
      setMessage(`Error: ${result.error}`);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    const res = await fetch('/api/team', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, newRole, requesterId: currentUser.id })
    });
    const json = await res.json();
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert(`Role update failed: ${json.error}`);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading settings...</div>;

  // Unlinked User View
  if (!org.id) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Welcome to CarbonFlow!</h2>
          <p style={{ opacity: 0.7, margin: 0 }}>To start tracking, please create a new organization or join your team's existing one.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Create Form */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', borderTop: '4px solid hsl(var(--primary))' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Start Fresh: Create Organization</h3>
            <form onSubmit={handleCreateOrUpdateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Organization Name</label>
                <input type="text" required value={org.name || ''} onChange={e => setOrg({...org, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }} placeholder="e.g. Acme Corp" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Industry</label>
                <input type="text" required value={org.industry || ''} onChange={e => setOrg({...org, industry: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }} placeholder="e.g. Logistics" />
              </div>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Create Org</button>
            </form>
          </div>

          {/* Join Form */}
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Team Member: Join Existing</h3>
            <form onSubmit={handleJoinOrg} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Organization Join Code (ID)</label>
                <input type="text" required value={joinOrgId} onChange={e => setJoinOrgId(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }} placeholder="Paste ID from your Administrator" />
              </div>
              <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'transparent', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary))', cursor: 'pointer', fontWeight: 600 }}>Join Team</button>
            </form>
          </div>
        </div>

        {message && <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '0.5rem', background: message.includes('Error') ? 'rgba(255,100,100,0.1)' : 'rgba(100,255,100,0.1)', color: message.includes('Error') ? '#ff6b6b' : '#51cf66' }}>{message}</div>}
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'Administrator';

  // Linked User View (Organization Console)
  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Organization Settings</h2>
          <p style={{ opacity: 0.7, margin: 0 }}>Manage your organization profile and team members.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed var(--border)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>Your Organization Join ID (Share with your team):</p>
          <code style={{ fontSize: '1rem', color: 'hsl(var(--primary))', userSelect: 'all', cursor: 'copy' }}>{org.id}</code>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Profile Details</h3>
          <form onSubmit={handleCreateOrUpdateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Organization Name</label>
              <input type="text" value={org.name || ''} onChange={e => setOrg({...org, name: e.target.value})} disabled={!isAdmin} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none', opacity: isAdmin ? 1 : 0.6 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Industry</label>
              <input type="text" value={org.industry || ''} onChange={e => setOrg({...org, industry: e.target.value})} disabled={!isAdmin} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none', opacity: isAdmin ? 1 : 0.6 }} />
            </div>
            {message && <div style={{ fontSize: '0.875rem', padding: '0.75rem', borderRadius: '0.5rem', background: message.includes('Error') ? 'rgba(255,100,100,0.1)' : 'rgba(100,255,100,0.1)', color: message.includes('Error') ? '#ff6b6b' : '#51cf66' }}>{message}</div>}
            {isAdmin && (
              <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, width: 'fit-content' }}>Save Changes</button>
            )}
          </form>
        </div>

        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Team Members</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {users.map(u => (
              <li key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{u.email} {u.id === currentUser.id && '(You)'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7 }}>Employee ID: {u.id.substring(0,8)}... &bull; Current Role: {u.role}</p>
                </div>
                {isAdmin && u.id !== currentUser.id ? (
                  <select 
                    value={u.role || 'Organization User'} 
                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--card)', color: 'inherit', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Management">Management</option>
                    <option value="Analyst">Analyst</option>
                    <option value="Organization User">Organization User</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '0.875rem', padding: '0.2rem 0.6rem', border: '1px solid var(--border)', borderRadius: '0.5rem', opacity: 0.8 }}>
                    {u.role || 'Organization User'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
