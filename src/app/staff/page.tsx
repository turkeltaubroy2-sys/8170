'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Download, RefreshCcw, LayoutDashboard, Send, FileText, AlertTriangle, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import StaffRequests from '@/components/StaffRequests';
import StaffForms from '@/components/StaffForms';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

type SoldierWithPortal = {
  id: string;
  full_name: string;
  rank: string;
  role: string;
  phone: string;
  photo_url: string;
  unique_token: string;
  department_id: string;
  pakalim?: string[];
  departments?: { name: string; icon: string };
  soldier_portals?: {
    status: string;
    health_declaration: string;
    equipment_notes: string;
    personal_notes: string;
    updated_at: string;
  };
};

const statusColors: Record<string, string> = {
  'בבית': '#2980b9', 'בדרך': '#f39c12', 'בפלוגה': '#27ae60',
  'בחופש': '#8e44ad', 'מחכה לציוד': '#c0392b', 'אחר': '#7f8c8d',
};

const healthColors: Record<string, string> = {
  'תקין': '#27ae60', 'חלש': '#f39c12', 'פצוע': '#c0392b', 'בבית חולים': '#c0392b', 'פטור רפואי': '#8e44ad',
};

export default function StaffPage() {
  const [soldiers, setSoldiers] = useState<SoldierWithPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDep, setFilterDep] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'cards'>('cards');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'forms'>('overview');

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const [depsRes, soldiersRes] = await Promise.all([
      supabase.from('departments').select('id, name, icon').order('order'),
      supabase.from('soldiers').select('*, departments(name,icon), soldier_portals(status,health_declaration,equipment_notes,personal_notes,updated_at)').order('full_name'),
    ]);
    setDepartments(depsRes.data || []);
    setSoldiers(soldiersRes.data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchAll();
    };
    load();
  }, [fetchAll]);

  const filtered = soldiers.filter(s => {
    const matchDep = !filterDep || s.department_id === filterDep;
    const matchStatus = !filterStatus || s.soldier_portals?.status === filterStatus;
    const matchSearch = !search || s.full_name.includes(search) || s.role?.includes(search);
    return matchDep && matchStatus && matchSearch;
  });

  const stats = {
    total: soldiers.length,
    atBase: soldiers.filter(s => s.soldier_portals?.status === 'בפלוגה').length,
    atHome: soldiers.filter(s => s.soldier_portals?.status === 'בבית').length,
    enRoute: soldiers.filter(s => s.soldier_portals?.status === 'בדרך').length,
    injured: soldiers.filter(s => s.soldier_portals?.health_declaration !== 'תקין' && s.soldier_portals?.health_declaration).length,
    missingEquip: soldiers.filter(s => s.soldier_portals?.equipment_notes).length,
    noPortal: soldiers.filter(s => !s.soldier_portals).length,
  };

  const formatTime = (dt?: string) => dt ? new Date(dt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const exportCSV = () => {
    const headers = ['שם מלא', 'מחלקה', 'טלפון', 'סטטוס', 'הצהרת בריאות', 'פק"לים', 'הערות ציוד', 'הערות אישיות', 'עדכון אחרון'];
    const rows = filtered.map(s => [
      s.full_name || '',
      s.departments?.name || '',
      s.phone || '',
      s.soldier_portals?.status || 'לא עדכן',
      s.soldier_portals?.health_declaration || '',
      (s.pakalim || []).join(', '),
      s.soldier_portals?.equipment_notes || '',
      s.soldier_portals?.personal_notes || '',
      formatTime(s.soldier_portals?.updated_at)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `דוח_כוחות_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <PageHeader 
          title="🛡️ מבט על — סגל" 
          subtitle="מצב כוחות בזמן אמת" 
          badge="סגל בלבד"
          actions={(
            <div style={{ display: 'flex', gap: 10 }}>
              {activeTab === 'overview' && (
                <Button variant="secondary" size="sm" onClick={exportCSV} disabled={refreshing}>
                  <Download size={14} /> ייצוא לאקסל
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={fetchAll} disabled={refreshing}>
                <RefreshCcw size={14} className={refreshing ? "spinner" : ""} /> {refreshing ? 'מרענן' : 'רענן'}
              </Button>
            </div>
          )}
        />

        <div className="tab-menu" style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--border)', marginBottom: 24, paddingBottom: 10 }}>
          {[
            { tag: 'overview', icon: <LayoutDashboard size={16} />, label: 'מצב כוחות' },
            { tag: 'requests', icon: <Send size={16} />, label: 'פניות חיילים' },
            { tag: 'forms', icon: <FileText size={16} />, label: 'דוח 1 ושאלונים' },
          ].map(tab => (
            <button key={tab.tag}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', 
                fontWeight: activeTab === tab.tag ? 600 : 400, color: activeTab === tab.tag ? 'var(--primary)' : 'var(--text)', 
                borderBottom: activeTab === tab.tag ? '3px solid var(--primary)' : '3px solid transparent' 
              }}
              onClick={() => setActiveTab(tab.tag as 'overview' | 'requests' | 'forms')}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <Link 
            href="/staff/messages"
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text)', fontSize: '1rem', paddingBottom: 10, borderBottom: '3px solid transparent' }}
          >
            <Send size={16} /> לוח מודעות
          </Link>
        </div>

        <div className="page-body">
          {activeTab === 'requests' && <StaffRequests />}
          {activeTab === 'forms' && <StaffForms />}
          
          {activeTab === 'overview' && (
            <>
              {/* Stats */}
              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', marginBottom: 24 }}>
                <StatCard label="סה״כ" value={stats.total} color="var(--text)" />
                <StatCard label="בפלוגה" value={stats.atBase} color="#27ae60" />
                <StatCard label="בדרך" value={stats.enRoute} color="#f39c12" />
                <StatCard label="בבית" value={stats.atHome} color="#2980b9" />
                <StatCard label="לא תקין" value={stats.injured} color="#c0392b" />
                <StatCard label="ציוד חסר" value={stats.missingEquip} color="#e67e22" />
                <StatCard label="לא עדכנו" value={stats.noPortal} color="var(--text-dim)" />
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <Search size={16} style={{ position: 'absolute', right: 10, top: 12, color: 'var(--text-muted)' }} />
                  <Input 
                    className="form-input" 
                    style={{ paddingRight: 34, marginBottom: 0 }} 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="חיפוש שם / תפקיד" 
                  />
                </div>
                <Select 
                  style={{ width: 'auto', marginBottom: 0 }} 
                  value={filterDep} 
                  onChange={e => setFilterDep(e.target.value)}
                  options={[
                    { value: '', label: 'כל המחלקות' },
                    ...departments.map(d => ({ value: d.id, label: d.name, icon: d.icon }))
                  ]}
                />
                <Select 
                  style={{ width: 'auto', marginBottom: 0 }} 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  options={[
                    { value: '', label: 'כל الסטטוסים' },
                    ...['בבית', 'בדרך', 'בפלוגה', 'בחופש', 'מחכה לציוד', 'אחר'].map(s => ({ value: s, label: s }))
                  ]}
                />
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', height: 42 }}>
                  <Button onClick={() => setView('table')} variant="secondary" style={{ border: 'none', borderRadius: 0, background: view === 'table' ? 'var(--primary)' : 'transparent', color: view === 'table' ? 'white' : 'var(--text-muted)' }}><LayoutDashboard size={14} /> טבלה</Button>
                  <Button onClick={() => setView('cards')} variant="secondary" style={{ border: 'none', borderRadius: 0, background: view === 'cards' ? 'var(--primary)' : 'transparent', color: view === 'cards' ? 'white' : 'var(--text-muted)' }}><LayoutDashboard size={14} /> כרטיסים</Button>
                </div>
              </div>

              {loading ? (
                <div className="loading-spinner"><div className="spinner" /></div>
              ) : view === 'table' ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>חייל</th>
                        <th>מחלקה</th>
                        <th>סטטוס</th>
                        <th>בריאות</th>
                        <th>פק&quot;לים</th>
                        <th>ציוד / הערות</th>
                        <th>עדכון אחרון</th>
                        <th>לינק</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>לא נמצאו חיילים</td></tr>
                      ) : filtered.map(s => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                               {s.photo_url ? (
                                <div style={{ position: 'relative', width: 36, height: 36 }}>
                                  <Image 
                                    src={s.photo_url} 
                                    alt="" 
                                    fill 
                                    className="object-cover" 
                                    style={{ borderRadius: '50%' }}
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>{s.full_name.charAt(0)}</div>
                              )}
                              <div>
                                <p style={{ fontWeight: 600 }}>{s.full_name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.rank}{s.role ? ` · ${s.role}` : ''}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {s.departments ? `${s.departments.icon} ${s.departments.name}` : '—'}
                          </td>
                          <td>
                            {s.soldier_portals ? (
                              <Badge style={{
                                background: `${statusColors[s.soldier_portals.status] || '#7f8c8d'}22`,
                                color: statusColors[s.soldier_portals.status] || '#7f8c8d',
                              }}>{s.soldier_portals.status}</Badge>
                            ) : <Badge variant="gray">לא עדכן</Badge>}
                          </td>
                          <td>
                            {s.soldier_portals ? (
                              <Badge style={{
                                background: `${healthColors[s.soldier_portals.health_declaration] || '#7f8c8d'}22`,
                                color: healthColors[s.soldier_portals.health_declaration] || '#7f8c8d',
                              }}>{s.soldier_portals.health_declaration}</Badge>
                            ) : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 120 }}>
                              {(s.pakalim || []).map(p => <Badge key={p} variant="gray" style={{fontSize: '0.7rem', padding: '2px 6px'}}>{p}</Badge>)}
                              {(!s.pakalim || s.pakalim.length === 0) && <span style={{color: 'var(--text-muted)'}}>—</span>}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 200 }}>
                            {s.soldier_portals?.equipment_notes ? (
                              <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> {s.soldier_portals.equipment_notes.slice(0, 60)}</span>
                            ) : '—'}
                            {s.soldier_portals?.personal_notes && (
                              <p style={{ marginTop: 2, color: 'var(--text-dim)' }}>{s.soldier_portals.personal_notes.slice(0, 40)}{s.soldier_portals.personal_notes.length > 40 ? '...' : ''}</p>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{formatTime(s.soldier_portals?.updated_at)}</td>
                          <td>
                            <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/soldier/${s.unique_token}`); }}>
                              🔗
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {filtered.map(s => (
                    <Card key={s.id} style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                        {s.photo_url ? (
                          <div style={{ position: 'relative', width: 44, height: 44 }}>
                            <Image 
                              src={s.photo_url} 
                              alt="" 
                              fill 
                              className="object-cover" 
                              style={{ borderRadius: '50%' }}
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="avatar-placeholder">{s.full_name.charAt(0)}</div>
                        )}
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.92rem' }}>{s.full_name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.rank}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {s.soldier_portals ? (
                          <>
                            <Badge style={{ background: `${statusColors[s.soldier_portals.status] || '#7f8c8d'}22`, color: statusColors[s.soldier_portals.status] || '#7f8c8d', width: 'fit-content' }}>{s.soldier_portals.status}</Badge>
                            <span style={{ fontSize: '0.75rem', color: healthColors[s.soldier_portals.health_declaration] || 'var(--text-muted)' }}>🏥 {s.soldier_portals.health_declaration}</span>
                            {s.soldier_portals.equipment_notes && <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>⚠️ {s.soldier_portals.equipment_notes.slice(0,50)}</span>}
                          </>
                        ) : <Badge variant="gray" style={{width: 'fit-content'}}>לא עדכן</Badge>}
                        
                        {s.pakalim && s.pakalim.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {s.pakalim.map(p => <Badge key={p} variant="gray" style={{fontSize: '0.65rem', padding: '2px 6px'}}>{p}</Badge>)}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
