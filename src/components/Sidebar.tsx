'use client';
import { Home, Calendar, ClipboardList, Users, Shield, Package, Image as ImageIcon, Clock, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: <Home size={18} />, label: 'ראשי' },
  { href: '/schedule', icon: <Calendar size={18} />, label: 'לו"ז' },
  { href: '/lists', icon: <ClipboardList size={18} />, label: 'משימות' },
  { href: '/guard-duty', icon: <Clock size={18} />, label: 'שמירות' },
  { href: '/logistics', icon: <Package size={18} />, label: 'לוגיסטיקה' },
  { href: '/personnel', icon: <Users size={18} />, label: 'לוחמים' },
  { href: '/media', icon: <ImageIcon size={18} />, label: 'מדיה' },
  { href: '/staff/messages', icon: <Bell size={18} />, label: 'לוח מודעות' },
  { href: '/staff', icon: <Shield size={18} />, label: 'סגל' },
];

export default function Sidebar() {
  const pathname = usePathname();

  // For mobile, we only show the 5 most important icons to avoid crowding
  const mobileNavItems = [
    { href: '/', icon: '🏠', label: 'ראשי' },
    { href: '/schedule', icon: '📅', label: 'לו"ז' },
    { href: '/guard-duty', icon: '🛡️', label: 'שמירות' },
    { href: '/personnel', icon: '👥', label: 'לוחמים' },
    { href: '/staff/messages', icon: '📢', label: 'לוח' },
    { href: '/staff', icon: '👁️', label: 'סגל' },
  ];

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    localStorage.removeItem('plugah_user');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Shield size={32} className="logo-icon" color="var(--accent)" />
          <h1>פלוגה 8170</h1>
          <p>מערכת ניהול מילואים</p>
        </div>
        <nav className="sidebar-nav">
          <p className="nav-section-title">ניווט ראשי</p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="nav-item" style={{ marginTop: 'auto', color: 'var(--danger)' }}>
            <span className="nav-icon">🚪</span>
            התנתק
          </button>
        </nav>
        <div className="sidebar-footer">
          <p>פלוגה 8170 · מילואים</p>
          <p style={{ marginTop: 4 }}>© 2026 כל הזכויות שמורות</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center', 
        padding: '8px 4px',
        gap: 2,
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1000
      }}>
        {mobileNavItems.slice(0, 5).map(item => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
            style={{ flex: 1, minWidth: 0, padding: '4px' }}
          >
            <span className="nav-icon" style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className="bottom-nav-item" style={{ 
          background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer',
          flex: 1, minWidth: 0, padding: '4px'
        }}>
          <span className="nav-icon" style={{ fontSize: '1.2rem' }}>🚪</span>
          <span style={{ fontSize: '0.65rem' }}>יציאה</span>
        </button>
      </nav>
    </>
  );
}
