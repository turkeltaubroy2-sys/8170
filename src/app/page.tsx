'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    soldiers: 0,
    todayEvents: 0,
    openLists: 0,
    logisticsItems: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [soldiersRes, eventsRes, listsRes, logisticsRes] = await Promise.all([
        supabase.from('soldiers').select('id', { count: 'exact', head: true }),
        supabase
          .from('schedules')
          .select('*')
          .gte('start_time', new Date().toISOString().split('T')[0])
          .order('start_time', { ascending: true })
          .limit(5),
        supabase.from('lists').select('id', { count: 'exact', head: true }),
        supabase.from('logistics').select('id', { count: 'exact', head: true }),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayEventsRes = await supabase
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .gte('start_time', today)
        .lt('start_time', today + 'T23:59:59');

      setStats({
        soldiers: soldiersRes.count || 0,
        todayEvents: todayEventsRes.count || 0,
        openLists: listsRes.count || 0,
        logisticsItems: logisticsRes.count || 0,
      });
      setUpcomingEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'בוקר טוב' : now.getHours() < 17 ? 'צהריים טובים' : 'ערב טוב';

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2>🏠 לוח בקרה</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {greeting} | {now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <span className="header-badge">🎖️ פלוגה 8170</span>
        </div>

        <div className="page-body">
          {/* Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #1a2f12 50%, var(--bg-card) 100%)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 32px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0.04, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent)' }}>ברוכים הבאים למערכת פלוגה 8170</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>מערכת ניהול לוגיסטית אינטגרטיבית למילואים</p>
            </div>
            <div style={{ fontSize: '4rem', position: 'relative' }}>🎖️</div>
          </div>

          {/* Stats Grid */}
          <div className="card-grid card-grid-4" style={{ marginBottom: 28 }}>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{loading ? '—' : stats.soldiers}</h3>
                <p>חיילים בפלוגה</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(200,168,75,0.2)' }}>📅</div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--accent)' }}>{loading ? '—' : stats.todayEvents}</h3>
                <p>אירועים היום</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(41,128,185,0.2)' }}>📋</div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--info)' }}>{loading ? '—' : stats.openLists}</h3>
                <p>רשימות פעילות</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(39,174,96,0.2)' }}>📦</div>
              <div className="stat-info">
                <h3 style={{ color: 'var(--success)' }}>{loading ? '—' : stats.logisticsItems}</h3>
                <p>פריטי ציוד</p>
              </div>
            </div>
          </div>

          <div className="card-grid card-grid-2" style={{ marginBottom: 28 }}>
            {/* Upcoming Events */}
            <div className="card">
              <div className="section-header">
                <h3>📅 אירועים קרובים</h3>
              </div>
              {loading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
              ) : upcomingEvents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '20px 0' }}>אין אירועים מתוכננים</p>
              ) : (
                <div>
                  {upcomingEvents.map((ev) => (
                    <div key={ev.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 4, borderRadius: 4, background: ev.color || 'var(--accent)', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ev.title}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatDateTime(ev.start_time)}{ev.location ? ` · ${ev.location}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="card">
              <div className="section-header">
                <h3>⚡ גישה מהירה</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { href: '/personnel', icon: '👥', label: 'אנשי הפלוגה', desc: 'צפה בכל החיילים לפי מחלקות' },
                  { href: '/schedule', icon: '📅', label: 'לוח שנה', desc: 'נהל אירועים ולוז' },
                  { href: '/lists', icon: '📋', label: 'רשימות', desc: 'צור ועקוב אחר משימות' },
                  { href: '/media', icon: '📸', label: 'גלריה', desc: 'העלה תמונות וסרטונים' },
                  { href: '/staff', icon: '👁️', label: 'מבט על סגל', desc: 'סקירת כל הכוחות' },
                ].map((item) => (
                  <a key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)', textDecoration: 'none',
                    transition: 'all 0.2s', color: 'var(--text)'
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                    <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div style={{
            background: 'rgba(200,168,75,0.08)',
            border: '1px solid rgba(200,168,75,0.2)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ fontSize: '1.2rem' }}>💡</span>
            <span>כל חייל מקבל לינק אישי לפורטל שלו דרך דף <strong style={{ color: 'var(--accent)' }}>אנשי הפלוגה</strong>. הסגל יכול לצפות בכל הנתונים דרך <strong style={{ color: 'var(--accent)' }}>מבט על - סגל</strong>.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
