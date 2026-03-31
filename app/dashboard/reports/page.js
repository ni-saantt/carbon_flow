'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function Reports() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCO2, setTotalCO2] = useState(0);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: userData } = await supabase.from('users').select('organization_id').eq('id', session.user.id).single();
      
      if (userData?.organization_id) {
        const { data: logs } = await supabase
          .from('activity_data')
          .select(`id, quantity, date_logged, carbon_emission, emission_factors (category, unit)`)
          .eq('organization_id', userData.organization_id)
          .order('date_logged', { ascending: false });
          
        if (logs) {
          setActivities(logs);
          setTotalCO2(logs.reduce((acc, curr) => acc + (curr.carbon_emission || 0), 0));
        }
      }
      setLoading(false);
    };
    fetchActivities();
  }, []);

  const handlePrint = () => window.print();

  const exportCSV = () => {
    if (activities.length === 0) return;
    const headers = ['Date Logged', 'Category', 'Quantity', 'Unit', 'CO2 Emission (kg)'];
    const rows = activities.map(l => [l.date_logged, l.emission_factors?.category, l.quantity, l.emission_factors?.unit, l.carbon_emission].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "carbon_report_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <style>{`
        @media print {
          .print-hide { display: none !important; }
          aside { display: none !important; }
          main { overflow: visible !important; }
          .glass { background: transparent !important; border: 1px solid #ccc !important; box-shadow: none !important; color: black !important; }
          body { background: white !important; color: black !important; }
          * { color: black !important; }
        }
      `}</style>
      
      <header className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Carbon Reports</h2>
          <p style={{ opacity: 0.7, margin: 0 }}>Review and export your organization's emission logs.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={exportCSV} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'inherit', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            Export CSV
          </button>
          <button onClick={handlePrint} style={{ padding: '0.75rem 1.5rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
            Print PDF
          </button>
        </div>
      </header>

      {/* Summary Box */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', marginBottom: '2rem', borderTop: '4px solid hsl(var(--primary))' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Report Summary</h3>
        <div style={{ display: 'flex', gap: '4rem' }}>
          <div>
            <p style={{ opacity: 0.7, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Emitted</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--primary))', margin: 0 }}>
              {totalCO2.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.8 }}>kg CO₂e</span>
            </p>
          </div>
          <div>
             <p style={{ opacity: 0.7, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Logs</p>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>
              {activities.length} <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.8 }}>entries</span>
            </p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Quantity</th>
              <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>CO₂ Emmission</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading reports...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>No activities logged yet.</td></tr>
            ) : (
              activities.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>{log.date_logged}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{log.emission_factors?.category}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{log.quantity} {log.emission_factors?.unit}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>{log.carbon_emission} kg</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
