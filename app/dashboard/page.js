'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReductionEngine from '@/components/ReductionEngine';

const CATEGORY_COLORS = [
  'hsl(var(--primary))',  // Theme Color
  '#3b82f6',              // Azure Blue
  '#f59e0b',              // Amber
  '#8b5cf6',              // Violet
  '#ec4899',              // Pink
  '#14b8a6',              // Teal
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawLogs, setRawLogs] = useState([]);
  const [timeRange, setTimeRange] = useState('7D');
  const [chartData, setChartData] = useState([]);
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, topCategory: 'N/A', topPercentage: 0, count: 0 });
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data: userData } = await supabase.from('users').select('organization_id').eq('id', session.user.id).single();
      
      if (userData?.organization_id) {
        const { data: logs } = await supabase
          .from('activity_data')
          .select(`carbon_emission, date_logged, emission_factors(category)`)
          .eq('organization_id', userData.organization_id);

        if (logs) {
          setRawLogs(logs);
          const cats = [...new Set(logs.map(l => l.emission_factors?.category || 'Unknown'))];
          setUniqueCategories(cats);
        }
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    if (!rawLogs.length) return;

    const now = new Date();
    let cutoff = new Date(0); 
    
    if (timeRange === '7D') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    else if (timeRange === '30D') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    else if (timeRange === '3M') cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    else if (timeRange === '6M') cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const filteredLogs = timeRange !== 'All' 
      ? rawLogs.filter(log => new Date(log.date_logged) >= cutoff)
      : rawLogs;

    // KPI Calc
    const total = filteredLogs.reduce((acc, log) => acc + (log.carbon_emission || 0), 0);
    const categoryTotals = filteredLogs.reduce((acc, log) => {
      const cat = log.emission_factors?.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + (log.carbon_emission || 0);
      return acc;
    }, {});

    let topCat = 'N/A', topVal = 0;
    for (const [cat, val] of Object.entries(categoryTotals)) {
      if (val > topVal) { topVal = val; topCat = cat; }
    }
    
    setStats({
      total,
      topCategory: topCat,
      topPercentage: total > 0 ? Math.round((topVal / total) * 100) : 0,
      count: filteredLogs.length,
      categoryTotals
    });

    const isDaySlices = timeRange === '7D' || timeRange === '30D';
    let localChart = [];
    const today = new Date();
    
    // Create zero scaffold
    const baseZeros = {};
    uniqueCategories.forEach(c => baseZeros[c] = 0);
    
    if (isDaySlices) {
      const daysCount = timeRange === '7D' ? 7 : 30;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const name = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        localChart.push({ name, rawDate: d.toISOString().split('T')[0], ...baseZeros });
      }
    } else {
      const monthsCount = timeRange === '3M' ? 3 : timeRange === '6M' ? 6 : 12;
      for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const name = d.toLocaleString('default', { month: 'short' });
        const rawDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        localChart.push({ name, rawDate, ...baseZeros });
      }
    }
    
    filteredLogs.forEach(log => {
      const d = new Date(log.date_logged);
      const logRawDate = isDaySlices 
        ? d.toISOString().split('T')[0]
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
      const cat = log.emission_factors?.category || 'Unknown';
      const point = localChart.find(p => p.rawDate === logRawDate);
      if (point) point[cat] += (log.carbon_emission || 0);
    });
    
    setChartData(localChart.map(p => {
      const clean = { name: p.name };
      uniqueCategories.forEach(c => clean[c] = Number(p[c].toFixed(2)));
      return clean;
    }));
    
  }, [rawLogs, timeRange, uniqueCategories]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Overview</h2>
          <p style={{ opacity: 0.7, margin: 0 }}>Track and analyze your carbon footprint.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>{user.email}</span>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', color: 'inherit', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
          >Sign Out</button>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', borderTop: `4px solid ${CATEGORY_COLORS[0]}` }}>
          <h4 style={{ opacity: 0.8, fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Total Emissions</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.total.toFixed(2)} <span style={{ fontSize: '1rem', opacity: 0.7, fontWeight: 400 }}>kg CO₂e</span></p>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h4 style={{ opacity: 0.8, fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Top Category</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.topCategory} <span style={{ fontSize: '1rem', opacity: 0.7, fontWeight: 400 }}>({stats.topPercentage}%)</span></p>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <h4 style={{ opacity: 0.8, fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>Entries ({timeRange})</h4>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stats.count} <span style={{ fontSize: '1rem', opacity: 0.7, fontWeight: 400 }}>logs</span></p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '1rem', minHeight: '480px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Emission Dynamics Breakdown</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
               {uniqueCategories.map((cat, idx) => (
                 <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', opacity: 0.9 }}>
                   <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                   {cat}
                 </div>
               ))}
            </div>
          </div>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--card)', color: 'inherit', outline: 'none', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          >
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="All">All Time (12M)</option>
          </select>
        </div>
        <div style={{ width: '100%', height: '350px' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {uniqueCategories.map((cat, idx) => (
                    <linearGradient key={cat} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} stopOpacity={0.05}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="currentColor" 
                  opacity={0.5} 
                  tick={{fill: 'currentColor', fontSize: 13, fontWeight: 500}} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={15} 
                />
                <YAxis 
                  stroke="currentColor" 
                  opacity={0.5} 
                  tick={{fill: 'currentColor', fontSize: 13, fontWeight: 500}} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-15} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', color: 'white', backdropFilter: 'blur(10px)', padding: '1.25rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} 
                  itemStyle={{ fontWeight: 'bold' }}
                  labelStyle={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                {uniqueCategories.map((cat, idx) => (
                  <Area 
                    key={cat}
                    type="monotone" 
                    dataKey={cat} 
                    stackId="1"
                    stroke={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill={`url(#color-${idx})`} 
                    activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2 }} 
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, fontStyle: 'italic' }}>
              No data available.
            </div>
          )}
        </div>
      </div>

      <ReductionEngine stats={stats} />
    </div>
  );
}
