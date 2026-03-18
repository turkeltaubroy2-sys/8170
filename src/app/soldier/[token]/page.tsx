'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Soldier, SoldierPortal } from '@/lib/supabase';
import { MapPin, Stethoscope, Backpack, FileText, CheckCircle, Shield, AlertTriangle, Send } from 'lucide-react';
import SoldierRequests from '@/components/SoldierRequests';
import SoldierForms from '@/components/SoldierForms';

const STATUSES = ['בבית', 'בדרך', 'בפלוגה', 'בחופש', 'מחכה לציוד', 'אחר'];
const HEALTH = ['תקין', 'חלש', 'פצוע', 'בבית חולים', 'פטור רפואי'];

export default function SoldierPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [soldier, setSoldier] = useState<Soldier | null>(null);
  const [portal, setPortal] = useState<SoldierPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'requests' | 'forms'>('status');
  const [form, setForm] = useState({
    status: 'בבית',
    health_declaration: 'תקין',
    equipment_notes: '',
    personal_notes: '',
  });

  useEffect(() => { 
    if (token) fetchPortal(); 
  }, [token]);

  const fetchPortal = async () => {
    const { data: soldierData } = await supabase
      .from('soldiers')
      .select('*, departments(name,icon)')
      .eq('unique_token', token)
      .single();

    if (!soldierData) { setNotFound(true); setLoading(false); return; }
    setSoldier(soldierData);

    const { data: portalData } = await supabase.from('soldier_portals').select('*').eq('soldier_id', soldierData.id).single();

    if (portalData) {
      setPortal(portalData);
      setForm({
        status: portalData.status || 'בבית',
        health_declaration: portalData.health_declaration || 'תקין',
        equipment_notes: portalData.equipment_notes || '',
        personal_notes: portalData.personal_notes || '',
      });
    } else {
      // Create portal entry
      await supabase.from('soldier_portals').insert({ soldier_id: soldierData.id, status: 'בבית', health_declaration: 'תקין' });
    }
    setLoading(false);
  };

  const save = async () => {
    if (!soldier) return;
    setSaving(true);
    await supabase.from('soldier_portals').upsert({
      soldier_id: soldier.id,
      ...form,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'soldier_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner"><div className="spinner" /><span>טוען פורטל...</span></div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Heebo' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '4rem' }}>🔍</p>
        <h2 style={{ color: 'var(--accent)', marginTop: 12 }}>הפורטל לא נמצא</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>הלינק אינו תקין. פנה לסגל.</p>
      </div>
    </div>
  );

  const statusColors: Record<string, string> = {
    'בבית': '#2980b9', 'בדרך': '#f39c12', 'בפלוגה': '#27ae60', 'בחופש': '#8e44ad', 'מחכה לציוד': '#c0392b', 'אחר': '#7f8c8d'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Heebo', direction: 'rtl', padding: '20px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Shield size={18} /> פלוגה 8170</div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {soldier?.photo_url ? (
              <img src={soldier.photo_url} alt={soldier.full_name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent)' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', border: '4px solid var(--accent)' }}>
                {soldier?.full_name.charAt(0)}
              </div>
            )}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)', marginTop: 12 }}>{soldier?.full_name}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{soldier?.rank}{soldier?.role ? ` · ${soldier.role}` : ''}</p>
          {soldier?.departments && (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 4 }}>
              {(soldier.departments as any).icon} {(soldier.departments as any).name}
            </p>
          )}
          
          {soldier?.pakalim && soldier.pakalim.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {soldier.pakalim.map(p => <span key={p} className="badge badge-gray" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>{p}</span>)}
            </div>
          )}
        </div>

        {/* Mian Tab Navigation */}
        <div className="tab-menu" style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', marginBottom: 24, paddingBottom: 10, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', fontWeight: activeTab === 'status' ? 600 : 400, color: activeTab === 'status' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === 'status' ? '3px solid var(--accent)' : '3px solid transparent' }}
            onClick={() => setActiveTab('status')}
          >
            <MapPin size={16} /> מצב נוכחי
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', fontWeight: activeTab === 'requests' ? 600 : 400, color: activeTab === 'requests' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === 'requests' ? '3px solid var(--accent)' : '3px solid transparent' }}
            onClick={() => setActiveTab('requests')}
          >
            <Send size={16} /> פניות
          </button>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', fontWeight: activeTab === 'forms' ? 600 : 400, color: activeTab === 'forms' ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeTab === 'forms' ? '3px solid var(--accent)' : '3px solid transparent' }}
            onClick={() => setActiveTab('forms')}
          >
            <FileText size={16} /> שאלונים
          </button>
        </div>

        {saved && activeTab === 'status' && (
          <div className="alert alert-success">✅ הנתונים נשמרו בהצלחה!</div>
        )}

        {activeTab === 'requests' && soldier && <SoldierRequests soldierId={soldier.id} />}
        {activeTab === 'forms' && soldier && <SoldierForms soldierId={soldier.id} />}
        
        {activeTab === 'status' && (
          <>
            {/* Status */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} className="text-muted" /> סטטוס נוכחי
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))} style={{
                    padding: '8px 16px', borderRadius: 20, border: `2px solid ${form.status === s ? statusColors[s] || 'var(--accent)' : 'var(--border)'}`,
                    background: form.status === s ? `${statusColors[s]}22` : 'transparent',
                    color: form.status === s ? statusColors[s] || 'var(--accent)' : 'var(--text-muted)',
                    fontFamily: 'Heebo', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Health */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Stethoscope size={18} className="text-muted" /> הצהרת בריאות
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {HEALTH.map(h => (
                  <button key={h} onClick={() => setForm(f => ({ ...f, health_declaration: h }))} style={{
                    padding: '8px 16px', borderRadius: 20, border: `2px solid ${form.health_declaration === h ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.health_declaration === h ? 'rgba(200,168,75,0.12)' : 'transparent',
                    color: form.health_declaration === h ? 'var(--accent)' : 'var(--text-muted)',
                    fontFamily: 'Heebo', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s',
                  }}>
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Backpack size={18} className="text-muted" /> ציוד מונפק
              </h3>
              <textarea className="form-textarea" value={form.equipment_notes} onChange={e => setForm(f => ({ ...f, equipment_notes: e.target.value }))}
                placeholder="הערות לתצוגה בסגל..." rows={3} />
            </div>

            {/* Notes */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} className="text-muted" /> הערות אישיות
              </h3>
              <textarea className="form-textarea" value={form.personal_notes} onChange={e => setForm(f => ({ ...f, personal_notes: e.target.value }))}
                placeholder="כל מה שתרצה לציין..." rows={3} />
            </div>

            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
              {saving ? '⏳ שומר...' : '💾 שמור עדכון'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 16 }}>
              הנתונים שלך מוצגים לסגל הפלוגה בלבד.<br />
              במקרה של תקלה נא לפנות לטורקל המלך 👑
            </p>
          </>
        )}
      </div>
    </div>
  );
}
