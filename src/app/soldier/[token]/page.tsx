'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Soldier, SoldierPortal, Schedule, Message, GuardShift } from '@/lib/supabase';
import { MapPin, Stethoscope, Backpack, FileText, Shield, Send, Bell, Calendar, Camera } from 'lucide-react';
import Image from 'next/image';
import SoldierRequests from '@/components/SoldierRequests';
import SoldierForms from '@/components/SoldierForms';
import { Button } from '@/components/ui/Button';

const STATUSES = ['בבית', 'עורף', 'בפנים'];
const HEALTH = ['תקין', 'חלש', 'פצוע', 'בבית חולים', 'פטור רפואי'];

const EQUIPMENT_ITEMS = [
  { id: 'massa_90l', label: 'מנשא 90 ליטר', type: 'boolean' },
  { id: 'shak_hafatzi', label: 'שק חפצים', type: 'boolean' },
  { id: 'mechanes_dagmach', label: "מכנס דגמ''ח", type: 'boolean' },
  { id: 'chultzat_dagmach', label: 'חולצות דגמ"ח', type: 'boolean' },
  { id: 'shak_sheina', label: 'שק שינה', type: 'boolean' },
  { id: 'kova_avoda', label: 'כובע עבודה', type: 'boolean' },
  { id: 'kfafot_nomex', label: 'כפפות נומקס', type: 'boolean' },
  { id: 'hagorat_avoda', label: 'חגורת עבודה', type: 'boolean' },
  { id: 'afod_magen', label: 'אפוד מגן נגד רסיסים', type: 'boolean' },
  { id: 'kasda', label: 'קסדה', type: 'select', options: ['טקטית', 'רגילה', 'לא'] },
  { id: 'vest', label: 'ווסט', type: 'select', options: ['רגיל', 'נגב', 'חובש', 'מטול', 'לא'] },
  { id: 'luach_kerami_kidmi', label: 'לוח קרמי קדמי', type: 'boolean' },
  { id: 'luach_kerami_achori', label: 'לוח קרמי אחורי', type: 'boolean' },
  { id: 'luach_kerami_shachor', label: 'לוח קרמי שחור', type: 'boolean' },
  { id: 'panas_rosh', label: 'פנס ראש מנצנץ', type: 'boolean' },
  { id: 'mechal_mayim_3l', label: 'מיכל מים 3 ליטר', type: 'boolean' },
  { id: 'reshet_hasva_2x3', label: 'רשת הסוואה 2*3 אנט', type: 'boolean' },
  { id: 'mitznefet', label: 'מצנפת לקסדה', type: 'boolean' },
  { id: 'magen_birkayim', label: 'מגני ברכיים', type: 'boolean' },
  { id: 'et_tachferut', label: 'את תחפרות', type: 'boolean' },
  { id: 'mishkafayim', label: 'משקפי שומר אח"י', type: 'boolean' },
  { id: 'chevel_ishi', label: 'חבל אישי עם אנקול', type: 'boolean' },
  { id: 'retzua', label: 'רצועה לנשק', type: 'boolean' },
  { id: 'machsaniyot', label: 'מחסניות', type: 'boolean' },
  { id: 'mashmenet', label: 'משמנת', type: 'boolean' },
  { id: 'mivreshet', label: 'מברשת ניקוי', type: 'boolean' },
  { id: 'choter', label: 'חוטר', type: 'boolean' },
  { id: 'erkat_niqquoy', label: 'ערכת כלי ניקוי', type: 'boolean' },
];

export default function SoldierPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [soldier, setSoldier] = useState<Soldier | null>(null);
  const [portal, setPortal] = useState<SoldierPortal | null>(null);
  const [missions, setMissions] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'requests' | 'forms' | 'guard' | 'messages' | 'equipment'>('status');
  const [guardEvents, setGuardEvents] = useState<GuardEventWithShifts[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [form, setForm] = useState({
    health_declaration: 'תקין',
    personal_notes: '',
    equipment: {} as Record<string, any>
  });
  const [isEditingEquip, setIsEditingEquip] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [rotationNote, setRotationNote] = useState('');

  const fetchPortal = useCallback(async () => {
    const { data: soldierData } = await supabase
      .from('soldiers')
      .select('*, departments(name,icon)')
      .eq('unique_token', token)
      .single();

    if (!soldierData) { setNotFound(true); setLoading(false); return; }
    setSoldier(soldierData);

    const { data: missionsData } = await supabase.from('schedules')
      .select('*')
      .eq('commander_id', soldierData.id)
      .neq('status', 'completed')
      .order('start_time', { ascending: true });

    if (missionsData) {
      setMissions(missionsData);
    }

    const { data: eventsData } = await supabase.from('guard_events')
      .select('*, guard_shifts(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (eventsData) setGuardEvents(eventsData);

    // Fetch messages targeted to all or this soldier's department
    const { data: messagesData } = await supabase.from('messages')
      .select('*')
      .or(`target_department_id.eq.${soldierData.department_id},target_department_id.is.null`)
      .order('created_at', { ascending: false });
    if (messagesData) setMessages(messagesData);

    const { data: portalData } = await supabase.from('soldier_portals').select('*').eq('soldier_id', soldierData.id).single();

    if (portalData) {
      setPortal(portalData);
      
      let parsedEquip = {};
      if (portalData.equipment_notes) {
        try {
          // If it starts with {, it's likely our JSON
          if (portalData.equipment_notes.startsWith('{')) {
            parsedEquip = JSON.parse(portalData.equipment_notes);
          }
        } catch (e) {}
      }

      setForm({
        health_declaration: portalData.health_declaration || 'תקין',
        personal_notes: portalData.personal_notes || '',
        equipment: parsedEquip
      });
      if (Object.keys(parsedEquip).length > 0) {
        setIsEditingEquip(false);
      } else {
        setIsEditingEquip(true);
      }
    } else {
      // Create portal entry
      await supabase.from('soldier_portals').insert({ soldier_id: soldierData.id, status: 'בבית', health_declaration: 'תקין' });
      setIsEditingEquip(true);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    const load = async () => {
      if (token) await fetchPortal();
    };
    load();
  }, [token, fetchPortal]);

  interface GuardEventWithShifts {
    id: string;
    location: string;
    start_time: string;
    guard_shifts: GuardShift[];
  }

  const save = async () => {
    if (!soldier) return;
    setSaving(true);
    await supabase.from('soldier_portals').upsert({
      soldier_id: soldier.id,
      health_declaration: form.health_declaration,
      personal_notes: form.personal_notes,
      equipment_notes: JSON.stringify(form.equipment),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'soldier_id' });

    setIsEditingEquip(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({
        ...prev,
        equipment: {
          ...prev.equipment,
          [name]: checked
        }
      }));
    } else if (name.startsWith('equipment_')) {
      const equipId = name.substring('equipment_'.length);
      setForm(prev => ({
        ...prev,
        equipment: {
          ...prev.equipment,
          [equipId]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !soldier) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${soldier.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('soldiers')
        .update({ photo_url: publicUrl })
        .eq('id', soldier.id);

      if (updateError) throw updateError;

      setSoldier({ ...soldier, photo_url: publicUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('שגיאה בהעלאת התמונה. וודא שקיים bucket בשם avatars ב-Supabase.');
    } finally {
      setSaving(false);
    }
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
    'בבית': '#27ae60', 'עורף': '#2980b9', 'בפנים': '#c0392b'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Heebo', direction: 'rtl', padding: '20px 16px', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 28 }}>
          <button
            onClick={() => { localStorage.removeItem('plugah_user'); window.location.href = '/login'; }}
            style={{ position: 'absolute', left: 0, top: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, zIndex: 10 }}
          >
            <span style={{ fontSize: '1.2rem' }}>🚪</span>
            <span style={{ fontSize: '0.8rem' }}>התנתק</span>
          </button>

          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Shield size={18} /> פלוגה 8170</div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {soldier?.photo_url ? (
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                <Image
                  src={soldier.photo_url}
                  alt={soldier.full_name}
                  fill
                  className="object-cover"
                  style={{ borderRadius: '50%', border: '4px solid var(--accent)' }}
                  unoptimized
                />
                <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', color: 'black', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid var(--bg)', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  <Camera size={16} />
                  <input type="file" accept="image/*" capture="user" hidden onChange={handlePhotoUpload} disabled={saving} />
                </label>
              </div>
            ) : (
              <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', border: '4px solid var(--accent)' }}>
                {soldier?.full_name.charAt(0)}
                <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', color: 'black', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid var(--bg)', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  <Camera size={16} />
                  <input type="file" accept="image/*" capture="user" hidden onChange={handlePhotoUpload} disabled={saving} />
                </label>
              </div>
            )}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)', marginTop: 12 }}>{soldier?.full_name}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{soldier?.rank}{soldier?.role ? ` · ${soldier.role}` : ''}</p>
          {soldier?.departments && (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 4 }}>
              {soldier.departments.name}
            </p>
          )}

          {soldier?.pakalim && soldier.pakalim.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {soldier.pakalim.map(p => <span key={p} className="badge badge-gray" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>{p}</span>)}
            </div>
          )}
        </div>

        {/* Main Tab Navigation */}
        <div className="tab-menu">
          <button
            className={activeTab === 'status' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'status' ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('status')}
          >
            <MapPin size={16} /> מצב נוכחי
          </button>
          <button
            className={activeTab === 'requests' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'requests' ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('requests')}
          >
            <Send size={16} /> פניות
          </button>
          <button
            className={activeTab === 'forms' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'forms' ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('forms')}
          >
            <FileText size={16} /> שאלונים
          </button>
          <button
            className={activeTab === 'guard' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'guard' ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('guard')}
          >
            <Shield size={16} /> שמירות
          </button>
          <button
            className={activeTab === 'equipment' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'equipment' ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('equipment')}
          >
            <Backpack size={16} /> ציוד
          </button>
          <button
            className={activeTab === 'messages' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'messages' ? 'var(--accent)' : 'var(--text-muted)', position: 'relative' }}
            onClick={() => setActiveTab('messages')}
          >
            <Bell size={16} /> מודעות
            {messages.length > 0 && (
              <span style={{ position: 'absolute', top: -3, right: -10, background: 'var(--danger)', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {saved && activeTab === 'status' && (
          <div className="alert alert-success">✅ הנתונים נשמרו בהצלחה!</div>
        )}

        {activeTab === 'requests' && soldier && <SoldierRequests soldierId={soldier.id} />}
        {activeTab === 'forms' && soldier && <SoldierForms soldierId={soldier.id} />}

        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <Bell size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>אין הודעות חדשות בלוח המודעות.</p>
              </div>
            ) : messages.map(msg => (
              <div key={msg.id} className="card" style={{ padding: 20, borderLeft: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{msg.title}</h3>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 8, marginTop: 4 }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</p>
                </div>

                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 12, textAlign: 'left' }}>
                  {new Date(msg.created_at).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {guardEvents.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <Shield size={40} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>אין רשימות שמירה פתוחות כרגע.</p>
              </div>
            ) : guardEvents.map(ev => {
              const shifts = [...(ev.guard_shifts || [])].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

              return (
                <div key={ev.id} className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>📍 {ev.location}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    מ- {new Date(ev.start_time).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(ev.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {shifts.map(shift => {
                      const isMe = shift.soldier_id === soldier?.id;
                      const isTaken = !!shift.soldier_id && !isMe;
                      const isOpen = !shift.soldier_id;

                      return (
                        <div key={shift.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px', borderRadius: 8,
                          background: isMe ? 'rgba(39, 174, 96, 0.1)' : isOpen ? 'var(--bg-surface)' : 'rgba(0,0,0,0.2)',
                          border: isMe ? '1px solid #27ae60' : '1px solid transparent'
                        }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isTaken ? 'var(--text-muted)' : 'var(--text)' }}>
                            {new Date(shift.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {isMe ? (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#27ae60' }}>🛡️ המשמרת שלך</span>
                          ) : isTaken ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>נתפס</span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={saving}
                              onClick={async () => {
                                if (!confirm('האם אתה בטוח שברצונך להשתבץ למשמרת זו? לא ניתן לבטל אחרי השיבוץ.')) return;
                                setSaving(true);
                                await supabase.from('guard_shifts').update({ soldier_id: soldier?.id }).eq('id', shift.id);

                                setGuardEvents(prev => prev.map(e => e.id === ev.id ? {
                                  ...e,
                                  guard_shifts: e.guard_shifts.map((s: GuardShift) => s.id === shift.id ? { ...s, soldier_id: soldier?.id || null } : s)
                                } : e));
                                setSaving(false);
                              }}
                            >
                              שבץ אותי
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'status' && (
          <>
            {/* Missions */}
            {missions.length > 0 && (
              <div className="card" style={{ marginBottom: 16, border: '2px solid var(--accent)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} /> משימות בפיקודך
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {missions.map(m => (
                    <div key={m.id} style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8 }}>
                      <h4 style={{ fontWeight: 700 }}>{m.title}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                        🕐 {new Date(m.start_time).toLocaleDateString('he-IL', { month: 'short', day: 'numeric' })}
                        {m.end_time ? ` עד ${new Date(m.end_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        {m.location ? ` | 📍 ${m.location}` : ''}
                      </div>
                      {m.description && <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>{m.description}</p>}
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                        disabled={saving}
                        onClick={async () => {
                          if (!confirm('האם אתה בטוח שהמשימה הושלמה?')) return;
                          setSaving(true);
                          await supabase.from('schedules').update({ status: 'completed' }).eq('id', m.id);
                          setMissions(prev => prev.filter(miss => miss.id !== m.id));
                          setSaving(false);
                        }}
                      >
                        ✅ סמן כהושלם
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} className="text-muted" /> סטטוס נוכחי (נקבע ע&quot;י סגל)
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  padding: '10px 24px', 
                  borderRadius: 30, 
                  background: `${statusColors[portal?.status || 'עורף'] || 'var(--bg-surface)'}22`,
                  color: statusColors[portal?.status || 'עורף'] || 'var(--text-muted)',
                  border: `2px solid ${statusColors[portal?.status || 'עורף'] || 'var(--border)'}`,
                  fontWeight: 800,
                  fontSize: '1.2rem'
                }}>
                  {portal?.status || 'עורף'}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', flex: 1 }}>
                  הסטטוס שלך נקבע על ידי הסגל בלבד ומסווג את מיקומך הנוכחי.
                </p>
              </div>
            </div>

            {/* Lebanon Rotation Request Calendar */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} className="text-muted" /> בקשות מיוחדות - סבב כניסות ויציאות לבנון
              </h3>

              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>סמן ימים בלוח להגשת בקשת יציאה מיוחדת:</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', paddingBottom: 4 }}>{d}</div>
                  ))}

                  {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = new Date(new Date().getFullYear(), new Date().getMonth(), day).toISOString().split('T')[0];
                    const isSelected = selectedDates.includes(dateStr);
                    const rotation = missions.find(m => m.title === 'סבב לבנון' && m.start_time.startsWith(dateStr));
                    const isStaffColored = !!rotation;
                    const color = rotation?.color;

                    return (
                      <button
                        key={day}
                        disabled={saving}
                        onClick={() => {
                          setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
                        }}
                        style={{
                          aspectRatio: '1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 8,
                          border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(200, 168, 75, 0.25)' : isStaffColored ? `${color}44` : 'rgba(255,255,255,0.03)',
                          color: isSelected ? 'var(--accent)' : 'var(--text)',
                          fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: isSelected ? '0 0 10px rgba(200, 168, 75, 0.3)' : 'none',
                          position: 'relative'
                        }}
                      >
                        {day}
                        {isStaffColored && !isSelected && (
                          <div style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: '50%', background: color }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedDates.length > 0 && (
                  <div style={{ marginTop: 20, padding: 16, background: 'rgba(200, 168, 75, 0.05)', borderRadius: 12, border: '1px solid rgba(200, 168, 75, 0.2)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>פרטי הבקשה ({selectedDates.length} ימים נבחרו)</h4>
                    <textarea
                      className="form-textarea"
                      placeholder="הסבר קצר על בקשת היציאה..."
                      value={rotationNote}
                      onChange={e => setRotationNote(e.target.value)}
                      rows={2}
                      style={{ background: 'var(--bg)', marginBottom: 12 }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={saving}
                      onClick={async () => {
                        if (!soldier) return;
                        setSaving(true);
                        const sortedDates = [...selectedDates].sort().map(d => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })).join(', ');

                        await supabase.from('requests').insert({
                          soldier_id: soldier.id,
                          title: 'בקשת יציאה - סבב לבנון',
                          type: 'rotation',
                          status: 'pending',
                          description: `תאריכים: ${sortedDates}\n\nהערות: ${rotationNote}`
                        });

                        setSaving(false);
                        setSelectedDates([]);
                        setRotationNote('');
                        setSaved(true);
                        setTimeout(() => setSaved(false), 3000);
                        setActiveTab('requests'); // Switch to requests tab to show it
                      }}
                    >
                      {saving ? '⏳ שולח...' : '🛡️ הגש בקשת סבב'}
                    </button>
                  </div>
                )}
              </div>
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
          </>
        )}

        {activeTab === 'equipment' && (
          <>
            {/* Equipment */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Backpack size={18} className="text-muted" /> רשימת ציוד ופורמט החתמה
                </h3>
                {!isEditingEquip && (
                  <Button variant="secondary" size="sm" onClick={() => setIsEditingEquip(true)}>
                    ✏️ ערוך רשימה
                  </Button>
                )}
              </div>
              
              {isEditingEquip ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px 20px', background: 'var(--bg-surface)', padding: 16, borderRadius: 12 }}>
                    {EQUIPMENT_ITEMS.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.label}</span>
                        {item.type === 'boolean' ? (
                          <input 
                            type="checkbox" 
                            checked={!!form.equipment[item.id]} 
                            onChange={e => setForm(f => ({ ...f, equipment: { ...f.equipment, [item.id]: e.target.checked } }))}
                            style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                          />
                        ) : (
                          <select 
                             value={form.equipment[item.id] || 'לא'} 
                             onChange={e => setForm(f => ({ ...f, equipment: { ...f.equipment, [item.id]: e.target.value } }))}
                             style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 4px', fontSize: '0.75rem', color: 'var(--text)' }}
                          >
                            {item.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <button className="btn btn-primary" onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
                      {saving ? '⏳ שומר...' : '💾 שמור רשימת ציוד'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {EQUIPMENT_ITEMS.map(item => {
                      const val = form.equipment[item.id];
                      const has = item.type === 'boolean' ? !!val : (val && val !== 'לא');
                      if (!has) return null;
                      return (
                        <div key={item.id} style={{ fontSize: '0.8rem', display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ color: 'var(--primary)' }}>V</span>
                          <span style={{ color: 'var(--text-dim)' }}>{item.label}</span>
                          {item.type === 'select' && <span style={{ fontWeight: 700 }}>({val})</span>}
                        </div>
                      );
                    })}
                  </div>
                  {EQUIPMENT_ITEMS.every(i => {
                    const v = form.equipment[i.id];
                    return i.type === 'boolean' ? !v : (!v || v === 'לא');
                  }) && (
                    <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>טרם הוזן ציוד</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
              <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 16 }}>
                הנתונים שלך מוצגים לסגל הפלוגה בלבד.<br />
                במקרה של תקלה נא לפנות לטורקל המלך 👑
              </p>
          </div>
      </div>
      );
}
