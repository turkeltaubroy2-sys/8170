'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, Schedule } from '@/lib/supabase';

const COLOR_OPTIONS = [
  { label: 'ירוק', value: '#4A6741' },
  { label: 'זהב', value: '#C8A84B' },
  { label: 'כחול', value: '#2980b9' },
  { label: 'אדום', value: '#c0392b' },
  { label: 'סגול', value: '#8e44ad' },
];

const EVENT_TYPES: Record<string, string> = {
  '#4A6741': 'badge-green',
  '#C8A84B': 'badge-yellow',
  '#2980b9': 'badge-blue',
  '#c0392b': 'badge-red',
  '#8e44ad': 'badge-gray',
};

export default function SchedulePage() {
  const [events, setEvents] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', start_time: '', end_time: '', location: '', color: '#4A6741', all_day: false,
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from('schedules').select('*').order('start_time', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditEvent(null);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setForm({ title: '', description: '', start_time: now.toISOString().slice(0,16), end_time: '', location: '', color: '#4A6741', all_day: false });
    setShowModal(true);
  };

  const openEdit = (ev: Schedule) => {
    setEditEvent(ev);
    setForm({
      title: ev.title, description: ev.description || '', start_time: ev.start_time?.slice(0,16) || '',
      end_time: ev.end_time?.slice(0,16) || '', location: ev.location || '', color: ev.color || '#4A6741', all_day: ev.all_day,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title || !form.start_time) return;
    setSaving(true);
    const payload = { ...form, start_time: new Date(form.start_time).toISOString(), end_time: form.end_time ? new Date(form.end_time).toISOString() : null };
    if (editEvent) {
      await supabase.from('schedules').update(payload).eq('id', editEvent.id);
    } else {
      await supabase.from('schedules').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    fetchEvents();
  };

  const remove = async (id: string) => {
    if (!confirm('למחוק אירוע זה?')) return;
    await supabase.from('schedules').delete().eq('id', id);
    fetchEvents();
  };

  const formatDate = (dt: string) => new Date(dt).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Group by month
  const grouped: Record<string, Schedule[]> = {};
  events.forEach(ev => {
    const key = new Date(ev.start_time).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>📅 לוח שנה</h2>
          <button className="btn btn-primary" onClick={openNew}>+ אירוע חדש</button>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>טוען...</span></div>
          ) : events.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '3rem', marginBottom: 12 }}>📅</p>
              <p style={{ color: 'var(--text-muted)' }}>אין אירועים עדיין. הוסף אירוע ראשון!</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>+ הוסף אירוע</button>
            </div>
          ) : (
            Object.entries(grouped).map(([month, evs]) => (
              <div key={month} style={{ marginBottom: 28 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 12, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1 }}>{month}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {evs.map(ev => (
                    <div key={ev.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16 }}>
                      <div style={{ width: 5, borderRadius: 4, background: ev.color || 'var(--accent)', alignSelf: 'stretch', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{ev.title}</h4>
                          {ev.all_day && <span className="badge badge-green">כל היום</span>}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>🕐 {formatDate(ev.start_time)}{ev.end_time ? ` — ${formatDate(ev.end_time)}` : ''}</p>
                        {ev.location && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>📍 {ev.location}</p>}
                        {ev.description && <p style={{ fontSize: '0.85rem', marginTop: 6, color: 'var(--text)' }}>{ev.description}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(ev)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(ev.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal">
              <div className="modal-header">
                <h3>{editEvent ? 'עריכת אירוע' : 'אירוע חדש'}</h3>
                <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">כותרת *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="שם האירוע" />
              </div>
              <div className="form-group">
                <label className="form-label">תיאור</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="פרטים נוספים..." />
              </div>
              <div className="card-grid card-grid-2">
                <div className="form-group">
                  <label className="form-label">תחילה *</label>
                  <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">סיום</label>
                  <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">מיקום</label>
                <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="כתובת / מיקום" />
              </div>
              <div className="form-group">
                <label className="form-label">צבע</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))} style={{
                      width: 32, height: 32, borderRadius: 6, background: c.value, border: form.color === c.value ? '3px solid white' : '2px solid transparent', cursor: 'pointer',
                    }} title={c.label} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ביטול</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : 'שמור'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
