'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Mission, MissionItem, Soldier } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Users, ClipboardList, Trash } from 'lucide-react';
import CreateProductListModal from './CreateProductListModal';

export default function MissionsTab() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [items, setItems] = useState<Record<string, MissionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [soldiers, setSoldiers] = useState<Pick<Soldier, 'id' | 'full_name'>[]>([]);
  const [currentUser, setCurrentUser] = useState<Soldier | null>(null);
  const [newItemName, setNewItemName] = useState<Record<string, string>>({});

  const fetchMissions = useCallback(async (currentSoldierId?: string) => {
    try {
      const { data: missionsData, error: mError } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (mError) throw mError;

      // Client-side visibility filtering
      const filteredMissions = (missionsData || []).filter(m => {
        if (!m.visibility_soldier_ids || m.visibility_soldier_ids.length === 0) return true;
        if (currentSoldierId && (m.created_by === currentSoldierId || m.visibility_soldier_ids.includes(currentSoldierId))) return true;
        return false;
      });

      setMissions(filteredMissions);

      // Fetch items for each mission
      if (filteredMissions.length > 0) {
        const itemResults = await Promise.all(
          filteredMissions.map(m => 
            supabase.from('mission_items').select('*').eq('mission_id', m.id).order('created_at', { ascending: true })
          )
        );

        const newItems: Record<string, MissionItem[]> = {};
        filteredMissions.forEach((m, i) => {
          newItems[m.id] = itemResults[i].data || [];
        });
        setItems(newItems);
      }
    } catch (err) {
      console.error('Error fetching missions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSoldiers = useCallback(async () => {
    const { data } = await supabase.from('soldiers').select('id, full_name').order('full_name');
    setSoldiers(data || []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const userJson = localStorage.getItem('plugah_user');
      if (userJson) {
        const localUser = JSON.parse(userJson);
        // Find the full profile to get the ID
        const { data: profile } = await supabase.from('soldiers').select('*').eq('full_name', localUser.name).single();
        if (profile) {
          setCurrentUser(profile);
          fetchMissions(profile.id);
        } else {
          fetchMissions();
        }
      } else {
        fetchMissions();
      }
      fetchSoldiers();
    };
    init();
  }, [fetchMissions, fetchSoldiers]);

  const updateItemStatus = async (missionId: string, itemId: string, newStatus: string) => {
    await supabase.from('mission_items').update({ status: newStatus }).eq('id', itemId);
    setItems(prev => ({
      ...prev,
      [missionId]: prev[missionId].map(item => item.id === itemId ? { ...item, status: newStatus } : item)
    }));
  };

  const addItem = async (missionId: string) => {
    const name = newItemName[missionId];
    if (!name) return;

    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;

    const { data: newItem, error } = await supabase.from('mission_items').insert({
      mission_id: missionId,
      name,
      status: mission.status_options[0]
    }).select().single();

    if (error) {
      console.error('Error adding item:', error);
      return;
    }

    setItems(prev => ({
      ...prev,
      [missionId]: [...(prev[missionId] || []), newItem]
    }));
    setNewItemName(prev => ({ ...prev, [missionId]: '' }));
  };

  const deleteItem = async (missionId: string, itemId: string) => {
    if (!confirm('האם למחוק פריט זה?')) return;
    await supabase.from('mission_items').delete().eq('id', itemId);
    setItems(prev => ({
      ...prev,
      [missionId]: prev[missionId].filter(i => i.id !== itemId)
    }));
  };

  const deleteMission = async (id: string) => {
    if (!confirm('האם למחוק את כל הרשימה?')) return;
    await supabase.from('missions').delete().eq('id', id);
    setMissions(prev => prev.filter(m => m.id !== id));
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📋 ניהול משימות ורשימות</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            שלום, <strong style={{color: 'var(--accent)'}}>{currentUser?.full_name || 'אורח'}</strong>. צפה וערוך את המשימות הרלוונטיות אליך.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> יצירת משימה חדשה
        </Button>
      </div>

      {missions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>אין משימות זמינות בשבילך</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>יתכן שאין משימות פתוחות כרגע, או שאין לך הרשאה לצפות בהן.</p>
          <Button variant="secondary" onClick={() => setShowCreateModal(true)} style={{ marginTop: 20 }}>
            <Plus size={16} /> צור משימה ראשונה
          </Button>
        </Card>
      ) : (
        <div className="card-grid card-grid-2">
          {missions.map(mission => (
            <Card key={mission.id} title={mission.title} subtitle={mission.type === 'product_list' ? 'רשימת מוצרים' : 'משימה'} actions={
              <Button variant="danger" size="icon" onClick={() => deleteMission(mission.id)}><Trash2 size={16} /></Button>
            }>
              <div style={{ marginTop: 12 }}>
                {mission.visibility_soldier_ids && mission.visibility_soldier_ids.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-dim)', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 20, width: 'fit-content' }}>
                    <Users size={14} />
                    <span>מוגבל לצפייה</span>
                  </div>
                )}

                <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ background: 'none', padding: '0 8px', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>מוצר</th>
                        <th style={{ background: 'none', padding: '0 8px', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>סטטוס</th>
                        <th style={{ background: 'none', padding: '0 8px', width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(items[mission.id] || []).map(item => (
                        <tr key={item.id}>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
                            <Select 
                              value={item.status} 
                              onChange={(e) => updateItemStatus(mission.id, item.id, e.target.value)}
                              style={{ marginBottom: 0, padding: '4px 8px', fontSize: '0.8rem', height: 32 }}
                              options={mission.status_options.map(opt => ({ value: opt, label: opt }))}
                            />
                          </td>
                          <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
                            <button onClick={() => deleteItem(mission.id, item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.6 }}>
                              <Trash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Item Row */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: '1px dashed var(--border)', paddingTop: 16 }}>
                  <Input 
                    value={newItemName[mission.id] || ''}
                    onChange={e => setNewItemName({ ...newItemName, [mission.id]: e.target.value })}
                    placeholder="הוסף מוצר חדש..."
                    style={{ marginBottom: 0, height: 36, fontSize: '0.85rem' }}
                    onKeyDown={e => e.key === 'Enter' && addItem(mission.id)}
                  />
                  <Button variant="secondary" onClick={() => addItem(mission.id)} style={{ height: 36, padding: '0 12px' }}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProductListModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => { setShowCreateModal(false); fetchMissions(currentUser?.id); }}
          soldiers={soldiers}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
