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
    <div className="glass animate-fade-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem 0', fontWeight: 800, color: '#111827' }}>✨ AI Sustainability Strategist</h3>
          <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0, maxWidth: '600px', color: '#4b5563', fontWeight: 500 }}>
            Harness live Large Language Models to analyze your exact footprint composition and generate a corporate-grade, actionable reduction blueprint.
          </p>
        </div>
        <button 
          onClick={generateReport}
          disabled={loading || stats.total === 0}
          className="btn-primary"
          style={{ opacity: loading || stats.total === 0 ? 0.6 : 1 }}
        >
          {loading ? 'Analyzing Carbon Data...' : 'Generate Real AI Report'}
        </button>
      </div>

      {error && (
        <div className="animate-fade-in" style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {aiResponse ? (
        <div className="animate-fade-in" style={{ 
          background: 'hsl(var(--background))', 
          padding: '2.5rem', 
          borderRadius: '1rem', 
          border: '1px solid hsl(var(--border))', 
          lineHeight: 1.8,
          fontSize: '1rem',
          color: '#1f2937',
          fontWeight: 500
        }}>
          {aiResponse.split('\n').filter(line => line.trim() !== '').map((line, i) => (
            <p key={i} style={{ margin: '0 0 1.25rem 0' }}>{line}</p>
          ))}
        </div>
      ) : (
        <div style={{ padding: '3.5rem', textAlign: 'center', color: '#9ca3af', border: '2px dashed hsl(var(--border))', borderRadius: '1rem', fontWeight: 500 }}>
          {stats.total > 0 
            ? 'Click the button above to securely pass your timeline metrics to the AI reasoning engine.' 
            : 'Log some activity data to unlock the AI Analysis engine.'}
        </div>
      )}
    </div>
  );
}
