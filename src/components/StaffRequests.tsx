'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SoldierRequest } from '@/lib/supabase';

export default function StaffRequests() {
  const [requests, setRequests] = useState<SoldierRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*, soldiers(full_name, departments(name, icon))')
      .order('created_at', { ascending: false });
    
    setRequests(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchRequests();
    };
    load();
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('requests').update({ status }).eq('id', id);
    fetchRequests();
  };

  const formatTime = (dt: string) => new Date(dt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ marginBottom: 16 }}>פניות לוחמים</h3>
      {requests.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>אין פניות פתוחות כרגע.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>תאריך</th>
                <th>חייל</th>
                <th>סוג פניה</th>
                <th>תיאור</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{formatTime(r.created_at)}</td>
                  <td>
                    <strong>{r.soldiers?.full_name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.soldiers?.departments?.icon} {r.soldiers?.departments?.name}
                    </div>
                  </td>
                  <td><span className="badge badge-gray">{r.type}</span></td>
                  <td style={{ maxWidth: 300 }}>
                    <strong>{r.title}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{r.description}</p>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600,
                      background: r.status === 'פתוח' ? '#e74c3c22' : r.status === 'בטיפול' ? '#f39c1222' : '#27ae6022',
                      color: r.status === 'פתוח' ? '#e74c3c' : r.status === 'בטיפול' ? '#f39c12' : '#27ae60'
                    }}>{r.status}</span>
                  </td>
                  <td>
                    <select 
                      className="form-select" 
                      style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                    >
                      <option value="פתוח">פתוח</option>
                      <option value="בטיפול">בטיפול</option>
                      <option value="סגור">סגור</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
