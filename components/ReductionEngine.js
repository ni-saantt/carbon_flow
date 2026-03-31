'use client';
import { useState } from 'react';

export default function ReductionEngine({ stats }) {
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (stats.total === 0) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats })
      });
      
      const data = await res.json();
      if (res.ok) {
        setAiResponse(data.recommendation);
      } else {
        throw new Error(data.error || 'Failed to generate AI report');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: '1rem', borderTop: '4px solid #8b5cf6', marginTop: '2rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', fontWeight: 600, color: '#a78bfa' }}>✨ AI Sustainability Strategist</h3>
          <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0, maxWidth: '600px' }}>
            Harness live Large Language Models (LLMs) to analyze your dynamic footprint breakdown and generate a corporate-grade reduction strategy.
          </p>
        </div>
        <button 
          onClick={generateReport}
          disabled={loading || stats.total === 0}
          style={{ 
            padding: '0.85rem 1.75rem', 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.5rem', 
            fontWeight: 600, 
            cursor: loading || stats.total === 0 ? 'not-allowed' : 'pointer', 
            boxShadow: '0 4px 15px -5px rgba(139, 92, 246, 0.6)',
            transition: 'transform 0.2s, opacity 0.2s',
            opacity: loading || stats.total === 0 ? 0.6 : 1
          }}
          onMouseOver={e => { if (!loading && stats.total > 0) e.target.style.transform = 'translateY(-2px)' }}
          onMouseOut={e => e.target.style.transform = 'translateY(0)'}
        >
          {loading ? 'Analyzing Carbon Data...' : 'Generate Real AI Report'}
        </button>
      </div>

      {error && (
        <div className="animate-fade-in" style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {aiResponse ? (
        <div className="animate-fade-in" style={{ 
          background: 'rgba(255,255,255,0.02)', 
          padding: '2.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid rgba(139, 92, 246, 0.3)', 
          lineHeight: 1.8,
          fontSize: '1.05rem',
          color: 'rgba(255,255,255,0.95)'
        }}>
          {aiResponse.split('\n').filter(line => line.trim() !== '').map((line, i) => (
            <p key={i} style={{ margin: '0 0 1.25rem 0' }}>{line}</p>
          ))}
        </div>
      ) : (
        <div style={{ padding: '3.5rem', textAlign: 'center', opacity: 0.4, border: '2px dashed var(--border)', borderRadius: '0.75rem' }}>
          {stats.total > 0 
            ? 'Click the button above to securely pass your timeline metrics to the AI reasoning engine.' 
            : 'Log some activity data to unlock the AI Analysis engine.'}
        </div>
      )}
    </div>
  );
}
