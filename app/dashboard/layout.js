import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {children}
      </main>
    </div>
  );
}
