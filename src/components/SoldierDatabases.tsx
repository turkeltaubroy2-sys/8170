'use client';

import { Card } from '@/components/ui/Card';
import { Database, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SoldierDatabases() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Featured: מידעון אמלח */}
      <Card style={{ padding: 24, borderRight: '4px solid var(--accent)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: 'var(--accent)' }}>מידעון אמל"ח</h3>
        <div style={{ 
          background: 'var(--bg-surface)', 
          borderRadius: 12, 
          padding: 20, 
          display: 'flex', 
          flexDirection: 'column',
          gap: 16,
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 10, background: 'rgba(231, 76, 60, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e74c3c' 
            }}>
              <FileText size={24} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>מידעון אמל"ח צפוני</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>PDF • 1.9 MB • עודכן היום</p>
            </div>
          </div>
          <Button variant="primary" style={{ width: '100%' }} onClick={() => window.open('/data/amlah.pdf', '_blank')}>
            <ExternalLink size={16} /> פתח קובץ
          </Button>
        </div>
      </Card>

      <Card style={{ padding: 24 }}>
         <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={18} /> מאגרי מידע וספרות מקצועית
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          כאן תוכלו למצוא מידע מקצועי, חוברות הדרכה ומאגרי מידע של הפלוגה.
        </p>
        <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 8, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          אין מאגרים נוספים זמינים כרגע.
        </div>
      </Card>
      
      <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
        יש לכם חומר מקצועי לשתף? פנו לסגל להעלאה למערכת.
      </p>
    </div>
  );
}
