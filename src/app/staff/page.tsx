'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import { Download, RefreshCcw, LayoutDashboard, Send, FileText, Search, ImageIcon, X } from 'lucide-react';
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
    media_urls?: string[];
  };
};

const EQUIPMENT_ITEMS = [
  { id: 'massa_90l', label: 'מנשא 90 ליטר', type: 'boolean' },
  { id: 'shak_hafatzi', label: 'שק חפצים', type: 'boolean' },
  { id: 'mechanes_dagmach', label: "מכנס דגמ''ח", type: 'boolean' },
  { id: 'chultzat_dagmach', label: 'חולצות דגמ"ח', type: 'boolean' },
  { id: 'shak_sheina', label: 'שק שינה', type: 'boolean' },
  { id: 'kova_avoda', label: 'כובע עבודה', type: 'boolean' },
  { id: 'kfafot_nomex', label: 'כפפות נומקס', type: 'boolean' },
  { id: 'hagorat_avoda', label: 'חגורת עבודה', type: 'boolean' },
  { id: 'afod_magen', label: 'אפוד מגן נגד רסיסים', type: 'boolean' },
  { id: 'kasda', label: 'קסדה', type: 'select', options: ['טקטית', 'רגילה', 'לא'] },
  { id: 'vest', label: 'ווסט', type: 'select', options: ['רגיל', 'נגב', 'חובש', 'מטול', 'לא'] },
  { id: 'luach_kerami_kidmi', label: 'לוח קרמי קדמי', type: 'boolean' },
  { id: 'luach_kerami_achori', label: 'לוח קרמי אחורי', type: 'boolean' },
  { id: 'luach_kerami_shachor', label: 'לוח קרמי שחור', type: 'boolean' },
  { id: 'panas_rosh', label: 'פנס ראש מנצנץ', type: 'boolean' },
  { id: 'mechal_mayim_3l', label: 'מיכל מים 3 ליטר', type: 'boolean' },
  { id: 'reshet_hasva_2x3', label: 'רשת הסוואה 2*3 אנט', type: 'boolean' },
  { id: 'mitznefet', label: 'מצנפת לקסדה', type: 'boolean' },
  { id: 'magen_birkayim', label: 'מגני ברכיים', type: 'boolean' },
  { id: 'et_tachferut', label: 'את תחפרות', type: 'boolean' },
  { id: 'mishkafayim', label: 'משקפי שומר אח"י', type: 'boolean' },
  { id: 'chevel_ishi', label: 'חבל אישי עם אנקול', type: 'boolean' },
  { id: 'retzua', label: 'רצועה לנשק', type: 'boolean' },
  { id: 'machsaniyot', label: 'מחסניות', type: 'boolean' },
  { id: 'mashmenet', label: 'משמנת', type: 'boolean' },
  { id: 'mivreshet', label: 'מברשת ניקוי', type: 'boolean' },
  { id: 'choter', label: 'חוטר', type: 'boolean' },
  { id: 'erkat_niqquoy', label: 'ערכת כלי ניקוי', type: 'boolean' },
];

const statusColors: Record<string, string> = {
  'בבית': '#27ae60',
  'עורף': '#2980b9',
  'בפנים': '#c0392b',
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
  const [selectedSoldier, setSelectedSoldier] = useState<SoldierWithPortal | null>(null);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSoldier, setNewSoldier] = useState({
    full_name: '',
    username: '',
    personal_number: '',
    rank: 'סמל',
    role: 'לוחם',
    department_id: '',
    password: ''
  });

  const updateStatus = async (soldierId: string, newStatus: string) => {
    // Check if portal exists, if not create one or handle accordingly
    // For simplicity, we assume portals exist or we upsert
    const { error } = await supabase
      .from('soldier_portals')
      .upsert({ 
        soldier_id: soldierId, 
        status: newStatus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'soldier_id' });

    if (error) {
      alert('שגיאה בעדכון הסטטוס: ' + error.message);
      return;
    }

    // Update local state
    setSoldiers(prev => prev.map(s => {
      if (s.id === soldierId) {
        return {
          ...s,
          soldier_portals: s.soldier_portals 
            ? { ...s.soldier_portals, status: newStatus, updated_at: new Date().toISOString() }
            : { status: newStatus, health_declaration: 'תקין', equipment_notes: '{}', personal_notes: '', updated_at: new Date().toISOString() }
        };
      }
      return s;
    }));
  };

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const [depsRes, soldiersRes] = await Promise.all([
      supabase.from('departments').select('id, name, icon').order('order'),
      supabase.from('soldiers').select('*, departments(name,icon), soldier_portals(status,health_declaration,equipment_notes,personal_notes,media_urls,updated_at)').order('full_name'),
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
    atHome: soldiers.filter(s => s.soldier_portals?.status === 'בבית').length,
    rear: soldiers.filter(s => s.soldier_portals?.status === 'עורף').length,
    inside: soldiers.filter(s => s.soldier_portals?.status === 'בפנים').length,
    injured: soldiers.filter(s => s.soldier_portals?.health_declaration !== 'תקין' && s.soldier_portals?.health_declaration).length,
    noPortal: soldiers.filter(s => !s.soldier_portals).length,
  };

  const formatTime = (dt?: string) => dt ? new Date(dt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const exportCSV = () => {
    const headers = ['שם מלא', 'מחלקה', 'טלפון', 'סטטוס', 'הצהרת בריאות', 'פק"לים', ...EQUIPMENT_ITEMS.map(i => i.label), 'הערות אישיות', 'עדכון אחרון'];
    const rows = filtered.map(s => {
      let equipment: Record<string, any> = {};
      if (s.soldier_portals?.equipment_notes && s.soldier_portals.equipment_notes.startsWith('{')) {
        try { equipment = JSON.parse(s.soldier_portals.equipment_notes); } catch { }
      }
      return [
        s.full_name || '',
        s.departments?.name || '',
        s.phone || '',
        s.soldier_portals?.status || 'לא עדכן',
        s.soldier_portals?.health_declaration || '',
        (s.pakalim || []).join(', '),
        ...EQUIPMENT_ITEMS.map(i => {
          const val = equipment[i.id];
          if (i.type === 'boolean') return val ? 'V' : 'X';
          return val || 'לא';
        }),
        s.soldier_portals?.personal_notes || '',
        formatTime(s.soldier_portals?.updated_at)
      ];
    });
    
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
            <div className="header-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {activeTab === 'overview' && (
                <Button variant="secondary" size="sm" onClick={exportCSV} disabled={refreshing}>
                  <Download size={14} /> <span className="hide-mobile">ייצוא</span>
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => {
                setNewSoldier(prev => ({ ...prev, password: Math.random().toString(36).slice(-8) }));
                setShowAddModal(true);
              }}>
                ➕ <span className="hide-mobile">חייל חדש</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={fetchAll} disabled={refreshing}>
                <RefreshCcw size={14} className={refreshing ? "spinner" : ""} />
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
              className="tab-item"
            >
              <Send size={16} /> לוח מודעות
            </Link>
          </div>

          <style jsx>{`
            @media (max-width: 600px) {
              .header-actions :global(span.hide-mobile) {
                display: none;
              }
              .tab-menu {
                 display: grid !important;
                 grid-template-columns: repeat(2, 1fr) !important;
              }
            }
          `}</style>

        <div className="page-body">
          {activeTab === 'requests' && <StaffRequests />}
          {activeTab === 'forms' && <StaffForms />}
          
          {activeTab === 'overview' && (
            <>
              {/* Stats */}
              <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', marginBottom: 24 }}>
                <StatCard label="סה״כ" value={stats.total} color="var(--text)" />
                <StatCard label="בבית" value={stats.atHome} color="#27ae60" />
                <StatCard label="עורף" value={stats.rear} color="#2980b9" />
                <StatCard label="בפנים" value={stats.inside} color="#c0392b" />
                <StatCard label="לא תקין" value={stats.injured} color="#e67e22" />
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
                    { value: '', label: 'כל הסטטוסים' },
                    ...['בבית', 'עורף', 'בפנים'].map(s => ({ value: s, label: s }))
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
                        <th>כשירות ציוד</th>
                        <th>מדיה מהשטח</th>
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
                            {s.departments ? s.departments.name : '—'}
                          </td>
                          <td>
                            <Select 
                              value={s.soldier_portals?.status || ''} 
                              onChange={(e) => updateStatus(s.id, e.target.value)}
                              style={{ 
                                marginBottom: 0, 
                                fontSize: '0.8rem',
                                padding: '4px 8px',
                                background: s.soldier_portals ? `${statusColors[s.soldier_portals.status] || '#7f8c8d'}11` : 'transparent',
                                color: s.soldier_portals ? (statusColors[s.soldier_portals.status] || 'var(--text)') : 'var(--text-muted)',
                                border: `1px solid ${s.soldier_portals ? (statusColors[s.soldier_portals.status] || 'var(--border)') : 'var(--border)'}`
                              }}
                              options={[
                                { value: '', label: 'בחר סטטוס' },
                                { value: 'בבית', label: '🏡 בבית' },
                                { value: 'עורף', label: '🛡️ עורף' },
                                { value: 'בפנים', label: '🔥 בפנים' }
                              ]}
                            />
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
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {s.soldier_portals?.equipment_notes ? (
                              (() => {
                                let equipment: Record<string, any> = {};
                                try { 
                                  if (s.soldier_portals.equipment_notes.startsWith('{')) {
                                    equipment = JSON.parse(s.soldier_portals.equipment_notes);
                                  }
                                } catch { }
                                
                                const count = EQUIPMENT_ITEMS.filter(i => {
                                  const v = equipment[i.id];
                                  return i.type === 'boolean' ? !!v : (v && v !== 'לא');
                                }).length;
                                const total = EQUIPMENT_ITEMS.length;
                                const pct = Math.round((count / total) * 100);
                                return (
                                  <button 
                                    onClick={() => { setSelectedSoldier(s); setShowEquipModal(true); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  >
                                    <Badge style={{ background: pct > 80 ? '#27ae6022' : '#f39c1222', color: pct > 80 ? '#27ae60' : '#f39c12' }}>{pct}% ({count}/{total}) 👁️</Badge>
                                  </button>
                                );
                              })()
                            ) : '—'}
                            {s.soldier_portals?.personal_notes && (
                              <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-dim)' }}>💬 {s.soldier_portals.personal_notes.slice(0, 30)}</p>
                            )}
                          </td>
                          <td>
                            {s.soldier_portals?.media_urls && s.soldier_portals.media_urls.length > 0 ? (
                              <button 
                                onClick={() => { setSelectedSoldier(s); setShowMediaModal(true); }}
                                style={{ background: 'var(--primary)11', border: '1px solid var(--primary)33', borderRadius: 8, padding: '4px 8px', color: 'var(--primary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                              >
                                <ImageIcon size={14} /> {s.soldier_portals.media_urls.length} קבצים
                              </button>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>אין מדיה</span>
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
                      <div style={{ marginTop: 8 }}>
                          <Select 
                            value={s.soldier_portals?.status || ''} 
                            onChange={(e) => updateStatus(s.id, e.target.value)}
                            style={{ 
                              marginBottom: 0,
                              fontSize: '0.85rem',
                              background: s.soldier_portals ? `${statusColors[s.soldier_portals.status] || '#7f8c8d'}11` : 'transparent',
                              color: s.soldier_portals ? (statusColors[s.soldier_portals.status] || 'var(--text)') : 'var(--text-muted)'
                            }}
                            options={[
                              { value: '', label: 'בחר סטטוס' },
                              { value: 'בבית', label: '🏡 בבית' },
                              { value: 'עורף', label: '🛡️ עורף' },
                              { value: 'בפנים', label: '🔥 בפנים' }
                            ]}
                          />
                          {s.soldier_portals ? (
                            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <span style={{ fontSize: '0.75rem', color: healthColors[s.soldier_portals.health_declaration] || 'var(--text-muted)' }}>🏥 {s.soldier_portals.health_declaration}</span>
                              <div style={{ background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 8, marginTop: 2 }}>
                                 {(() => {
                                   let equipment: Record<string, any> = {};
                                   try { 
                                     if (s.soldier_portals?.equipment_notes?.startsWith('{')) {
                                       equipment = JSON.parse(s.soldier_portals.equipment_notes);
                                     }
                                   } catch { }
                                   
                                   const count = EQUIPMENT_ITEMS.filter(i => {
                                     const v = equipment[i.id];
                                     return i.type === 'boolean' ? !!v : (v && v !== 'לא');
                                   }).length;
                                   const total = EQUIPMENT_ITEMS.length;
                                    return (
                                     <button 
                                       onClick={() => { setSelectedSoldier(s); setShowEquipModal(true); }}
                                       style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                     >
                                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                         <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ציוד חתום:</span>
                                         <span style={{ fontSize: '0.75rem', fontWeight: 700, color: count === total ? 'var(--primary)' : 'var(--text)' }}>{count}/{total} 👁️</span>
                                       </div>
                                     </button>
                                   );
                                 })()}
                              </div>
                              {s.soldier_portals.media_urls && s.soldier_portals.media_urls.length > 0 && (
                                <button 
                                  onClick={() => { setSelectedSoldier(s); setShowMediaModal(true); }}
                                  style={{ marginTop: 4, background: 'var(--primary)11', border: '1px solid var(--primary)33', borderRadius: 10, padding: '8px 12px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', width: '100%' }}
                                >
                                  <ImageIcon size={16} /> צפה במדיה מהשטח ({s.soldier_portals.media_urls.length})
                                </button>
                              )}
                            </div>
                          ) : <Badge variant="gray" style={{width: 'fit-content', marginTop: 6}}>לא עדכן</Badge>}
                      </div>
                      
                      {s.pakalim && s.pakalim.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                          {s.pakalim.map(p => <Badge key={p} variant="gray" style={{fontSize: '0.65rem', padding: '2px 6px'}}>{p}</Badge>)}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Equipment Modal */}
        {showEquipModal && selectedSoldier && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', 
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
          }}>
            <div className="card" style={{ maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>📦 פירוט ציוד - {selectedSoldier.full_name}</h3>
                <Button variant="secondary" size="sm" onClick={() => setShowEquipModal(false)}>סגור</Button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(() => {
                  let equipment: Record<string, any> = {};
                  try { 
                    if (selectedSoldier.soldier_portals?.equipment_notes?.startsWith('{')) {
                      equipment = JSON.parse(selectedSoldier.soldier_portals.equipment_notes);
                    }
                  } catch { }
                  
                  return EQUIPMENT_ITEMS.map(i => {
                    const val = equipment[i.id];
                    const has = i.type === 'boolean' ? !!val : (val && val !== 'לא');
                    return (
                      <div key={i.id} style={{ 
                        padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        border: `1px solid ${has ? 'var(--primary)44' : 'transparent'}`
                      }}>
                        <span style={{ fontSize: '0.85rem' }}>{i.label}</span>
                        <span style={{ fontSize: '0.9rem', color: has ? 'var(--primary)' : 'var(--text-dim)' }}>
                          {i.type === 'boolean' ? (val ? '✅' : '❌') : (val || '❌')}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Media Modal */}
        {showMediaModal && selectedSoldier && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', 
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
          }}>
            <div className="card" style={{ maxWidth: 800, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', color: 'var(--text)', padding: 24, borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>🖼️ מדיה מהשטח</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>{selectedSoldier.full_name} · {selectedSoldier.rank}</p>
                </div>
                <Button variant="secondary" onClick={() => setShowMediaModal(false)} style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} />
                </Button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {(selectedSoldier.soldier_portals?.media_urls || []).map((url, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#000', border: '1px solid var(--border)', position: 'relative', aspectRatio: '4/3' }}>
                    {url.match(/\.(mp4|webm|ogg|mov)$/) ? (
                      <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
                         <Image src={url} alt="" fill className="object-contain" unoptimized />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {(!selectedSoldier.soldier_portals?.media_urls || selectedSoldier.soldier_portals.media_urls.length === 0) && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
                  <ImageIcon size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>אין קבצי מדיה להצגה</p>
                </div>
              )}

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button variant="secondary" onClick={() => setShowMediaModal(false)} style={{ minWidth: 120 }}>סגור חלונית</Button>
              </div>
            </div>
          </div>
        )}
        {showAddModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', 
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 
          }}>
            <div className="card" style={{ maxWidth: 450, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
              <h3 style={{ marginBottom: 20, textAlign: 'center' }}>👨‍🚀 הוספת חייל חדש למערכת</h3>
              
              <div className="form-group">
                <label>שם מלא</label>
                <Input 
                  value={newSoldier.full_name} 
                  onChange={e => setNewSoldier({...newSoldier, full_name: e.target.value})} 
                  placeholder="לדוגמה: מתנאל חדד"
                />
              </div>
              
              <div className="form-group">
                <label>מספר אישי (יומש כ-Username)</label>
                <Input 
                  value={newSoldier.username} 
                  onChange={e => setNewSoldier({...newSoldier, username: e.target.value, personal_number: e.target.value})} 
                  placeholder="לדוגמה: 8896114"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>דרגה</label>
                  <Select 
                    value={newSoldier.rank} 
                    onChange={e => setNewSoldier({...newSoldier, rank: e.target.value})}
                    options={[
                      { value: 'טוראי', label: 'טוראי' },
                      { value: 'רב"ט', label: 'רב"ט' },
                      { value: 'סמל', label: 'סמל' },
                      { value: 'סמ"ר', label: 'סמ"ר' },
                      { value: 'רס"ל', label: 'רס"ל' },
                      { value: 'רס"ר', label: 'רס"ר' },
                      { value: 'קצין', label: 'קצין' }
                    ]}
                  />
                </div>
                <div className="form-group">
                  <label>מחלקה</label>
                  <Select 
                    value={newSoldier.department_id} 
                    onChange={e => setNewSoldier({...newSoldier, department_id: e.target.value})}
                    options={[
                      { value: '', label: 'בחר מחלקה' },
                      ...departments.map(d => ({ value: d.id, label: d.name }))
                    ]}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>תפקיד</label>
                <Input 
                  value={newSoldier.role} 
                  onChange={e => setNewSoldier({...newSoldier, role: e.target.value})} 
                  placeholder="לדוגמה: נגביסט"
                />
              </div>

              <div className="form-group">
                <label>סיסמה ראשונית</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input 
                    value={newSoldier.password} 
                    onChange={e => setNewSoldier({...newSoldier, password: e.target.value})} 
                  />
                  <Button variant="secondary" onClick={() => setNewSoldier({...newSoldier, password: Math.random().toString(36).slice(-8)})}>🎲</Button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <Button variant="primary" style={{ flex: 1 }} onClick={async () => {
                  if (!newSoldier.full_name || !newSoldier.username || !newSoldier.department_id || !newSoldier.password) {
                    alert('נא למלא את כל שדות החובה');
                    return;
                  }
                  
                  const { error } = await supabase.from('soldiers').insert([{
                    full_name: newSoldier.full_name,
                    username: newSoldier.username,
                    personal_number: newSoldier.username,
                    rank: newSoldier.rank,
                    role: newSoldier.role,
                    department_id: newSoldier.department_id,
                    password: newSoldier.password,
                    unique_token: self.crypto.randomUUID()
                  }]);

                  if (error) {
                    alert('שגיאה בהוספת החייל: ' + error.message);
                  } else {
                    alert('החייל נוסף בהצלחה!');
                    setShowAddModal(false);
                    setNewSoldier({ full_name: '', username: '', personal_number: '', rank: 'סמל', role: 'לוחם', department_id: '', password: '' });
                    fetchAll();
                  }
                }}>שמור חייל</Button>
                <Button variant="secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>ביטול</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
