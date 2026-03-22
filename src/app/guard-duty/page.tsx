'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, Soldier } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Clock, MapPin, Users, CheckCircle, Trash2, Shield, AlertTriangle } from 'lucide-react';

type GuardEvent = {
  id: string;
  location: string;
  start_time: string;
  end_time: string;
  shift_duration: number;
  status: string;
  target_status: string; // 'בפנים' | 'עורף' | 'all'
  created_at: string;
  guard_shifts?: GuardShift[];
};

type GuardShift = {
  id: string;
  guard_event_id: string;
  start_time: string;
  end_time: string;
  soldier_id: string | null;
  requested_by_id: string | null;
  soldiers?: Pick<Soldier, 'full_name'> | null;
  requester?: Pick<Soldier, 'full_name'> | null;
};

export default function GuardDutyPage() {
  const [events, setEvents] = useState<GuardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    location: '', start_time: '', end_time: '', shift_duration: 120, target_status: 'all'
  });
  const [saving, setSaving] = useState(false);
  const [allSoldiers, setAllSoldiers] = useState<Soldier[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [evs, sols] = await Promise.all([
        supabase.from('guard_events')
          .select('*, guard_shifts(*, soldiers:soldier_id(full_name), requester:requested_by_id(full_name))')
          .order('created_at', { ascending: false }),
        supabase.from('soldiers').select('*, soldier_portals(status)').order('full_name')
      ]);
      
      if (evs.error) {
        console.error('Error fetching events:', evs.error);
        const simpleEvs = await supabase.from('guard_events').select('*, guard_shifts(*)').order('created_at', { ascending: false });
        if (simpleEvs.data) setEvents(simpleEvs.data as any);
      } else if (evs.data) {
        setEvents(evs.data as any);
      }
      
      if (sols.error) console.error('Error fetching soldiers:', sols.error);
      if (sols.data) setAllSoldiers(sols.data as any);
    } catch (err) {
      console.error('FetchData exception:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const publishEvent = async () => {
    if (!form.location || !form.start_time || !form.end_time || !form.shift_duration) return;
    setSaving(true);
    
    const start = new Date(form.start_time);
    const end = new Date(form.end_time);
    
    const { data: eventData, error: evError } = await supabase.from('guard_events').insert({
      location: form.location,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      shift_duration: form.shift_duration,
      target_status: form.target_status,
      status: 'published'
    }).select().single();

    if (evError) {
      alert('שגיאה ביצירת רשימה: ' + evError.message + '\nאולי חסרות עמודות בבסיס הנתונים?');
      setSaving(false);
      return;
    }

    if (eventData) {
      const shifts = [];
      let current = start.getTime();
      const endMs = end.getTime();
      const durMs = form.shift_duration * 60000;

      while (current < endMs) {
        let next = current + durMs;
        if (next > endMs) next = endMs;
        
        shifts.push({
          guard_event_id: eventData.id,
          start_time: new Date(current).toISOString(),
          end_time: new Date(next).toISOString(),
          soldier_id: null
        });
        current = next;
      }
      
      if (shifts.length > 0) {
        await supabase.from('guard_shifts').insert(shifts);
      }
    }
    
    setSaving(false);
    setShowModal(false);
    setForm({ location: '', start_time: '', end_time: '', shift_duration: 120, target_status: 'all' });
    fetchData();
  };

  const assignSoldier = async (shiftId: string, soldierId: string | null) => {
    await supabase.from('guard_shifts').update({ soldier_id: soldierId || null }).eq('id', shiftId);
    fetchData(); // Refresh to get relations properly
  };

  const confirmRequest = async (shift: GuardShift) => {
    if (!shift.requested_by_id) return;
    await assignSoldier(shift.id, shift.requested_by_id);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק רשימה זו?')) return;
    await supabase.from('guard_events').delete().eq('id', id);
    fetchData();
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { month: 'short', day: 'numeric', weekday: 'short' });

  const getFilteredSoldiers = (targetStatus: string) => {
    if (targetStatus === 'all' || !targetStatus) return allSoldiers;
    return allSoldiers.filter((s: any) => s.soldier_portals?.status === targetStatus);
  };

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content" style={{ padding: 'clamp(12px, 3vw, 24px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.5rem)', fontWeight: 800, color: 'var(--text)' }}>🛡️ ניהול שמירות</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>מצב כוחות ושיבוצים</p>
          </div>
          <Button onClick={() => setShowModal(true)} style={{ width: 'auto', minWidth: '160px', padding: '10px 16px' }}>+ רשימה חדשה</Button>
        </div>

        <div className="page-body">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            events.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                <Shield size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: '0.9rem' }}>אין רשימות שמירה פעילות.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {events.map((ev) => {
                  const sortedShifts = [...(ev.guard_shifts || [])].sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                  const targetSols = getFilteredSoldiers(ev.target_status);
                  const pendingCount = sortedShifts.filter(s => s.requested_by_id && !s.soldier_id).length;
                  const totalShifts = sortedShifts.length;
                  const filledShifts = sortedShifts.filter(s => !!s.soldier_id).length;
                  const isFull = filledShifts === totalShifts && totalShifts > 0;

                  return (
                    <Card key={ev.id} style={{ padding: 'clamp(12px, 2.5vw, 16px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: '180px' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                            <MapPin size={20} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{ev.location}</h3>
                              <Badge style={{ 
                                background: ev.target_status === 'בפנים' ? '#e74c3c22' : ev.target_status === 'עורף' ? '#2980b922' : 'var(--bg-card)',
                                color: ev.target_status === 'בפנים' ? '#e74c3c' : ev.target_status === 'עורף' ? '#2980b9' : 'var(--text-dim)',
                                fontSize: '0.7rem',
                                padding: '2px 8px'
                              }}>יעד: {ev.target_status === 'all' ? 'כולם' : ev.target_status}</Badge>
                              {pendingCount > 0 && <Badge style={{ background: '#f39c1222', color: '#f39c12', fontSize: '0.7rem', padding: '2px 8px' }}>{pendingCount} בקשות</Badge>}
                              {isFull && <Badge style={{ background: '#27ae6022', color: '#27ae60', fontSize: '0.7rem', padding: '2px 8px' }}>מלא</Badge>}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
                              {formatDate(ev.start_time)} • {formatTime(ev.start_time)} - {formatTime(ev.end_time)}
                            </p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => deleteEvent(ev.id)} style={{ color: '#e74c3c', width: 32, height: 32, padding: 0 }}><Trash2 size={16} /></Button>
                      </div>

                      {isFull ? (
                        <div style={{ background: '#27ae6005', border: '1px solid #27ae6022', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                          <CheckCircle size={24} style={{ color: '#27ae60', marginBottom: 8, opacity: 0.8 }} />
                          <h4 style={{ color: '#27ae60', fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>סבב הושלם</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
                            {sortedShifts.map(s => (
                              <div key={s.id} style={{ background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 800, color: 'var(--text-dim)', fontSize: '0.75rem' }}>{formatTime(s.start_time)}</span>
                                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.75rem' }}>{(s as any).soldiers?.full_name || 'שומר'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 10, overflowX: 'auto', border: '1px solid var(--border)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '450px' }}>
                            <thead>
                              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>שעה</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>בקשה</th>
                                <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>שיבוץ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedShifts.map(shift => (
                                <tr key={shift.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text)' }}>
                                    {formatTime(shift.start_time)}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    {shift.soldier_id ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#27ae60', fontWeight: 700, fontSize: '0.8rem' }}>
                                        <CheckCircle size={12} /> {(shift as any).soldiers?.full_name}
                                      </div>
                                    ) : shift.requested_by_id ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Badge style={{ background: '#f39c1215', color: '#f39c12', fontSize: '0.7rem', padding: '1px 6px' }}>
                                          {(shift as any).requester?.full_name || 'חייל'}
                                        </Badge>
                                        <button onClick={() => confirmRequest(shift)} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>אשר</button>
                                      </div>
                                    ) : (
                                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <Select 
                                      style={{ width: '100%', maxWidth: '140px', marginBottom: 0, fontSize: '0.75rem', padding: '4px' }}
                                      value={shift.soldier_id || ''}
                                      onChange={(e) => assignSoldier(shift.id, e.target.value)}
                                      options={[
                                        { value: '', label: 'שיבוץ...' },
                                        ...targetSols.map(s => ({ value: s.id, label: s.full_name }))
                                      ]}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 'clamp(4px, 1.5vw, 16px)',
            backdropFilter: 'blur(4px)',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000
          }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <Card className="modal" style={{ 
              maxWidth: 500, 
              width: '100%', 
              padding: 0, 
              overflow: 'hidden', 
              border: '1px solid var(--border)', 
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', 
              maxHeight: '94vh', 
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 20,
              animation: 'modalSlideUp 0.3s ease-out'
            }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '16px 24px', color: 'var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Shield size={24} /> פקודת שמירה
                  </h3>
                  <p style={{ margin: '2px 0 0', opacity: 0.8, fontSize: '0.75rem', color: 'white' }}>הגדרת מיקום וזמנים</p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
              
              <div style={{ padding: 'clamp(16px, 4vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                    <MapPin size={16} style={{ color: 'var(--primary)' }} /> מיקום
                  </label>
                  <input 
                    className="form-input" 
                    value={form.location} 
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                    placeholder='ש"ג ראשי, סיור...' 
                    style={{ fontSize: '0.95rem', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface)' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Clock size={16} /> התחלה
                    </label>
                    <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={{ padding: '10px', borderRadius: 10, fontSize: '0.85rem' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Clock size={16} /> סיום
                    </label>
                    <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={{ padding: '10px', borderRadius: 10, fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Clock size={16} /> דקות לכל שומר
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={form.shift_duration} 
                        onChange={e => setForm(f => ({ ...f, shift_duration: parseInt(e.target.value) || 0 }))}
                        style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, padding: '8px', borderRadius: 10, width: '60px' }}
                      />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setForm(f => ({ ...f, shift_duration: Math.max(1, (parseInt(f.shift_duration as any) || 0) + 30) }))} style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>+30</button>
                        <button onClick={() => setForm(f => ({ ...f, shift_duration: Math.max(1, (parseInt(f.shift_duration as any) || 0) - 30) }))} style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>-30</button>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Users size={16} /> יעד
                    </label>
                    <Select 
                      value={form.target_status} 
                      onChange={e => setForm(f => ({ ...f, target_status: e.target.value }))}
                      options={[
                        { value: 'all', label: '🌍 כולם' },
                        { value: 'בפנים', label: '🔥 בפנים' },
                        { value: 'עורף', label: '🛡️ עורף' },
                      ]}
                      style={{ height: '44px', fontSize: '0.9rem', fontWeight: 700, borderRadius: 10 }}
                    />
                  </div>
                </div>

                {/* Summary Box */}
                <div style={{ background: 'rgba(255,215,0,0.03)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,215,0,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>משמרות שייווצרו:</span>
                    <div style={{ background: 'var(--primary)', color: 'white', fontSize: '1.1rem', fontWeight: 900, padding: '2px 12px', borderRadius: 8 }}>
                      {(() => {
                        if (!form.start_time || !form.end_time || !form.shift_duration) return 0;
                        const s = new Date(form.start_time).getTime();
                        const e = new Date(form.end_time).getTime();
                        if (e <= s || form.shift_duration <= 0) return 0;
                        return Math.ceil((e - s) / (form.shift_duration * 60000));
                      })()}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.4 }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
                    ייוצרו אוטומטית לפי היעדים והזמנים הנבחרים.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <Button variant="secondary" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 10, fontSize: '0.9rem' }}>ביטול</Button>
                  <Button onClick={publishEvent} disabled={saving} style={{ padding: '8px 24px', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem' }}>
                    {saving ? 'מייצר...' : 'צור רשימה 🚀'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
