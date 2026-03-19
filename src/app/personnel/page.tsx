'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, Soldier, Department } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const RANKS = ['טוראי', 'רב טוראי', 'סמל', 'סמל ראשון', 'רס״ל', 'סגן', 'סרן', 'רב סרן', 'סגן אלוף', 'אלוף משנה'];

export default function PersonnelPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [soldiers, setSoldiers] = useState<Soldier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSoldier, setEditSoldier] = useState<Soldier | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'passwords'>('cards');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ full_name: '', rank: 'טוראי', role: '', phone: '', bio: '', department_id: '', photo_url: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [depsRes, solRes] = await Promise.all([
      supabase.from('departments').select('*').order('order'),
      supabase.from('soldiers').select('*, departments(name, icon)').order('full_name'),
    ]);
    setDepartments(depsRes.data || []);
    setSoldiers(solRes.data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditSoldier(null);
    setForm({ full_name: '', rank: 'טוראי', role: '', phone: '', bio: '', department_id: departments[0]?.id || '', photo_url: '' });
    setShowModal(true);
  };

  const openEdit = (s: Soldier) => {
    setEditSoldier(s);
    setForm({ full_name: s.full_name, rank: s.rank, role: s.role || '', phone: s.phone || '', bio: s.bio || '', department_id: s.department_id || '', photo_url: s.photo_url || '' });
    setShowModal(true);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${uuidv4()}.${ext}`;
    const { data, error } = await supabase.storage.from('soldier-photos').upload(path, file);
    if (error) { alert('שגיאה בהעלאת תמונה'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('soldier-photos').getPublicUrl(path);
    setForm(f => ({ ...f, photo_url: urlData.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.full_name) return;
    setSaving(true);
    const payload = { ...form };
    if (editSoldier) {
      await supabase.from('soldiers').update(payload).eq('id', editSoldier.id);
    } else {
      await supabase.from('soldiers').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    fetchAll();
  };

  const remove = async (id: string) => {
    if (!confirm('למחוק חייל זה?')) return;
    await supabase.from('soldiers').delete().eq('id', id);
    fetchAll();
  };

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/soldier/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const grouped = departments.map(dep => ({
    dep,
    soldiers: soldiers.filter(s => s.department_id === dep.id),
  }));
  const unassigned = soldiers.filter(s => !s.department_id);

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h2>👥 אנשי הפלוגה</h2>
            <button className="btn btn-primary" onClick={openNew}>+ הוסף חייל</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${activeTab === 'cards' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('cards')}>
              תצוגת כרטיסיות
            </button>
            <button className={`btn btn-sm ${activeTab === 'passwords' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('passwords')}>
              ניהול סיסמאות
            </button>
          </div>
        </div>
        <div className="page-body">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : activeTab === 'passwords' ? (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>שם קריאה / שם מלא</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>מחלקה</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>מספר אישי (מ.א)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>סיסמה</th>
                  </tr>
                </thead>
                <tbody>
                  {soldiers.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px' }}>{s.full_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>({s.rank})</span></td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{s.departments?.name || 'ללא מחלקה'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                        {s.personal_number ? s.personal_number : <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>לא נרשם עדין</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                        {s.password ? s.password : <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontFamily: 'Heebo' }}>-</span>}
                      </td>
                    </tr>
                  ))}
                  {soldiers.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>אין חיילים במערכת</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              {grouped.map(({ dep, soldiers: depSoldiers }) => depSoldiers.length > 0 && (
                <div key={dep.id} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.4rem' }}>{dep.icon}</span>
                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{dep.name}</h3>
                    <span className="badge badge-gray">{depSoldiers.length} חיילים</span>
                  </div>
                  <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                    {depSoldiers.map(s => (
                      <div key={s.id} className="soldier-card">
                        {s.photo_url ? (
                          <img src={s.photo_url} alt={s.full_name} className="soldier-photo" />
                        ) : (
                          <div className="soldier-avatar">{s.full_name.charAt(0)}</div>
                        )}
                        <h4>{s.full_name}</h4>
                        <p className="rank">{s.rank}</p>
                        {s.role && <p className="role">{s.role}</p>}
                        {s.phone && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', direction: 'ltr' }}>{s.phone}</p>}
                        {s.bio && <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.4 }}>{s.bio}</p>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button className="btn btn-secondary btn-sm" title="העתק לינק פורטל" onClick={() => copyPortalLink(s.unique_token)}>
                            {copiedToken === s.unique_token ? '✅ הועתק' : '🔗 לינק'}
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {unassigned.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ marginBottom: 16, color: 'var(--text-muted)' }}>ללא מחלקה</h3>
                  <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                    {unassigned.map(s => (
                      <div key={s.id} className="soldier-card">
                        {s.photo_url ? <img src={s.photo_url} alt={s.full_name} className="soldier-photo" /> : <div className="soldier-avatar">{s.full_name.charAt(0)}</div>}
                        <h4>{s.full_name}</h4>
                        <p className="rank">{s.rank}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => copyPortalLink(s.unique_token)}>{copiedToken === s.unique_token ? '✅' : '🔗'}</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {soldiers.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: 60 }}>
                  <p style={{ fontSize: '3rem', marginBottom: 12 }}>👥</p>
                  <p style={{ color: 'var(--text-muted)' }}>עדיין אין חיילים. הוסף את הראשון!</p>
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>+ הוסף חייל</button>
                </div>
              )}
            </>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal" style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h3>{editSoldier ? 'עריכת חייל' : 'הוספת חייל'}</h3>
                <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>

              {/* Photo Upload */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {form.photo_url ? (
                  <img src={form.photo_url} alt="תמונה" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-light)' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '3px solid var(--border-light)' }}>
                    {form.full_name ? form.full_name.charAt(0) : '👤'}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? 'מעלה...' : '📷 העלה תמונה'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]); }} />
                </div>
              </div>

              <div className="card-grid card-grid-2">
                <div className="form-group">
                  <label className="form-label">שם מלא *</label>
                  <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="שם ושם משפחה" />
                </div>
                <div className="form-group">
                  <label className="form-label">דרגה</label>
                  <select className="form-select" value={form.rank} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}>
                    {RANKS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">תפקיד</label>
                  <input className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="מ״כ, תשל, רופא..." />
                </div>
                <div className="form-group">
                  <label className="form-label">טלפון</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="050-..." dir="ltr" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">מחלקה</label>
                <select className="form-select" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">ללא מחלקה</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">כמה מילים</label>
                <textarea className="form-textarea" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="מה כדאי לדעת על החייל הזה?" rows={2} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ביטול</button>
                <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>{saving ? 'שומר...' : 'שמור'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
