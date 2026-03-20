'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, Schedule, Department, Soldier } from '@/lib/supabase';

const COLOR_OPTIONS = [
  { label: 'ירוק', value: '#4A6741' },
  { label: 'זהב', value: '#C8A84B' },
  { label: 'כחול', value: '#2980b9' },
  { label: 'אדום', value: '#c0392b' },
  { label: 'סגול', value: '#8e44ad' },
];

// department_scope values:
//   '' or null  → כל המחלקות (both / general)
//   <uuid>      → specific department

export default function SchedulePage() {
  const [events, setEvents] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Schedule | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [soldiers, setSoldiers] = useState<Pick<Soldier, 'id' | 'full_name' | 'department_id'>[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState<string>(''); // '' = show all

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    color: '#4A6741',
    all_day: false,
    department_id: '',   // '' means "all/both departments"
    commander_id: '',
  });

  const fetchMetadata = useCallback(async () => {
    const [deps, sols] = await Promise.all([
      supabase.from('departments').select('id, name, icon, order').order('order'),
      supabase.from('soldiers').select('id, full_name, department_id').order('full_name'),
    ]);
    if (deps.data) setDepartments(deps.data);
    if (sols.data) setSoldiers(sols.data);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedules')
      .select('*, departments(name, icon), soldiers(full_name)')
      .order('start_time', { ascending: true });
    if (error) {
      console.error('Error fetching schedules:', error);
    }
    setEvents(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchEvents();
      await fetchMetadata();
    };
    load();
  }, [fetchEvents, fetchMetadata]);

  const openNew = () => {
    setEditEvent(null);
    setSaveError(null);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setForm({
      title: '',
      description: '',
      start_time: now.toISOString().slice(0, 16),
      end_time: '',
      location: '',
      color: '#4A6741',
      all_day: false,
      department_id: '',
      commander_id: '',
    });
    setShowModal(true);
  };

  const openEdit = (ev: Schedule) => {
    setEditEvent(ev);
    setSaveError(null);
    setForm({
      title: ev.title,
      description: ev.description || '',
      start_time: ev.start_time?.slice(0, 16) || '',
      end_time: ev.end_time?.slice(0, 16) || '',
      location: ev.location || '',
      color: ev.color || '#4A6741',
      all_day: ev.all_day,
      department_id: ev.department_id || '',
      commander_id: ev.commander_id || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim()) { setSaveError('יש להזין כותרת לאירוע'); return; }
    if (!form.start_time) { setSaveError('יש להזין שעת התחלה'); return; }
    setSaving(true);
    setSaveError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_time: new Date(form.start_time).toISOString(),
      end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      location: form.location.trim() || null,
      color: form.color,
      all_day: form.all_day,
      department_id: form.department_id || null,   // null = כל המחלקות
      commander_id: form.commander_id || null,
    };

    let error;
    if (editEvent) {
      const res = await supabase.from('schedules').update(payload).eq('id', editEvent.id);
      error = res.error;
    } else {
      const res = await supabase.from('schedules').insert(payload);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      console.error('Save error:', error);
      setSaveError(`שגיאה: ${error.message}`);
      return;
    }

    setShowModal(false);
    fetchEvents();
  };

  const remove = async (id: string) => {
    if (!confirm('למחוק אירוע זה?')) return;
    await supabase.from('schedules').delete().eq('id', id);
    fetchEvents();
  };

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Filter events by selected department tab
  const filteredEvents = filterDept
    ? events.filter(ev => !ev.department_id || ev.department_id === filterDept)
    : events;

  // Group by month
  const grouped: Record<string, Schedule[]> = {};
  filteredEvents.forEach(ev => {
    const key = new Date(ev.start_time).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  const getDeptLabel = (ev: Schedule) => {
    if (!ev.department_id) return '🏠 כל המחלקות';
    if (ev.departments) return `${ev.departments.icon} ${ev.departments.name}`;
    return null;
  };

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>📅 לוח שנה</h2>
          <button className="btn btn-primary" onClick={openNew}>+ אירוע חדש</button>
        </div>

        {/* Department filter tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '0 24px 16px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterDept === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterDept('')}
          >
            🏠 הכל
          </button>
          {departments.map(d => (
            <button
              key={d.id}
              className={`btn btn-sm ${filterDept === d.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterDept(d.id)}
            >
              {d.icon} {d.name}
            </button>
          ))}
        </div>

        <div className="page-body">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><span>טוען...</span></div>
          ) : filteredEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '3rem', marginBottom: 12 }}>📅</p>
              <p style={{ color: 'var(--text-muted)' }}>
                {filterDept
                  ? 'אין אירועים למחלקה זו. הוסף אירוע ראשון!'
                  : 'אין אירועים עדיין. הוסף אירוע ראשון!'}
              </p>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{ev.title}</h4>
                          {ev.all_day && <span className="badge badge-green">כל היום</span>}
                          {ev.status === 'completed' && (
                            <span className="badge badge-gray" style={{ background: '#27ae6022', color: '#27ae60', border: '1px solid currentColor' }}>✓ הושלמה</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          🕐 {formatDate(ev.start_time)}{ev.end_time ? ` — ${formatDate(ev.end_time)}` : ''}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
                          {ev.location && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📍 {ev.location}</span>}
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{getDeptLabel(ev)}</span>
                          {ev.soldiers && (
                            <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>
                              🪖 חפ&quot;ק / מפקד: {ev.soldiers.full_name}
                            </span>
                          )}
                        </div>

                        {ev.description && <p style={{ fontSize: '0.85rem', marginTop: 10, color: 'var(--text)' }}>{ev.description}</p>}
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

              {saveError && (
                <div style={{ background: '#c0392b22', border: '1px solid #c0392b66', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#c0392b', fontSize: '0.85rem' }}>
                  ⚠️ {saveError}
                </div>
              )}

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

              {/* Department selector */}
              <div className="form-group">
                <label className="form-label">שיוך למחלקה</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* "Both / All" option */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: `2px solid ${form.department_id === '' ? 'var(--accent)' : 'var(--border)'}`, background: form.department_id === '' ? 'var(--accent)11' : 'transparent' }}>
                    <input type="radio" name="dept" checked={form.department_id === ''} onChange={() => setForm(f => ({ ...f, department_id: '', commander_id: '' }))} style={{ accentColor: 'var(--accent)' }} />
                    <span>🏠 כל המחלקות (שתיהן)</span>
                  </label>
                  {/* Individual departments */}
                  {departments.map(d => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: `2px solid ${form.department_id === d.id ? 'var(--accent)' : 'var(--border)'}`, background: form.department_id === d.id ? 'var(--accent)11' : 'transparent' }}>
                      <input type="radio" name="dept" checked={form.department_id === d.id} onChange={() => setForm(f => ({ ...f, department_id: d.id, commander_id: '' }))} style={{ accentColor: 'var(--accent)' }} />
                      <span>{d.icon} {d.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">מפקד אירוע</label>
                <select className="form-input" value={form.commander_id} onChange={e => setForm(f => ({ ...f, commander_id: e.target.value }))}>
                  <option value="">בחר חייל לפקוד על המשימה...</option>
                  {soldiers.filter(s => !form.department_id || s.department_id === form.department_id).map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">מיקום</label>
                <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="כתובת / עמדה / מיקום" />
              </div>
              <div className="form-group">
                <label className="form-label">צבע</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, color: c.value }))} style={{
                      width: 32, height: 32, borderRadius: 6, background: c.value,
                      border: form.color === c.value ? '3px solid white' : '2px solid transparent', cursor: 'pointer',
                    }} title={c.label} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <input type="checkbox" id="all_day" checked={form.all_day} onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))} />
                <label htmlFor="all_day" style={{ cursor: 'pointer' }}>אירוע יום שלם</label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ביטול</button>
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
