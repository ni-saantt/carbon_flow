'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Registration successful! Please check your email or log in directly if email verification is off.');
      setTimeout(() => router.push('/login'), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '420px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>CarbonFlow</h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', opacity: 0.7, fontSize: '0.9rem' }}>Create an organization account</p>
        
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && <div style={{ color: '#ff6b6b', fontSize: '0.875rem', background: 'rgba(255,107,107,0.1)', padding: '0.5rem', borderRadius: '0.25rem' }}>{error}</div>}
          {message && <div style={{ color: '#51cf66', fontSize: '0.875rem', background: 'rgba(81,207,102,0.1)', padding: '0.5rem', borderRadius: '0.25rem' }}>{message}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'transparent', color: 'inherit', outline: 'none' }}
            />
          </div>
          
          <button type="submit" style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, marginTop: '1rem', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}>
            Sign Up
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', opacity: 0.8 }}>
          Already have an account? <a href="/login" style={{ color: 'hsl(var(--primary))', textDecoration: 'none', fontWeight: 600 }}>Log in</a>
        </p>
      </div>
    </div>
  );
}
