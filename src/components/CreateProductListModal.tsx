'use client';

import { useState } from 'react';
import { supabase, Soldier } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Minus, X, UserPlus } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  soldiers: Pick<Soldier, 'id' | 'full_name'>[];
  currentUser: any;
}

export default function CreateProductListModal({ onClose, onSuccess, soldiers, currentUser }: Props) {
  const [title, setTitle] = useState('');
  const [statusOptions, setStatusOptions] = useState(['בוצע', 'קיים', 'קנייה']);
  const [newOption, setNewOption] = useState('');
  const [items, setItems] = useState(['']);
  const [visibility, setVisibility] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems([...items, '']);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, val: string) => setItems(items.map((it, i) => i === idx ? val : it));

  const addOption = () => {
    if (newOption && !statusOptions.includes(newOption)) {
      setStatusOptions([...statusOptions, newOption]);
      setNewOption('');
    }
  };
  const removeOption = (opt: string) => setStatusOptions(statusOptions.filter(o => o !== opt));

  const toggleVisibility = (id: string) => {
    setVisibility(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!title || items.filter(it => it.trim()).length === 0) {
      alert('נא להזין שם לרשימה ולפחות מוצר אחד');
      return;
    }

    setSaving(true);
    try {
      const { data: mission, error: mError } = await supabase
        .from('missions')
        .insert({
          title,
          type: 'product_list',
          status_options: statusOptions,
          visibility_soldier_ids: visibility,
          created_by: currentUser?.id
        })
        .select()
        .single();

      if (mError) throw mError;

      const itemsToInsert = items
        .filter(it => it.trim() !== '')
        .map(it => ({
          mission_id: mission.id,
          name: it,
          status: statusOptions[0]
        }));

      const { error: iError } = await supabase.from('mission_items').insert(itemsToInsert);
      if (iError) throw iError;

      onSuccess();
    } catch (err: any) {
      console.error('Error creating mission:', err);
      alert('שגיאה ביצירת המשימה: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 2000 }}>
      <div className="modal" style={{ maxWidth: 600, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>יצירת רשימת מוצרים חדשה</h3>
          <Button variant="secondary" size="icon" onClick={onClose}><X size={18} /></Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
          {/* Title */}
          <Input 
            label="שם הרשימה *" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder="למשל: רשימת קניות למוצב, ציוד חסר למחלקה" 
          />

          {/* Status Options */}
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>אפשרויות סטטוס</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {statusOptions.map(opt => (
                <Badge key={opt} variant="gray" style={{ background: 'var(--bg-surface)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {opt}
                  <button onClick={() => removeOption(opt)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0 }}><X size={12} /></button>
                </Badge>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input 
                value={newOption} 
                onChange={e => setNewOption(e.target.value)} 
                placeholder="הוסף אפשרות סטטוס..." 
                style={{ marginBottom: 0 }}
                onKeyDown={e => e.key === 'Enter' && addOption()}
              />
              <Button variant="secondary" onClick={addOption} style={{ height: 42 }}>הוסף</Button>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>מי יכול לראות את הרשימה? (אם ריק - כולם)</label>
            <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {soldiers.map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, background: visibility.includes(s.id) ? 'var(--bg-surface)' : 'transparent' }}>
                    <input type="checkbox" checked={visibility.includes(s.id)} onChange={() => toggleVisibility(s.id)} />
                    {s.full_name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 8, display: 'block' }}>מוצרים ברשימה *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8 }}>
                  <Input 
                    value={item} 
                    onChange={e => updateItem(idx, e.target.value)} 
                    placeholder={`מוצר ${idx + 1}...`} 
                    style={{ marginBottom: 0 }}
                  />
                  {items.length > 1 && (
                    <Button variant="danger" size="icon" onClick={() => removeItem(idx)} style={{ height: 42, flexShrink: 0 }}>
                      <Minus size={18} />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="secondary" onClick={addItem} style={{ width: 'fit-content', borderStyle: 'dashed' }}>
                <Plus size={16} /> הוסף מוצר
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="secondary" onClick={onClose}>ביטול</Button>
            <Button onClick={handleSave} loading={saving}>צור רשימה</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
