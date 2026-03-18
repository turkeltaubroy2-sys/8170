'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FormType, FormResponse } from '@/lib/supabase';

export default function StaffForms() {
  const [forms, setForms] = useState<FormType[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  // Basic support for one text question and one select question for MVP
  const [q1, setQ1] = useState('הצהרת בריאות יומית למילואים');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    const { data: fData } = await supabase.from('forms').select('*').order('created_at', { ascending: false });
    const { data: rData } = await supabase.from('form_responses').select('*, soldiers(full_name, departments(name))').order('created_at', { ascending: false });
    
    setForms(fData || []);
    setResponses(rData || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    
    const newForm = {
      title: newTitle,
      description: newDesc,
      fields: [
        { id: 'q1', type: 'text', label: q1, required: true }
      ],
      created_by: 'סגל',
      active: true
    };
    
    await supabase.from('forms').insert([newForm]);
    setShowCreate(false);
    setNewTitle('');
    setNewDesc('');
    setQ1('');
    fetchForms();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase.from('forms').update({ active: !currentStatus }).eq('id', id);
    fetchForms();
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3>שאלונים ודוחות (דוח 1)</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'ביטול' : '➕ צור שאלון חדש'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 20 }}>
          <div className="form-group">
            <label>כותרת השאלון (לדוגמה: דוח 1, בקשת מידות)</label>
            <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>תיאור (אופציונלי)</label>
            <input className="form-input" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          </div>
          <div className="form-group">
            <label>שאלה פתוחה (יוצג לחייל למילוי)</label>
            <input className="form-input" value={q1} onChange={e => setQ1(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>שמור ופרסם</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Forms List */}
        <div>
          <h4 style={{ marginBottom: 12, color: 'var(--text-muted)' }}>שאלונים פעילים</h4>
          {forms.length === 0 ? <p style={{ fontSize: '0.85rem' }}>אין שאלונים.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {forms.map(f => (
                <div key={f.id} style={{ padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', borderRight: f.active ? '4px solid var(--primary)' : '4px solid var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{f.title}</strong>
                    <button 
                      onClick={() => toggleActive(f.id, f.active)}
                      style={{ background: 'none', border: 'none', color: f.active ? 'var(--warning)' : 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      {f.active ? 'השעה' : 'הפעל'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>{f.description}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 8 }}>
                    {responses.filter(r => r.form_id === f.id).length} ענו
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Responses */}
        <div>
          <h4 style={{ marginBottom: 12, color: 'var(--text-muted)' }}>תשובות שהתקבלו (אחרונות)</h4>
          {responses.length === 0 ? <p style={{ fontSize: '0.85rem' }}>טרם התקבלו תשובות.</p> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>חייל</th>
                    <th>שאלון</th>
                    <th>תשובה (Q1)</th>
                    <th>תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.slice(0, 15).map(r => {
                    const form = forms.find(f => f.id === r.form_id);
                    return (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.soldiers?.full_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {/* @ts-ignore */}
                            {r.soldiers?.departments?.name}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{form?.title || 'שאלון נמחק'}</td>
                        <td style={{ fontSize: '0.85rem', maxWidth: 200 }}>
                          {r.response_data?.q1 || JSON.stringify(r.response_data)}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(r.created_at).toLocaleDateString('he-IL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
