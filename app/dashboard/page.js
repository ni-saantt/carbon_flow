'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const CATEGORY_COLORS = [
  '#c4f03a',  // Lime
  '#84cc16',  // Light Green
  '#22c55e',  // Green
  '#15803d',  // Forest Green
  '#064e3b',  // Very Dark Green
  '#022c22',  // Almost Black Green
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawLogs, setRawLogs] = useState([]);
  const [timeRange, setTimeRange] = useState('6M');
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, topCategory: 'N/A', topPercentage: 0, count: 0 });
  const [role, setRole] = useState('Member');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data: userData } = await supabase.from('users').select('organization_id, role').eq('id', session.user.id).single();
      if (userData?.role) setRole(userData.role);
      
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

    // Generate PieChart Data for Top Admissions (Top 5 categories)
    const sortedTotals = Object.entries(categoryTotals).sort((a,b) => b[1]-a[1]);
    const extractedPieData = sortedTotals.map(([name, value]) => ({ name, value })).slice(0, 5);
    setPieData(extractedPieData);

    const isDaySlices = timeRange === '7D' || timeRange === '30D';
    let localChart = [];
    const today = new Date();
    
    // Create zero scaffold for stacking
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

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.substring(0, 2).toUpperCase();

  const dynamicInitiatives = (() => {
    if (!stats || stats.total === 0) return [
      { icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>, title: "Log your first emission data to generate custom localized reduction insights!" }
    ];

    const sorted = Object.entries(stats.categoryTotals).sort((a,b) => b[1]-a[1]);
    const top = sorted[0] || ['Unknown', 0];
    const second = sorted[1] || null;

    const cards = [
      { 
        icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>, 
        title: `Slashing your ${top[0]} footprint by just 15% would save ${Math.round(top[1] * 0.15).toLocaleString()} kg CO2e annually!` 
      }
    ];

    if (second) {
      cards.push({
        icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
        title: `${second[0]} is your second largest emitter at ${Math.round((second[1]/stats.total)*100)}%. Targeting this could drastically lower baseline operational draw.`
      });
    }

    cards.push({
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8l4 4-4 4M8 12h8"/></svg>,
      title: `Your dataset is actively tracking ${stats.count} distinct emission entries across ${Object.keys(stats.categoryTotals).length} operational sectors.`
    });

    cards.push({
      icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
      title: `If your growth rate stays constant, your projected footprint will hit ${Math.round(stats.total * 1.05).toLocaleString()} kg CO2e next year. A 5% offset plan is recommended.`
    });

    return cards;
  })();

  return (
    <div className="animate-fade-in" style={{ padding: '0 1rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* Header Pipeline Replacement (SVGs + Branding) */}
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

      {/* KPI Cards Row */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', background: 'hsl(var(--sidebar))', color: 'white', padding: '2rem 2.25rem', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(32, 97, 53, 0.4)' }}>
          <h4 style={{ opacity: 0.9, fontSize: '1.05rem', marginBottom: '1rem', fontWeight: 500, color: 'white' }}>Total Emissions</h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.02em' }}>
            {stats.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}<span style={{ fontSize: '1.25rem', opacity: 0.9, fontWeight: 500, marginLeft: '0.3rem' }}>t CO2e</span>
          </p>
          <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
             <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 6l-9.5 9.5-5-5L1 18"/><polyline points="16 6 23 6 23 13"/></svg>
             5% Lower to previous year
          </div>
        </div>
        
        <div className="glass" style={{ flex: '2 1 600px', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ color: '#111827', fontSize: '1.15rem', marginBottom: '1.5rem', fontWeight: 800 }}>Scope Breakdown</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
             <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Scope 1 - Direct Emissions</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>{stats.topCategory.toUpperCase()} <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>DOMINANT</span></p>
             </div>
             <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Scope 2 - Indirect Emissions</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>{stats.count}<span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}> ENTRIES</span></p>
             </div>
             <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>Scope 3 - Historical Track</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>{timeRange}<span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}> HISTORY</span></p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="glass" style={{ padding: '2.5rem', minHeight: '520px', marginBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.25rem 0', fontWeight: 500, color: '#6b7280' }}>Monthly Emissions</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.02em' }}>Carbon Footprint</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: '#111827', letterSpacing: '-0.02em' }}>
              {(stats.total / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}<span style={{ fontSize: '1.25rem', color: '#6b7280', fontWeight: 500, marginLeft: '0.3rem' }}>t CO2e / avg month</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <select 
               value={timeRange} 
               onChange={(e) => setTimeRange(e.target.value)}
               style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', border: '1px solid hsl(var(--border))', background: 'white', color: '#111827', outline: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
             >
               <option value="7D">Last 7 Days</option>
               <option value="30D">Last 30 Days</option>
               <option value="3M">Latest 3 Months</option>
               <option value="6M">January - June</option>
               <option value="All">All Time (12M)</option>
             </select>
          </div>
        </div>
        
        <div style={{ width: '100%', height: '400px', marginTop: '1rem' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                <YAxis stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 13, fontWeight: 500}} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: 'white', borderColor: 'hsl(var(--border))', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} itemStyle={{ fontWeight: 'bold' }} labelStyle={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid hsl(var(--border))' }} />
                <Legend wrapperStyle={{ paddingTop: '25px', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }} iconSize={12} iconType="square" />
                {uniqueCategories.map((cat, idx) => (
                  <Bar key={cat} dataKey={cat} stackId="1" fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
              No data available.
            </div>
          )}
        </div>
      </div>

      {/* Doughnut Charts Row */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="glass" style={{ flex: '1 1 450px', padding: '2rem 2.5rem' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Top Emissions</h4>
          {pieData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
              <div style={{ width: '180px', height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}></div>
                        <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600 }}>{d.name.length > 15 ? d.name.substring(0,15)+'...' : d.name}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 800 }}>{stats.total > 0 ? Math.round((d.value/stats.total)*100) : 0}%</span>
                    </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#9ca3af', fontStyle: 'italic', padding: '1rem 0' }}>No category data to display.</div>
          )}
        </div>
        
        <div className="glass" style={{ flex: '1 1 450px', padding: '2rem 2.5rem' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Total Emissions / Offset</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <div style={{ width: '180px', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{value: stats.total || 1, fill: '#15803d'}, {value: (stats.total || 1) * 0.11, fill: '#c4f03a'}]} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    <Cell fill="#15803d" />
                    <Cell fill="#c4f03a" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#15803d' }}></div>
                    <span style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase' }}>Total Emissions</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{stats.total.toLocaleString(undefined, {maximumFractionDigits:0})} <span style={{fontSize: '1rem', color: '#6b7280', fontWeight: 500}}>Tonnes</span></p>
              </div>
              <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c4f03a' }}></div>
                    <span style={{ fontSize: '0.75rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase' }}>Offset</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>{Math.round(stats.total * 0.11).toLocaleString()} <span style={{fontSize: '1rem', color: '#6b7280', fontWeight: 500}}>Tonnes</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reduction Initiatives Row */}
      <div className="glass" style={{ padding: '2rem 2.5rem', marginBottom: '2rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
           <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>Reduction Initiatives</h4>
           <div style={{ display: 'flex', gap: '0.75rem', color: '#6b7280' }}>
             <button style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '1.2rem' }}>&larr;</button>
             <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111827', fontSize: '1.2rem', fontWeight: 700 }}>&rarr;</button>
           </div>
         </div>
         <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {dynamicInitiatives.map((initiative, i) => (
              <div key={i} style={{ minWidth: '320px', border: '1px solid hsl(var(--border))', borderRadius: '1rem', padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', transition: 'box-shadow 0.2s', cursor: 'pointer', ':hover': { boxShadow: '0 4px 15px rgba(0,0,0,0.05)' } }}>
                 <div style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'hsl(var(--primary))', color: 'hsl(var(--sidebar))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                   {initiative.icon}
                 </div>
                 <div>
                   <p style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 700, margin: '0 0 0.35rem 0', textTransform: 'uppercase' }}>Did you know that..?</p>
                   <p style={{ fontSize: '0.85rem', color: '#111827', fontWeight: 800, lineHeight: 1.4, margin: 0 }}>{initiative.title}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
}
