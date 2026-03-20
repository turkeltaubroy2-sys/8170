'use client';

import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { supabase, TaskList, ListItem } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ListsPage() {
  const [lists, setLists] = useState<TaskList[]>([]);
  const [selectedList, setSelectedList] = useState<TaskList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [newItemAssigned, setNewItemAssigned] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLists = useCallback(async () => {
    const { data } = await supabase.from('lists').select('*').order('created_at', { ascending: false });
    setLists(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchLists();
    };
    load();
  }, [fetchLists]);

  const fetchItems = async (listId: string) => {
    const { data } = await supabase.from('list_items').select('*').eq('list_id', listId).order('created_at', { ascending: true });
    setItems(data || []);
  };

  const selectList = async (list: TaskList) => {
    setSelectedList(list);
    fetchItems(list.id);
  };

  const createList = async () => {
    if (!newListTitle) return;
    setSaving(true);
    const { data } = await supabase.from('lists').insert({ title: newListTitle, description: newListDesc }).select().single();
    setSaving(false);
    setShowListModal(false);
    setNewListTitle(''); setNewListDesc('');
    await fetchLists();
    if (data) selectList(data);
  };

  const deleteList = async (id: string) => {
    if (!confirm('למחוק רשימה זו וכל פריטיה?')) return;
    await supabase.from('lists').delete().eq('id', id);
    if (selectedList?.id === id) { setSelectedList(null); setItems([]); }
    fetchLists();
  };

  const addItem = async () => {
    if (!newItemText || !selectedList) return;
    await supabase.from('list_items').insert({ list_id: selectedList.id, text: newItemText, assigned_to: newItemAssigned });
    setNewItemText(''); setNewItemAssigned('');
    fetchItems(selectedList.id);
  };

  const toggleItem = async (item: ListItem) => {
    await supabase.from('list_items').update({ done: !item.done }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, done: !i.done } : i));
  };

  const deleteItem = async (id: string) => {
    await supabase.from('list_items').delete().eq('id', id);
    if (selectedList) fetchItems(selectedList.id);
  };

  const doneCount = items.filter(i => i.done).length;
  const pct = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <PageHeader 
          title="📋 רשימות ומשימות" 
          actions={<Button onClick={() => setShowListModal(true)}>+ רשימה חדשה</Button>}
        />
        <div className="page-body">
          <div className="lists-grid">
            {/* Lists sidebar */}
            <div>
              <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>רשימות</h3>
              {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
                lists.length === 0 ? (
                  <Card style={{ textAlign: 'center', padding: 30 }}>
                    <p style={{ fontSize: '2rem' }}>📋</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>אין רשימות עדיין</p>
                  </Card>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lists.map(list => (
                      <div key={list.id} onClick={() => selectList(list)} style={{
                        padding: '12px 14px', borderRadius: 'var(--radius)', border: `1px solid ${selectedList?.id === list.id ? 'var(--accent)' : 'var(--border)'}`,
                        background: selectedList?.id === list.id ? 'rgba(200,168,75,0.08)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: selectedList?.id === list.id ? 'var(--accent)' : 'var(--text)' }}>{list.title}</p>
                            {list.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{list.description}</p>}
                          </div>
                          <Button variant="danger" size="sm" onClick={e => { e.stopPropagation(); deleteList(list.id); }}>🗑️</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Items */}
            <div>
              {!selectedList ? (
                <Card style={{ textAlign: 'center', padding: 60 }}>
                  <p style={{ fontSize: '3rem', marginBottom: 12 }}>👈</p>
                  <p style={{ color: 'var(--text-muted)' }}>בחר רשימה מהצד הימני או צור רשימה חדשה</p>
                </Card>
              ) : (
                <Card title={selectedList.title} subtitle={selectedList.description || undefined}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{doneCount}/{items.length} בוצע</span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>

                  {/* Add item */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <Input value={newItemText} onChange={e => setNewItemText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="פריט חדש (Enter להוספה)" style={{ marginBottom: 0 }} />
                    </div>
                    <div style={{ flex: 0.5, minWidth: '100px' }}>
                      <Input value={newItemAssigned} onChange={e => setNewItemAssigned(e.target.value)} placeholder="אחראי" style={{ marginBottom: 0 }} />
                    </div>
                    <Button onClick={addItem} style={{ height: 42 }}>הוסף</Button>
                  </div>

                  {/* Items list */}
                  <div>
                    {items.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20, fontSize: '0.88rem' }}>הרשימה ריקה. הוסף פריטים!</p>
                    ) : items.map(item => (
                      <div key={item.id} className={`check-row ${item.done ? 'done' : ''}`}>
                        <input type="checkbox" checked={item.done} onChange={() => toggleItem(item)} />
                        <span style={{ flex: 1 }}>{item.text}</span>
                        {item.assigned_to && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 20 }}>{item.assigned_to}</span>}
                        <Button variant="danger" size="sm" onClick={() => deleteItem(item.id)}>✕</Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {showListModal && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowListModal(false); }}>
            <div className="modal">
              <div className="modal-header">
                <h3>רשימה חדשה</h3>
                <Button variant="secondary" size="icon" onClick={() => setShowListModal(false)}>✕</Button>
              </div>
              <Input label="שם הרשימה *" value={newListTitle} onChange={e => setNewListTitle(e.target.value)} placeholder="למשל: ציוד לאימון, משימות שבוע" />
              <Input label="תיאור" value={newListDesc} onChange={e => setNewListDesc(e.target.value)} placeholder="תיאור קצר (אופציונלי)" />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <Button variant="secondary" onClick={() => setShowListModal(false)}>ביטול</Button>
                <Button onClick={createList} loading={saving}>צור רשימה</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
