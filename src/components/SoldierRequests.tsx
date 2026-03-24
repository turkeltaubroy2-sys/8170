'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SoldierRequest } from '@/lib/supabase';
import { Send, FileCheck } from 'lucide-react';

export default function SoldierRequests({ soldierId, soldierRole, soldierName }: { soldierId: string, soldierRole?: string, soldierName?: string }) {
  const isStaff = (soldierRole && (
    soldierRole.includes('מפקד') || 
    soldierRole.includes('סמל') || 
    soldierRole.includes('רס"פ') || soldierRole.includes('רספ') ||
    soldierRole.includes('סמ"פ') || soldierRole.includes('סמפ') ||
    soldierRole.includes('מ"פ') || soldierRole.includes('מפ') ||
    soldierRole.includes('קצין') ||
    soldierRole.includes('סגל') ||
    soldierRole.includes('מ. מחלקה') ||
    soldierRole.includes('ס. מחלקה')
  )) || (
    // Explicit list of staff members provided by user
    soldierName?.includes('טורקלטאוב') || 
    soldierName?.includes('רועי') ||
    soldierName?.includes('איתי אזולאי') ||
    soldierName?.includes('אזולאי')
  );

  const [requests, setRequests] = useState<SoldierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('ציוד');
  
  // Refill specific state
  const [items, setItems] = useState([{ item: '', quantity: '' }]);
  const [notes, setNotes] = useState('');

  const addItem = () => setItems([...items, { item: '', quantity: '' }]);
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };
  const updateItem = (index: number, field: 'item' | 'quantity', value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('soldier_id', soldierId)
      .order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }, [soldierId]);

  useEffect(() => {
    const load = async () => {
      await fetchMyRequests();
    };
    load();
  }, [fetchMyRequests]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalTitle = title;
    let finalDesc = desc;
    const finalType = type;

    if (type === 'מלא מחדש') {
      const validItems = items.filter(i => i.item.trim() !== '');
      if (validItems.length === 0) return;
      
      finalTitle = `מלא מחדש: ${validItems[0].item}${validItems.length > 1 ? ` (+${validItems.length - 1} נוספים)` : ''}`;
      finalDesc = validItems.map(i => `• ${i.item}: ${i.quantity || 'לא צוין'}`).join('\n');
      if (notes) finalDesc += `\n\nהערות: ${notes}`;
    } else {
      if (!title) return;
    }

    await supabase.from('requests').insert([{ 
      soldier_id: soldierId, 
      title: finalTitle, 
      description: finalDesc, 
      type: finalType 
    }]);

    setTitle('');
    setDesc('');
    setItems([{ item: '', quantity: '' }]);
    setNotes('');
    if (isStaff) setType('ציוד'); // Reset to default
    fetchMyRequests();
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Send size={18} className="text-muted" /> פניה חדשה לסגל</h3>
        <form onSubmit={submitRequest}>
          <div className="form-group">
            <label>סוג פניה</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="ציוד">ציוד חסר (נעליים, דיסקית...)</option>
              <option value="רפואי">בעיה רפואית</option>
              <option value="כללי">אחר / כללי</option>
              {isStaff && <option value="מלא מחדש">✨ מלא מחדש (סגל בלבד)</option>}
            </select>
          </div>

          {type === 'מלא מחדש' ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, alignItems: 'end', background: 'var(--bg)', padding: 8, borderRadius: 8 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>פריט</label>
                      <input 
                        className="form-input" 
                        required={idx === 0} 
                        value={it.item} 
                        onChange={e => updateItem(idx, 'item', e.target.value)} 
                        placeholder="למשל: מים" 
                        style={{ padding: '6px 8px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.7rem' }}>כמות</label>
                      <input 
                        className="form-input" 
                        value={it.quantity} 
                        onChange={e => updateItem(idx, 'quantity', e.target.value)} 
                        placeholder="למשל: 5" 
                        style={{ padding: '6px 8px' }}
                      />
                    </div>
                    {items.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)}
                        style={{ padding: '8px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={addItem}
                  style={{ fontSize: '0.8rem', padding: '6px', width: 'fit-content' }}
                >
                  ➕ הוסף שורה
                </button>
              </div>
              <div className="form-group">
                <label>הערות נוספות</label>
                <textarea className="form-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="דגשים נוספים..." />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>נושא</label>
                <input className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="למשל: צריך נעלי שטח מידה 43" />
              </div>
              <div className="form-group">
                <label>פירוט נוסף</label>
                <textarea className="form-textarea" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="פירוט הבקשה..." />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>שלח פניה</button>
        </form>
      </div>

      <h4 style={{ color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FileCheck size={18} /> הפניות האחרונות שלי</h4>
      {requests.length === 0 ? <p style={{ fontSize: '0.85rem' }}>לא הגשת פניות עדיין.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map(r => (
            <div key={r.id} className="card" style={{ padding: 12, borderRight: `4px solid ${r.status === 'פתוח' ? 'var(--danger)' : r.status === 'בטיפול' ? 'var(--warning)' : 'var(--success)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <strong style={{ fontSize: '0.9rem' }}>{r.title}</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.status === 'פתוח' ? 'var(--danger)' : r.status === 'בטיפול' ? 'var(--warning)' : 'var(--success)' }}>
                  {r.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.description}</p>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 8 }}>
                {new Date(r.created_at).toLocaleDateString('he-IL')} • {r.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
