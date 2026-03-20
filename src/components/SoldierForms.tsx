'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { FormType, FormResponse } from '@/lib/supabase';
import { ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SoldierForms({ soldierId }: { soldierId: string }) {
  const [forms, setForms] = useState<FormType[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const fetchForms = useCallback(async () => {
    setLoading(true);
    // Fetch active forms
    const { data: fData } = await supabase.from('forms').select('*').eq('active', true).order('created_at', { ascending: false });
    // Fetch my responses
    const { data: rData } = await supabase.from('form_responses').select('*').eq('soldier_id', soldierId);
    
    setForms(fData || []);
    setResponses(rData || []);
    setLoading(false);
  }, [soldierId]);

  useEffect(() => {
    const load = async () => {
      await fetchForms();
    };
    load();
  }, [fetchForms]);

  const submitResponse = async (formId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!answers[formId]) return;
    
    // Check if already responded (prevent double submission)
    if (responses.find(r => r.form_id === formId)) return;
    
    await supabase.from('form_responses').insert([{
      form_id: formId,
      soldier_id: soldierId,
      response_data: { q1: answers[formId] }
    }]);
    
    const newAnswers = { ...answers };
    delete newAnswers[formId];
    setAnswers(newAnswers);
    fetchForms();
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={18} className="text-muted" /> דוחות ושאלונים פתוחים</h3>
      
      {forms.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>אין דוחות או שאלונים פתוחים כרגע.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {forms.map(f => {
            const hasResponded = responses.find(r => r.form_id === f.id);
            return (
              <div key={f.id} className="card" style={{ borderLeft: `4px solid ${hasResponded ? 'var(--success)' : 'var(--warning)'}` }}>
                <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {f.title} 
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: hasResponded ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {hasResponded ? <><CheckCircle2 size={14} /> הושלם</> : <><AlertCircle size={14} /> חובה למלא</>}
                  </span>
                </h4>
                {f.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 8 }}>{f.description}</p>}
                
                {hasResponded ? (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>התשובה שלך התקבלה בהצלחה ({new Date(hasResponded.created_at).toLocaleDateString('he-IL')}).</p>
                    <p style={{ fontSize: '0.9rem', marginTop: 4, fontWeight: 500 }}>{hasResponded.response_data?.q1 || ''}</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => submitResponse(f.id, e)} style={{ marginTop: 16 }}>
                    <div className="form-group">
                      <label>{f.fields[0]?.label || 'הזן תשובה...'}</label>
                      <input 
                        className="form-input" 
                        required={f.fields[0]?.required !== false}
                        value={answers[f.id] || ''} 
                        onChange={e => setAnswers({ ...answers, [f.id]: e.target.value })} 
                        placeholder="תשובה..." 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>שלח דיווח</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
