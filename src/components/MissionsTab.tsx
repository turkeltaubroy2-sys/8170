'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Mission, MissionItem, Soldier } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Plus, Trash2, Users, ClipboardList } from 'lucide-react';
import CreateProductListModal from './CreateProductListModal';

export default function MissionsTab() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [items, setItems] = useState<Record<string, MissionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [soldiers, setSoldiers] = useState<Pick<Soldier, 'id' | 'full_name'>[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchMissions = useCallback(async () => {
    try {
      const { data: missionsData, error: mError } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (mError) throw mError;

      setMissions(missionsData || []);

      // Fetch items for each mission
      if (missionsData) {
        const itemResults = await Promise.all(
          missionsData.map(m => 
            supabase.from('mission_items').select('*').eq('mission_id', m.id).order('created_at', { ascending: true })
          )
        );

        const newItems: Record<string, MissionItem[]> = {};
        missionsData.forEach((m, i) => {
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
    const userJson = localStorage.getItem('plugah_user');
    if (userJson) setCurrentUser(JSON.parse(userJson));
    
    fetchMissions();
    fetchSoldiers();
  }, [fetchMissions, fetchSoldiers]);

  const updateItemStatus = async (missionId: string, itemId: string, newStatus: string) => {
    await supabase.from('mission_items').update({ status: newStatus }).eq('id', itemId);
    setItems(prev => ({
      ...prev,
      [missionId]: prev[missionId].map(item => item.id === itemId ? { ...item, status: newStatus } : item)
    }));
  };

  const deleteMission = async (id: string) => {
    if (!confirm('האם למחוק את הרשימה?')) return;
    await supabase.from('missions').delete().eq('id', id);
    setMissions(prev => prev.filter(m => m.id !== id));
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>📋 ניהול משימות ורשימות</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>צור ועקוב אחר משימות פלוגתיות</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={18} /> יצירת משימה חדשה
        </Button>
      </div>

      {missions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>אין משימות פעילות</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>תהיו הראשונים ליצור משימה חדשה עבור הפלוגה.</p>
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
                    <span>מוגבל ל-{mission.visibility_soldier_ids.length} אנשים</span>
                  </div>
                )}

                <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ background: 'none', padding: '0 8px', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>מוצר</th>
                        <th style={{ background: 'none', padding: '0 8px', fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right' }}>סטטוס</th>
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
                              style={{ marginBottom: 0, padding: '4px 8px', fontSize: '0.8rem' }}
                              options={mission.status_options.map(opt => ({ value: opt, label: opt }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProductListModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => { setShowCreateModal(false); fetchMissions(); }}
          soldiers={soldiers}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
