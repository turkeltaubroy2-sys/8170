'use client';

import { Card } from '@/components/ui/Card';
import { Database, FileText, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export default function StaffDatabases() {
  const [search, setSearch] = useState('');

  const databases = [
    { id: 1, name: 'אלפון פלוגתי (Excel)', type: 'xlsx', last_updated: '2026-03-22', status: 'synchronized' },
  ];

  const filtered = databases.filter(db => db.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Featured: מידעון אמלח */}
      <Card style={{ padding: 24, borderRight: '4px solid var(--primary)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--text)' }}>מידעון אמל"ח</h3>
        <div style={{ 
          background: 'var(--bg-surface)', 
          borderRadius: 12, 
          padding: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 10, background: '#e74c3c22', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e74c3c' 
            }}>
              <FileText size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem' }}>מידעון אמל"ח צפוני</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>PDF • 1.9 MB • עודכן היום</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => window.open('/data/amlah.pdf', '_blank')}>
            <ExternalLink size={16} /> פתיחת קובץ
          </Button>
        </div>
      </Card>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Database size={20} color="var(--primary)" /> מאגרי מידע נוספים
          </h3>
          <div style={{ position: 'relative', width: 250 }}>
            <Search size={16} style={{ position: 'absolute', right: 10, top: 12, color: 'var(--text-muted)' }} />
            <Input 
              className="form-input" 
              style={{ paddingRight: 34, marginBottom: 0 }} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="חיפוש מאגר..." 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>לא נמצאו מאגרים נוספים.</p>
          ) : filtered.map(db => (
            <Card key={db.id} style={{ padding: 16, cursor: 'pointer', transition: 'transform 0.2s' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 8, background: 'var(--primary-light)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' 
                }}>
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{db.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    סוג: {db.type} • עודכן: {db.last_updated}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div style={{ marginTop: 40, textAlign: 'center', background: 'var(--surface)', padding: 30, borderRadius: 12, border: '2px dashed var(--border)' }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: 12 }}>גרור קובץ לכאן או לחץ להעלאת מאגר מידע חדש</p>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('נא להעלות את הקובץ לצ׳אט כדי שאוכל להטמיע אותו')}>➕ העלאת מאגר חדש</button>
        </div>
      </div>
    </div>
  );
}
