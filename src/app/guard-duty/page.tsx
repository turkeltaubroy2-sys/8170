'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, Soldier } from '@/lib/supabase';

type GuardEvent = {
  id: string;
  location: string;
  start_time: string;
  end_time: string;
  shift_duration: number;
  status: string;
  created_at: string;
  guard_shifts?: GuardShift[];
};

type GuardShift = {
  id: string;
  guard_event_id: string;
  start_time: string;
  end_time: string;
  soldier_id: string | null;
  soldiers?: Pick<Soldier, 'full_name'> | null;
};

export default function GuardDutyPage() {
  const [events, setEvents] = useState<GuardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    location: '', start_time: '', end_time: '', shift_duration: 120
  });
  const [saving, setSaving] = useState(false);
  const [soldiers, setSoldiers] = useState<Pick<Soldier, 'id' | 'full_name'>[]>([]);

  const fetchData = useCallback(async () => {
    const [evs, sols] = await Promise.all([
      supabase.from('guard_events').select('*, guard_shifts(*, soldiers(full_name))').order('created_at', { ascending: false }),
      supabase.from('soldiers').select('id, full_name').order('full_name')
    ]);
    if (evs.data) setEvents(evs.data);
    if (sols.data) setSoldiers(sols.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const publishEvent = async () => {
    if (!form.location || !form.start_time || !form.end_time || !form.shift_duration) return;
    setSaving(true);
    
    // Convert to Date
    const start = new Date(form.start_time);
    const end = new Date(form.end_time);
    
    // Create Event
    const { data: eventData } = await supabase.from('guard_events').insert({
      location: form.location,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      shift_duration: form.shift_duration,
      status: 'published'
    }).select().single();

    if (eventData) {
      // Generate slots
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
    setForm({ location: '', start_time: '', end_time: '', shift_duration: 120 });
    fetchData();
  };

  const overrideSoldier = async (shiftId: string, soldierId: string | null) => {
    await supabase.from('guard_shifts').update({ soldier_id: soldierId || null }).eq('id', shiftId);
    fetchData();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק רשימה זו ואת כל השיבוצים שבה?')) return;
    await supabase.from('guard_events').delete().eq('id', id);
    fetchData();
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { month: 'short', day: 'numeric', weekday: 'short' });

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>🛡️ רשימות שמירה</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ רשימת שמירה חדשה</button>
        </div>
        <div className="page-body">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            events.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                <p style={{ fontSize: '3rem', marginBottom: 12 }}>🛡️</p>
                <p style={{ color: 'var(--text-muted)' }}>אין רשימות שמירה. פתח רשימה חדשה כדי לאפשר לחיילים להשתבץ!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {events.map((ev: GuardEvent) => {
                  const sortedShifts = [...(ev.guard_shifts || [])].sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                  const total = sortedShifts.length;
                  const filled = sortedShifts.filter(s => s.soldier_id).length;

                  return (
                    <div key={ev.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            📍 {ev.location}
                            <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>פעיל</span>
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            מ- {formatDate(ev.start_time)} {formatTime(ev.start_time)} עד {formatDate(ev.end_time)} {formatTime(ev.end_time)}
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>משך משמרת: {ev.shift_duration / 60} שעות | שיבוצים: {filled}/{total}</p>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteEvent(ev.id)}>🗑️ מחיקה</button>
                      </div>

                      <div className="table-container" style={{ marginBottom: 0 }}>
                        <table>
                          <thead>
                            <tr>
                              <th style={{ width: '150px' }}>שעות משמרת</th>
                              <th>שיבוץ חייל</th>
                              <th style={{ width: '100px' }}>עריכת סגל</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedShifts.map(shift => (
                              <tr key={shift.id}>
                                <td style={{ fontWeight: 600 }}>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</td>
                                <td>
                                  {shift.soldier_id && shift.soldiers ? (
                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{shift.soldiers.full_name}</span>
                                  ) : (
                                    <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>טרם שובץ</span>
                                  )}
                                </td>
                                <td>
                                  <select 
                                    className="form-select" 
                                    style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                                    value={shift.soldier_id || ''}
                                    onChange={(e) => overrideSoldier(shift.id, e.target.value)}
                                  >
                                    <option value="">פנוי לחיילים</option>
                                    {soldiers.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal">
              <div className="modal-header">
                <h3>יצירת פקודת שמירה</h3>
                <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">מיקום העמדה / יעד השמירה *</label>
                <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="למשל: ד.ג מזרחי, פילבוקס 4..." />
              </div>
              <div className="card-grid card-grid-2">
                <div className="form-group">
                  <label className="form-label">שעת התחלה *</label>
                  <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">שעת סיום יעד *</label>
                  <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">משך מינימלי לכל משמרת</label>
                <select className="form-input" value={form.shift_duration} onChange={e => setForm(f => ({ ...f, shift_duration: parseInt(e.target.value) }))}>
                  <option value={60}>שעה 1</option>
                  <option value={120}>2 שעות</option>
                  <option value={180}>3 שעות</option>
                  <option value={240}>4 שעות</option>
                  <option value={360}>6 שעות</option>
                  <option value={480}>8 שעות</option>
                </select>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                לחיצה על שלח תייצר את חלונות המשמרת באופן אוטומטי ותאפשר לחיילים להשתבץ מתוך הפורטל האישי.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ביטול</button>
                <button className="btn btn-primary" onClick={publishEvent} disabled={saving}>{saving ? 'שולח ומייצר שיבוצים...' : 'שלח לשיבוץ!'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
