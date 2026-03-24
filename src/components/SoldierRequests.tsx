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
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

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
      if (!item) return;
      finalTitle = `מלא מחדש: ${item}`;
      finalDesc = `פריט: ${item}\nכמות: ${quantity || 'לא צוין'}\nהערות: ${notes || 'אין'}`;
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
    setItem('');
    setQuantity('');
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
              <div className="form-group">
                <label>פריט</label>
                <input className="form-input" required value={item} onChange={e => setItem(e.target.value)} placeholder="למשל: מים, מנות קרב, תחמושת..." />
              </div>
              <div className="form-group">
                <label>כמות (אופציונלי)</label>
                <input className="form-input" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="למשל: 5 ארגזים" />
              </div>
              <div className="form-group">
                <label>הערות</label>
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
