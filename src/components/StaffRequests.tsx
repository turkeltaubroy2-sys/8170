'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { SoldierRequest } from '@/lib/supabase';
import { Search, Filter, Calendar, Users, CheckCircle, Clock, AlertCircle, Trash2, Shield, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function StaffRequests() {
  const [requests, setRequests] = useState<SoldierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('requests')
      .select('*, soldiers(full_name, phone, departments(name, icon))')
      .order('created_at', { ascending: false });
    
    // Normalize status 'pending' to 'פתוח' and 'rotation' to 'סבבי יציאות'
    const normalized = (data || []).map(r => ({
      ...r,
      status: r.status?.toLowerCase() === 'pending' ? 'פתוח' : (r.status || 'פתוח'),
      type: (r.type?.toLowerCase() === 'rotation' || r.type === 'ROTATIN') ? 'סבבי יציאות' : (r.type || 'כללי')
    }));
    
    setRequests(normalized);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('requests').update({ status }).eq('id', id);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק פנייה זו? פעולה זו אינה ניתנת לביטול.')) return;
    
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== id));
    } else {
      alert('שגיאה במחיקת הפנייה: ' + error.message);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests
      .filter(r => {
        const matchType = !filterType || r.type === filterType;
        const matchStatus = !filterStatus || r.status === filterStatus;
        const matchSearch = !search || 
          r.soldiers?.full_name.toLowerCase().includes(search.toLowerCase()) || 
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase());
        return matchType && matchStatus && matchSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [requests, filterType, filterStatus, search, sortOrder]);

  const stats = useMemo(() => {
    const total = filteredRequests.length;
    const open = filteredRequests.filter(r => r.status === 'פתוח').length;
    const inProgress = filteredRequests.filter(r => r.status === 'בטיפול').length;
    const uniqueSoldiers = new Set(filteredRequests.map(r => r.soldier_id)).size;
    
    return { total, open, inProgress, uniqueSoldiers };
  }, [filteredRequests]);

  const types = Array.from(new Set(requests.map(r => r.type))).filter(Boolean);

  const formatTime = (dt: string) => new Date(dt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, borderRight: '4px solid var(--accent)' }}>
          <div style={{ color: 'var(--accent)' }}><Clock size={24} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.open}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>פניות פתוחות</div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, borderRight: '4px solid #f39c12' }}>
          <div style={{ color: '#f39c12' }}><AlertCircle size={24} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.inProgress}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>בטיפול</div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, borderRight: '4px solid var(--text-dim)' }}>
          <div style={{ color: 'var(--text-dim)' }}><Users size={24} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.uniqueSoldiers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>חיילים פונים</div>
          </div>
        </Card>
        <Card style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, borderRight: '4px solid var(--success)' }}>
          <div style={{ color: 'var(--success)' }}><CheckCircle size={24} /></div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>סה"כ בסינון</div>
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={16} style={{ position: 'absolute', right: 10, top: 12, color: 'var(--text-muted)' }} />
            <Input 
              style={{ paddingRight: 34, marginBottom: 0 }} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="חיפוש לפי שם או תוכן..." 
            />
          </div>
          <Select 
            style={{ width: 'auto', minWidth: 150, marginBottom: 0 }} 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            options={[
              { value: '', label: 'כל סוגי הפניות' },
              ...types.map(t => ({ value: t, label: t }))
            ]}
          />
          <Select 
            style={{ width: 'auto', minWidth: 150, marginBottom: 0 }} 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'כל הסטטוסים' },
              { value: 'פתוח', label: 'פתוח' },
              { value: 'בטיפול', label: 'בטיפול' },
              { value: 'סגור', label: 'סגור' }
            ]}
          />
          <Button variant="secondary" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} style={{ display: 'flex', gap: 6 }}>
            {sortOrder === 'desc' ? '⬇️ חדש ביותר' : '⬆️ ישן ביותר'}
          </Button>
          <Button variant="secondary" onClick={() => { setFilterType(''); setFilterStatus(''); setSearch(''); setSortOrder('desc'); }}>
            ניקוי
          </Button>
        </div>
      </Card>

      {/* Requests List */}
      <div className="requests-container">
        {filteredRequests.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
            <Filter size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>לא נמצאו פניות העונות לסינון הנוכחי.</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only" style={{ display: 'none' }}>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>תאריך</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>חייל</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>סוג ונושא</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>סטטוס</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>{formatTime(r.created_at)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700 }}>{r.soldiers?.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.soldiers?.departments?.icon} {r.soldiers?.departments?.name}</div>
                        </td>
                        <td style={{ padding: '12px 16px', maxWidth: 300 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Badge variant="gray" style={{ fontSize: '0.65rem' }}>{r.type}</Badge>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Badge style={{ 
                            background: r.status === 'פתוח' ? '#e74c3c22' : r.status === 'בטיפול' ? '#f39c1222' : '#27ae6022',
                            color: r.status === 'פתוח' ? '#e74c3c' : r.status === 'בטיפול' ? '#f39c12' : '#27ae60'
                          }}>{r.status}</Badge>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Select 
                              style={{ width: 100, marginBottom: 0, fontSize: '0.8rem' }}
                              value={r.status}
                              onChange={(e) => updateStatus(r.id, e.target.value)}
                              options={[
                                { value: 'פתוח', label: 'פתוח' },
                                { value: 'בטיפול', label: 'בטיפול' },
                                { value: 'סגור', label: 'סגור' }
                              ]}
                            />
                            <Button variant="danger" size="sm" onClick={() => deleteRequest(r.id)} title="מחיקת פנייה">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile/Card List View */}
            <div className="request-card-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredRequests.map(r => (
                <Card key={r.id} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{r.soldiers?.full_name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.soldiers?.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.soldiers?.departments?.icon} {r.soldiers?.departments?.name} • {formatTime(r.created_at)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Badge style={{ 
                        background: r.status === 'פתוח' ? '#e74c3c22' : r.status === 'בטיפול' ? '#f39c1222' : '#27ae6022',
                        color: r.status === 'פתוח' ? '#e74c3c' : r.status === 'בטיפול' ? '#f39c12' : '#27ae60'
                      }}>{r.status}</Badge>
                      <Button variant="danger" size="sm" style={{ padding: 6, minWidth: 'auto' }} onClick={() => deleteRequest(r.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Badge variant="gray" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>{r.type}</Badge>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.title}</span>
                    </div>
                    <p style={{ 
                      fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer',
                      display: expandedId === r.id ? 'block' : '-webkit-box',
                      WebkitLineClamp: expandedId === r.id ? 'unset' : 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }} onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                      {r.description}
                    </p>
                    {r.description.length > 100 && (
                      <button 
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', cursor: 'pointer', marginTop: 4, padding: 0 }}
                      >
                        {expandedId === r.id ? 'הצג פחות' : 'קרא עוד...'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Select 
                      style={{ flex: 1, marginBottom: 0, fontSize: '0.85rem' }}
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      options={[
                        { value: 'פתוח', label: 'שנה סטטוס: פתוח' },
                        { value: 'בטיפול', label: 'שנה סטטוס: בטיפול' },
                        { value: 'סגור', label: 'שנה סטטוס: סגור' }
                      ]}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-only { display: block !important; }
          .request-card-list { display: none !important; }
        }
      `}</style>
    </div>
  );
}
