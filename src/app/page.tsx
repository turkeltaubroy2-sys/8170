'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import MissionsTab from '@/components/MissionsTab';

export default function Dashboard() {
  const [stats, setStats] = useState({
    soldiers: 0,
    todayEvents: 0,
    openLists: 0,
    logisticsItems: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; title: string; start_time: string; location?: string; color?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'missions'>('dashboard');

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
        supabase.from('missions').select('id', { count: 'exact', head: true }),
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
        <PageHeader 
          title="🏠 לוח בקרה" 
          subtitle={`${greeting} | ${now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          badge="🎖️ פלוגה 8170"
        />

        <div className="tab-menu" style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--border)', marginBottom: 24, padding: '0 24px 10px 24px' }}>
          {[
            { tag: 'dashboard', label: '🏠 לוח בקרה' },
            { tag: 'missions', label: '📋 משימות' },
          ].map(tab => (
            <button key={tab.tag}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1.05rem', 
                fontWeight: activeTab === tab.tag ? 700 : 500, color: activeTab === tab.tag ? 'var(--accent)' : 'var(--text-muted)', 
                borderBottom: activeTab === tab.tag ? '3px solid var(--accent)' : '3px solid transparent',
                padding: '0 4px 6px 4px', transition: 'all 0.2s'
              }}
              onClick={() => setActiveTab(tab.tag as 'dashboard' | 'missions')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="page-body">
          {activeTab === 'dashboard' ? (
            <>
              {/* Hero Banner */}
          <div className="hero-banner">
            <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', opacity: 0.04, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent)', textShadow: 'var(--glow)' }}>ברוכים הבאים למערכת פלוגה 8170</h2>
              <p style={{ color: 'var(--text)', marginTop: 8, fontSize: '1.05rem', fontWeight: 500 }}>מערכת ניהול לוגיסטית אינטגרטיבית למילואים</p>
            </div>
            <div className="hero-icon" style={{ fontSize: '4rem', position: 'relative', zIndex: 1 }}>🎖️</div>
          </div>

          {/* Stats Grid */}
          <div className="card-grid card-grid-4" style={{ marginBottom: 28 }}>
            <StatCard icon="👥" label="חיילים בפלוגה" value={stats.soldiers} loading={loading} />
            <StatCard icon="📅" label="אירועים היום" value={stats.todayEvents} loading={loading} color="var(--accent)" />
            <StatCard icon="📋" label="רשימות פעילות" value={stats.openLists} loading={loading} color="var(--info)" />
            <StatCard icon="📦" label="פריטי ציוד" value={stats.logisticsItems} loading={loading} color="var(--success)" />
          </div>

          <div className="card-grid card-grid-2" style={{ marginBottom: 28 }}>
            {/* Upcoming Events */}
            <Card title="📅 אירועים קרובים">
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
            </Card>

            {/* Quick Links */}
            <Card title="⚡ גישה מהירה">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { href: '/personnel', icon: '👥', label: 'לוחמים', desc: 'צפה ונהל את לוחמי הפלוגה' },
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
            </Card>
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
            </>
          ) : (
            <MissionsTab />
          )}
        </div>
      </main>
    </div>
  );
}
