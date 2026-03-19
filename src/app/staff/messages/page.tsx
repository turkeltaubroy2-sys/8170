'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, Department, Message } from '@/lib/supabase';

export default function MessagesPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ title: '', content: '', target_department_id: '' });

  useEffect(() => {
    fetchMetadata();
    fetchMessages();
  }, []);

  const fetchMetadata = async () => {
    const { data } = await supabase.from('departments').select('*').order('order');
    if (data) setDepartments(data);
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*, departments(name), soldiers(full_name)')
      .order('created_at', { ascending: false });
    
    if (data) setMessages(data);
    setLoading(false);
  };

  const openNew = () => {
    setForm({ title: '', content: '', target_department_id: '' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    
    // Get current admin user ID purely for aesthetic reasons (created_by is optional or could be taken from auth if we had real auth)
    const adminStr = localStorage.getItem('soldier_id');
    const createdBy = adminStr || null;

    const payload = {
      title: form.title,
      content: form.content,
      target_department_id: form.target_department_id || null, // null means "all departments"
    };

    const { error } = await supabase.from('messages').insert(payload);
    setSaving(false);
    
    if (error) {
      alert('שגיאה בשליחת ההודעה: ' + error.message);
      return;
    }

    setShowModal(false);
    fetchMessages();
  };

  const remove = async (id: string) => {
    if (!confirm('האם למחוק הודעה זו? היא תוסר מהפורטל של החיילים.')) return;
    await supabase.from('messages').delete().eq('id', id);
    fetchMessages();
  };

  const formatDate = (dt: string) => {
    return new Date(dt).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>📢 הודעות פלוגה</h2>
          <button className="btn btn-primary" onClick={openNew}>+ שלח הודעה חדשה</button>
        </div>
        
        <div className="page-body">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : messages.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '3rem', marginBottom: 12 }}>📢</p>
              <p style={{ color: 'var(--text-muted)' }}>אין הודעות פעילות. שלח הודעה ראשונה לחיילים!</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>+ שלח הודעה</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map(msg => (
                <div key={msg.id} className="card" style={{ padding: 24, borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{msg.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                        🕑 נשלח ב: {formatDate(msg.created_at)}
                      </p>
                    </div>
                    <div>
                        {msg.target_department_id ? (
                            <span className="badge badge-blue">מיועד ל: {msg.departments?.name}</span>
                        ) : (
                            <span className="badge badge-green">מיועד ל: כלל הפלוגה</span>
                        )}
                    </div>
                  </div>
                  
                  <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, marginTop: 8 }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(msg.id)}>🗑️ מחק הודעה</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <div className="modal" style={{ maxWidth: 600 }}>
              <div className="modal-header">
                <h3>שלח הודעה חדשה</h3>
                <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="form-group">
                <label className="form-label">כותרת ההודעה *</label>
                <input 
                  className="form-input" 
                  value={form.title} 
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                  placeholder="למשל: תדריך בוקר לכלל הפלוגה" 
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label className="form-label">נמענים *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `2px solid ${form.target_department_id === '' ? 'var(--accent)' : 'var(--border)'}`, background: form.target_department_id === '' ? 'var(--accent)11' : 'transparent' }}>
                    <input type="radio" name="target" checked={form.target_department_id === ''} onChange={() => setForm(f => ({ ...f, target_department_id: '' }))} style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ fontWeight: 600 }}>🌍 כל המחלקות (פלוגתי)</span>
                  </label>
                  {departments.map(d => (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, border: `2px solid ${form.target_department_id === d.id ? 'var(--accent)' : 'var(--border)'}`, background: form.target_department_id === d.id ? 'var(--accent)11' : 'transparent' }}>
                      <input type="radio" name="target" checked={form.target_department_id === d.id} onChange={() => setForm(f => ({ ...f, target_department_id: d.id }))} style={{ accentColor: 'var(--accent)' }} />
                      <span>{d.icon} {d.name} בלבד</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">תוכן ההודעה *</label>
                <textarea 
                  className="form-textarea" 
                  value={form.content} 
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))} 
                  placeholder="הקלד את ההודעה לחיילים כאן..." 
                  rows={6} 
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>ביטול</button>
                <button className="btn btn-primary" onClick={save} disabled={saving || !form.title || !form.content}>
                  {saving ? 'שולח...' : '🚀 שלח הודעה'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
