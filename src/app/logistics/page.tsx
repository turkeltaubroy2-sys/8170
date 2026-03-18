'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, LogisticsItem } from '@/lib/supabase';

const CATEGORIES = ['כללי', 'נשק וציוד', 'רכב', 'מזון', 'רפואה', 'תקשורת', 'מדים'];
const STATUSES = ['זמין', 'חסר', 'תקוע', 'בתיקון'];

const statusBadge: Record<string, string> = {
  'זמין': 'badge-green',
  'חסר': 'badge-red',
  'תקוע': 'badge-yellow',
  'בתיקון': 'badge-blue',
};

export default function LogisticsPage() {
  const [items, setItems] = useState<LogisticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<LogisticsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ title: '', category: 'כללי', quantity: 1, unit: 'יחידה', status: 'זמין', notes: '', assigned_to: '' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('logistics').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ title: '', category: 'כללי', quantity: 1, unit: 'יחידה', status: 'זמין', notes: '', assigned_to: '' });
    setShowModal(true);
  };

  const openEdit = (item: LogisticsItem) => {
    setEditItem(item);
    setForm({ title: item.title, category: item.category, quantity: item.quantity, unit: item.unit, status: item.status, notes: item.notes || '', assigned_to: item.assigned_to || '' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    if (editItem) {
      await supabase.from('logistics').update(form).eq('id', editItem.id);
    } else {
      await supabase.from('logistics').insert(form);
    }
    setSaving(false);
    setShowModal(false);
    fetchItems();
  };

  const remove = async (id: string) => {
    if (!confirm('למחוק פריט זה?')) return;
    await supabase.from('logistics').delete().eq('id', id);
    fetchItems();
  };

  const filtered = items.filter(i => (!filterCat || i.category === filterCat) && (!filterStatus || i.status === filterStatus));

  const summary = { total: items.length, missing: items.filter(i => i.status === 'חסר').length, broken: items.filter(i => i.status === 'תקוע' || i.status === 'בתיקון').length };

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>📦 לוגיסטיקה</h2>
          <button className="btn btn-primary" onClick={openNew}>+ פריט חדש</button>
        </div>
        <div className="page-body">
          {/* Summary Cards */}
          <div className="card-grid card-grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info"><h3>{summary.total}</h3><p>סך פריטים</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(192,57,43,0.2)' }}>⚠️</div>
              <div className="stat-info"><h3 style={{ color: 'var(--danger)' }}>{summary.missing}</h3><p>חסר</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(230,126,34,0.2)' }}>🔧</div>
              <div className="stat-info"><h3 style={{ color: 'var(--warning)' }}>{summary.broken}</h3><p>תקוע/בתיקון</p></div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <select className="form-select" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">כל הקטגוריות</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">כל הסטטוסים</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>פריט</th>
                    <th>קטגוריה</th>
                    <th>כמות</th>
                    <th>סטטוס</th>
                    <th>אחראי</th>
                    <th>הערות</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>אין פריטים</td></tr>
                  ) : filtered.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.title}</td>
                      <td><span className="badge badge-gray">{item.category}</span></td>
                      <td>{item.quantity} {item.unit}</td>
                      <td><span className={`badge ${statusBadge[item.status] || 'badge-gray'}`}>{item.status}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.assigned_to || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: 200 }}>{item.notes || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(item.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal">
              <div className="modal-header">
                <h3>{editItem ? 'עריכת פריט' : 'פריט חדש'}</h3>
                <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">שם הפריט *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="שם הפריט" />
              </div>
              <div className="card-grid card-grid-2">
                <div className="form-group">
                  <label className="form-label">קטגוריה</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">סטטוס</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">כמות</label>
                  <input type="number" className="form-input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">יחידה</label>
                  <input className="form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="יחידה, ק״ג, ..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">אחראי</label>
                <input className="form-input" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="שם אחראי" />
              </div>
              <div className="form-group">
                <label className="form-label">הערות</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="הערות נוספות" />
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
