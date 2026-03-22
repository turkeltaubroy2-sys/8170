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
  requested_by?: Pick<Soldier, 'full_name'> | null;
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
    const [evs, sols] = await Promise.all([
      supabase.from('guard_events').select('*, guard_shifts(*, soldiers(full_name), requested_by:requested_by_id(full_name))').order('created_at', { ascending: false }),
      supabase.from('soldiers').select('*, soldier_portals(status)').order('full_name')
    ]);
    if (evs.data) setEvents(evs.data);
    if (sols.data) setAllSoldiers(sols.data as any);
    setLoading(false);
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
    setEvents(prev => prev.map(ev => ({
      ...ev,
      guard_shifts: ev.guard_shifts?.map(s => s.id === shiftId ? { ...s, soldier_id: soldierId } : s)
    })));
    fetchData(); // Refresh to get relations
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>🛡️ ניהול שמירות</h2>
            <p style={{ color: 'var(--text-dim)' }}>יצירת רשימות וניהול שיבוצים מול בקשות חיילים</p>
          </div>
          <Button onClick={() => setShowModal(true)}>+ רשימת שמירה חדשה</Button>
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

                  return (
                    <Card key={ev.id} style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <MapPin size={24} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{ev.location}</h3>
                              <Badge style={{ 
                                background: ev.target_status === 'בפנים' ? '#e74c3c22' : ev.target_status === 'עורף' ? '#2980b922' : 'var(--bg-card)',
                                color: ev.target_status === 'בפנים' ? '#e74c3c' : ev.target_status === 'עורף' ? '#2980b9' : 'var(--text-dim)'
                              }}>יעד: {ev.target_status === 'all' ? 'כולם' : ev.target_status}</Badge>
                              {pendingCount > 0 && <Badge style={{ background: '#f39c1222', color: '#f39c12' }}><Clock size={12} style={{marginLeft: 4}}/> {pendingCount} בקשות פתוחות</Badge>}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
                              {formatDate(ev.start_time)} • {formatTime(ev.start_time)} - {formatTime(ev.end_time)} | משמרת: {ev.shift_duration} דק'
                            </p>
                          </div>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => deleteEvent(ev.id)} style={{ color: '#e74c3c' }}><Trash2 size={16} /></Button>
                      </div>

                      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>שעה</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>סטטוס / בקשה</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>שיבוץ סגל</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedShifts.map(shift => (
                              <tr key={shift.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.9rem' }}>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</td>
                                <td style={{ padding: '12px 16px' }}>
                                  {shift.soldier_id ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600 }}>
                                      <CheckCircle size={14} /> {shift.soldiers?.full_name}
                                    </div>
                                  ) : shift.requested_by_id ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <Badge style={{ background: '#f39c1222', color: '#f39c12' }}>בקשה: {shift.requested_by?.full_name}</Badge>
                                      <Button variant="primary" size="sm" onClick={() => confirmRequest(shift)} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>אשר</Button>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>טרם שובץ</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <Select 
                                    style={{ width: '160px', marginBottom: 0, fontSize: '0.85rem' }}
                                    value={shift.soldier_id || ''}
                                    onChange={(e) => assignSoldier(shift.id, e.target.value)}
                                    options={[
                                      { value: '', label: 'בחר חייל לשיבוץ' },
                                      ...targetSols.map(s => ({ value: s.id, label: s.full_name }))
                                    ]}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <Card className="modal" style={{ maxWidth: 500, width: '90%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>יצירת רשימת שמירה חדשה</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', fontWeight: 600 }}>מיקום / שם עמדה</label>
                  <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="למשל: ד.ג מזרחי" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', fontWeight: 600 }}>שעת התחלה</label>
                    <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', fontWeight: 600 }}>שעת סיום</label>
                    <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', fontWeight: 600 }}>משך שמירה (דק')</label>
                    <Select 
                      value={form.shift_duration.toString()} 
                      onChange={e => setForm(f => ({ ...f, shift_duration: parseInt(e.target.value) }))}
                      options={[
                        { value: '30', label: "30 דק'" },
                        { value: '60', label: "שעה" },
                        { value: '120', label: "שעתיים" },
                        { value: '180', label: "3 שעות" },
                        { value: '240', label: "4 שעות" },
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.9rem', fontWeight: 600 }}>יעד הרשימה</label>
                    <Select 
                      value={form.target_status} 
                      onChange={e => setForm(f => ({ ...f, target_status: e.target.value }))}
                      options={[
                        { value: 'all', label: 'כולם' },
                        { value: 'בפנים', label: '🔥 בפנים' },
                        { value: 'עורף', label: '🛡️ עורף' },
                      ]}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 8, display: 'flex', gap: 10 }}>
                  <AlertTriangle size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    רק חיילים בסטטוס התואם ליעד הרשימה יוכלו לראות אותה בפורטל ולבקש שיבוץ. הסטטוס נקבע לפי מה שהחייל עדכן לאחרונה.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>ביטול</Button>
                  <Button onClick={publishEvent} disabled={saving}>{saving ? 'יוצר רשימה...' : 'צור רשימה'}</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
