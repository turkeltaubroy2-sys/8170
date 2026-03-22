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
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 800, color: 'var(--text)' }}>🛡️ ניהול שמירות</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>יצירת רשימות וניהול שיבוצים מול בקשות חיילים</p>
          </div>
          <Button onClick={() => setShowModal(true)} style={{ width: '100%', maxWidth: '200px' }}>+ רשימת שמירה חדשה</Button>
        </div>

        <div className="page-body">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            events.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: 60, color: 'var(--text-dim)' }}>
                <Shield size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p>אין רשימות שמירה פעילות. צור רשימה כדי להתחיל.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {events.map((ev) => {
                  const sortedShifts = [...(ev.guard_shifts || [])].sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                  const targetSols = getFilteredSoldiers(ev.target_status);
                  const pendingCount = sortedShifts.filter(s => s.requested_by_id && !s.soldier_id).length;
                  const totalShifts = sortedShifts.length;
                  const filledShifts = sortedShifts.filter(s => !!s.soldier_id).length;
                  const isFull = filledShifts === totalShifts && totalShifts > 0;

                  return (
                    <Card key={ev.id} style={{ padding: 'clamp(12px, 3vw, 20px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: '200px' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                            <MapPin size={24} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{ev.location}</h3>
                              <Badge style={{ 
                                background: ev.target_status === 'בפנים' ? '#e74c3c22' : ev.target_status === 'עורף' ? '#2980b922' : 'var(--bg-card)',
                                color: ev.target_status === 'בפנים' ? '#e74c3c' : ev.target_status === 'עורף' ? '#2980b9' : 'var(--text-dim)',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                flexShrink: 0
                              }}>יעד: {ev.target_status === 'all' ? 'כולם' : ev.target_status}</Badge>
                              {pendingCount > 0 && <Badge style={{ background: '#f39c1222', color: '#f39c12', whiteSpace: 'nowrap', flexShrink: 0 }}><Clock size={12} style={{marginLeft: 4}}/> {pendingCount} בקשות פתוחות</Badge>}
                              {isFull && <Badge style={{ background: '#27ae6022', color: '#27ae60', whiteSpace: 'nowrap', flexShrink: 0 }}><CheckCircle size={12} style={{marginLeft: 4}}/> הרשימה מלאה</Badge>}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
                              {formatDate(ev.start_time)} • {formatTime(ev.start_time)} - {formatTime(ev.end_time)} | משמרת: {ev.shift_duration} דק'
                            </p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => deleteEvent(ev.id)} style={{ color: '#e74c3c' }}><Trash2 size={16} /></Button>
                      </div>

                      {isFull ? (
                        <div style={{ background: '#27ae6008', border: '1px solid #27ae6033', borderRadius: 16, padding: 'clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
                          <CheckCircle size={40} style={{ color: '#27ae60', marginBottom: 16, opacity: 0.8 }} />
                          <h4 style={{ color: '#27ae60', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>סבב שמירות הושלם</h4>
                          <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginBottom: 24 }}>כל {totalShifts} המשמרות אוישו ושובצו בהצלחה.</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                            {sortedShifts.map(s => (
                              <div key={s.id} style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 800, color: 'var(--text-dim)', fontSize: '0.85rem' }}>{formatTime(s.start_time)}</span>
                                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{(s as any).soldiers?.full_name || 'שומר'}</span>
                              </div>
                            ))}
                          </div>
                          <Button variant="secondary" size="sm" style={{ marginTop: 24, padding: '8px 24px' }} onClick={() => fetchData()}>🔄 רענן רשימה</Button>
                        </div>
                      ) : (
                        <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', overflowX: 'auto', border: '1px solid var(--border)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                            <thead>
                              <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>שעה</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>סטטוס / בקשה</th>
                                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>שיבוץ סגל</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedShifts.map(shift => (
                                <tr key={shift.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                  </td>
                                  <td style={{ padding: '14px 16px' }}>
                                    {shift.soldier_id ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#27ae60', fontWeight: 800 }}>
                                        <CheckCircle size={14} /> {(shift as any).soldiers?.full_name}
                                      </div>
                                    ) : shift.requested_by_id ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Badge style={{ background: '#f39c1222', color: '#f39c12', border: '1px solid #f39c1244' }}>
                                          🙋‍♂️ {(shift as any).requester?.full_name || 'חייל'}
                                        </Badge>
                                        <Button variant="primary" size="sm" onClick={() => confirmRequest(shift)} style={{ fontSize: '0.75rem', padding: '4px 10px', height: 'auto', fontWeight: 800 }}>אשר שיבוץ</Button>
                                      </div>
                                    ) : (
                                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic' }}>טרם שובץ</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <Select 
                                      style={{ width: '100%', maxWidth: '180px', marginBottom: 0, fontSize: '0.85rem', fontWeight: 600 }}
                                      value={shift.soldier_id || ''}
                                      onChange={(e) => assignSoldier(shift.id, e.target.value)}
                                      options={[
                                        { value: '', label: 'בחר חייל לשיבוץ...' },
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
            padding: 'clamp(8px, 2vw, 24px)',
            backdropFilter: 'blur(8px)',
            background: 'rgba(0,0,0,0.6)'
          }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <Card className="modal" style={{ 
              maxWidth: 580, 
              width: '100%', 
              padding: 0, 
              overflow: 'hidden', 
              border: '1px solid var(--border)', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
              maxHeight: '90vh', 
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 24,
              animation: 'modalSlideUp 0.3s ease-out'
            }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '24px 32px', color: 'var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Shield size={28} /> פקודת שמירה חדשה
                  </h3>
                  <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.95rem', color: 'white', fontWeight: 500 }}>הגדרת מיקום, זמנים וחלוקת משמרות</p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>✕</button>
              </div>
              
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                    <MapPin size={20} style={{ color: 'var(--primary)' }} /> מיקום / שם עמדה
                  </label>
                  <input 
                    className="form-input" 
                    value={form.location} 
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} 
                    placeholder='למשל: ד.ג מזרחי, ש"ג ראשי, סיור הקפי...' 
                    style={{ fontSize: '1.1rem', padding: '14px 18px', fontWeight: 600, borderRadius: 12, background: 'var(--bg-surface)' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Clock size={20} style={{ color: 'var(--primary)' }} /> שעת התחלה
                    </label>
                    <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg-surface)', fontWeight: 600 }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Clock size={20} style={{ color: 'var(--primary)' }} /> שעת סיום
                    </label>
                    <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg-surface)', fontWeight: 600 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Clock size={20} style={{ color: 'var(--primary)' }} /> משך משמרת (דקות)
                    </label>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={form.shift_duration} 
                          onChange={e => setForm(f => ({ ...f, shift_duration: parseInt(e.target.value) || 0 }))}
                          min="1"
                          style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 800, padding: '12px', borderRadius: 12, background: 'var(--bg-surface)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          onClick={() => setForm(f => ({ ...f, shift_duration: Math.max(1, (parseInt(f.shift_duration as any) || 0) + 30) }))} 
                          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 12, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 800, color: 'var(--primary)' }}
                        >+30</button>
                        <button 
                          onClick={() => setForm(f => ({ ...f, shift_duration: Math.max(1, (parseInt(f.shift_duration as any) || 0) - 30) }))} 
                          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 12, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 800, color: 'var(--danger)' }}
                        >-30</button>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                      <Users size={20} style={{ color: 'var(--primary)' }} /> יעד הרשימה
                    </label>
                    <Select 
                      value={form.target_status} 
                      onChange={e => setForm(f => ({ ...f, target_status: e.target.value }))}
                      options={[
                        { value: 'all', label: '🌍 כולם' },
                        { value: 'בפנים', label: '🔥 חיילים בפנים' },
                        { value: 'עורף', label: '🛡️ חיילים בעורף' },
                      ]}
                      style={{ height: '54px', fontSize: '1.05rem', fontWeight: 700, borderRadius: 12, background: 'var(--bg-surface)' }}
                    />
                  </div>
                </div>

                {/* Summary Box */}
                <div style={{ background: 'rgba(255,215,0,0.05)', borderRadius: 20, padding: 20, border: '1px solid rgba(255,215,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>סך הכל משמרות שייווצרו:</span>
                    <div style={{ background: 'var(--primary)', color: 'white', fontSize: '1.4rem', fontWeight: 900, padding: '4px 20px', borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                      {(() => {
                        if (!form.start_time || !form.end_time || !form.shift_duration) return 0;
                        const s = new Date(form.start_time).getTime();
                        const e = new Date(form.end_time).getTime();
                        if (e <= s || form.shift_duration <= 0) return 0;
                        return Math.ceil((e - s) / (form.shift_duration * 60000));
                      })()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                      המשמרות ייווצרו באופן אוטומטי מהשעה {form.start_time ? formatTime(form.start_time) : '--:--'} ועד {form.end_time ? formatTime(form.end_time) : '--:--'}. רק חיילים בסטטוס התואם יוכלו לראות ולהירשם לרשימה בפורטל שלהם.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 24, flexShrink: 0 }}>
                  <Button variant="secondary" onClick={() => setShowModal(false)} style={{ padding: '14px 28px', borderRadius: 12, fontWeight: 700 }}>ביטול</Button>
                  <Button onClick={publishEvent} disabled={saving} style={{ padding: '14px 40px', borderRadius: 12, fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                    {saving ? '⏳ מייצר רשימה...' : 'צור ושחרר לשיבוץ 🚀'}
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
