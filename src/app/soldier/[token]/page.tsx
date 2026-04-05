'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase, Soldier, SoldierPortal, Schedule, Message, GuardShift } from '@/lib/supabase';
import { MapPin, Backpack, Shield, Send, Bell, Calendar, Camera, X, Image as ImageIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import SoldierRequests from '@/components/SoldierRequests';
import SoldierDatabases from '@/components/SoldierDatabases';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Database } from 'lucide-react';
import ZodiacWheel from '@/components/ZodiacWheel';



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

const REAR_ROTATION_DATES = ['22.3', '23.3', '24.3', '25.3', '26.3', '27.3', '28.3', '29.3', '30.3', '31.3', '1.4', '2.4', '3.4', '4.4'];
const REAR_ROTATION_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const REAR_ROTATION_DATA = [
  { name: 'ווילי', status: ['יוצא הביתה', 'בבית', 'בבית', 'בבית', 'חוזר', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'יוצא הביתה'] },
  { name: 'לסלו', status: ['בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'יוצא הביתה', 'בבית', 'בבית', 'בבית', 'חוזר', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס'] },
  { name: 'ליבוביץ', status: ['יוצא הביתה', 'בבית', 'בבית', 'חוזר', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'יוצא הביתה'] },
  { name: 'טורקלטאוב', status: ['יוצא הביתה', 'חוזר', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'יוצא הביתה', 'בבית', 'בבית', 'בבית', 'חוזר', 'בבסיס'] },
  { name: 'ברטוב', status: ['בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'יוצא הביתה', 'בבית', 'בבית', 'בבית', 'בבית', 'חוזר', 'בבסיס'] },
  { name: 'נחום ליס', status: ['בבסיס', 'בבסיס', 'בבסיס', 'יוצא הביתה', 'בבית', 'בבית', 'בבית', 'חוזר', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס', 'בבסיס'] }
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
  const [activeTab, setActiveTab] = useState<'status' | 'requests' | 'databases' | 'guard' | 'equipment' | 'messages' | 'zodiac'>('status');
  const [allSoldiers, setAllSoldiers] = useState<{id: string, full_name: string, department_id: string}[]>([]);
  const [guardEvents, setGuardEvents] = useState<GuardEventWithShifts[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [form, setForm] = useState({
    health_declaration: 'תקין',
    personal_notes: '',
    equipment: {} as Record<string, any>,
    media_urls: [] as string[]
  });
  const [isEditingEquip, setIsEditingEquip] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [rotationNote, setRotationNote] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

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
      .select('*, guard_shifts(*, soldiers:soldier_id(full_name), requester:requested_by_id(full_name))')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (eventsData) setGuardEvents(eventsData);

    // Fetch messages targeted to all, this soldier's department, or this specific soldier
    const { data: messagesData } = await supabase.from('messages')
      .select('*')
      .or(`target_department_id.eq.${soldierData.department_id},target_department_id.is.null,target_soldier_id.eq.${soldierData.id}`)
      .order('created_at', { ascending: false });
    if (messagesData) setMessages(messagesData);

    if (eventsData && soldierData) {
      const { data: portalData } = await supabase.from('soldier_portals').select('*').eq('soldier_id', soldierData.id).single();
      setPortal(portalData);
      if (portalData) {
        const equipment = portalData.equipment_notes ? JSON.parse(portalData.equipment_notes) : {};
        setForm({
          health_declaration: portalData.health_declaration || 'תקין',
          personal_notes: portalData.personal_notes || '',
          equipment,
          media_urls: Array.isArray(portalData.media_urls) ? portalData.media_urls : []
        });
        if (portalData.equipment_notes && portalData.equipment_notes !== '{}') {
          setIsEditingEquip(false);
        }
      }
      const sStatus = portalData?.status || 'בבית';
      const filtered = (eventsData as any[]).filter(ev => 
        ev.target_status === 'all' || ev.target_status === sStatus
      );
      setGuardEvents(filtered);
    }

    // Fetch all soldiers for the wheel
    const { data: allS } = await supabase.from('soldiers').select('id, full_name, department_id').order('full_name');
    if (allS) setAllSoldiers(allS);

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
    target_status: string;
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
      media_urls: form.media_urls,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'soldier_id' });

    setIsEditingEquip(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const uploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !soldier) return;

    setSaving(true);
    const newUrls = [...form.media_urls];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${soldier.id}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('media-gallery')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('media-gallery')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setForm(f => ({ ...f, media_urls: newUrls }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error uploading media:', err);
      alert('שגיאה בהעלאת המדיה.');
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = (url: string) => {
    setForm(f => ({ ...f, media_urls: f.media_urls.filter(u => u !== url) }));
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
                  <input type="file" accept="image/*" hidden onChange={handleProfilePhotoUpload} disabled={saving} />
                </label>
              </div>
            ) : (
              <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', border: '4px solid var(--accent)' }}>
                {soldier?.full_name.charAt(0)}
                <label style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent)', color: 'black', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '3px solid var(--bg)', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  <Camera size={16} />
                  <input type="file" accept="image/*" hidden onChange={handleProfilePhotoUpload} disabled={saving} />
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
            className={activeTab === 'databases' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'databases' ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('databases')}
          >
            <Database size={16} /> מאגרי מידע
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
          <button
            className={activeTab === 'zodiac' ? 'active' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Heebo', fontSize: '1rem', color: activeTab === 'zodiac' ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('zodiac')}
          >
             <span>🎡</span> גלגל המזלות
          </button>
        </div>

        {saved && activeTab === 'status' && (
          <div className="alert alert-success">✅ הנתונים נשמרו בהצלחה!</div>
        )}

        {activeTab === 'requests' && soldier && <SoldierRequests soldierId={soldier.id} soldierRole={soldier.role} soldierName={soldier.full_name} />}
        {activeTab === 'databases' && soldier && <SoldierDatabases />}
        {activeTab === 'zodiac' && <ZodiacWheel soldiers={allSoldiers} />}

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
              const isCommitted = shifts.some(s => s.soldier_id === soldier?.id || s.requested_by_id === soldier?.id);
              const isListFull = shifts.every(s => s.soldier_id);

              return (
                <div key={ev.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>📍 {ev.location}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(ev.start_time).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {isListFull && <Badge style={{ background: '#27ae6022', color: '#27ae60' }}>רשימה מלאה</Badge>}
                  </div>

                  {isListFull ? (
                    <div style={{ background: 'rgba(39, 174, 96, 0.05)', borderRadius: 12, padding: 16, border: '1px dashed rgba(39, 174, 96, 0.3)' }}>
                      <p style={{ fontSize: '0.9rem', textAlign: 'center', marginBottom: 12, fontWeight: 700, color: '#27ae60' }}>שיבוץ הסתיים - רשימת שומרים:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {Object.entries(shifts.reduce((acc, s) => {
                          const t = new Date(s.start_time).getTime();
                          acc[t] = acc[t] || [];
                          acc[t].push(s);
                          return acc;
                        }, {} as Record<number, any[]>))
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([timeStr, tShifts]) => {
                          const hasMe = tShifts.some(s => s.soldier_id === soldier?.id);
                          return (
                            <div key={timeStr} style={{ fontSize: '0.85rem', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: hasMe ? '1px solid #27ae60' : '1px solid var(--border)' }}>
                              <span style={{ fontWeight: 800, color: hasMe ? '#27ae60' : 'var(--text-dim)' }}>
                                {new Date(Number(timeStr)).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1, paddingRight: 16 }}>
                                {tShifts.map((s, idx) => (
                                  <span key={s.id} style={{ fontWeight: s.soldier_id === soldier?.id ? 800 : 600, color: s.soldier_id === soldier?.id ? '#27ae60' : 'var(--text)' }}>
                                    {(s as any).soldiers?.full_name || 'שומר'}{idx < tShifts.length - 1 ? ' •' : ''}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Object.entries(shifts.reduce((acc, s) => {
                        const t = new Date(s.start_time).getTime();
                        acc[t] = acc[t] || [];
                        acc[t].push(s);
                        return acc;
                      }, {} as Record<number, any[]>))
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([timeStr, tShifts]) => {
                        const hasMe = tShifts.some(s => s.soldier_id === soldier?.id);
                        const myRequest = tShifts.find(s => s.requested_by_id === soldier?.id && !s.soldier_id);
                        
                        return (
                          <div key={timeStr} style={{
                            padding: '12px 16px', borderRadius: 10,
                            background: hasMe ? 'rgba(39, 174, 96, 0.1)' : myRequest ? 'rgba(243, 156, 18, 0.1)' : 'var(--bg-surface)',
                            border: hasMe ? '1px solid #27ae60' : myRequest ? '1px solid #f39c12' : '1px solid var(--border)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: hasMe ? '#27ae60' : 'var(--text)' }}>
                                {new Date(Number(timeStr)).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} - {new Date(tShifts[0].end_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {hasMe ? (
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#27ae60' }}>🛡️ שובצת</span>
                              ) : myRequest ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f39c12' }}>⏳ בהמתנה</span>
                                  <button 
                                    className="btn btn-secondary btn-sm" 
                                    style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#e74c3c' }}
                                    onClick={async () => {
                                      if (!confirm('האם לבטל את בקשת השיבוץ?')) return;
                                      setSaving(true);
                                      await supabase.from('guard_shifts').update({ requested_by_id: null }).eq('id', myRequest.id);
                                      setGuardEvents(prev => prev.map(e => e.id === ev.id ? {
                                        ...e,
                                        guard_shifts: e.guard_shifts.map((s: GuardShift) => s.id === myRequest.id ? { ...s, requested_by_id: null } : s)
                                      } : e));
                                      setSaving(false);
                                    }}
                                  >בטל</button>
                                </div>
                              ) : null}
                            </div>
                            
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {tShifts.map((shift, idx) => {
                                const isMeShift = shift.soldier_id === soldier?.id;
                                const isTaken = !!shift.soldier_id && !isMeShift;
                                const isRequestedByMe = shift.requested_by_id === soldier?.id && !shift.soldier_id;
                                const isTakenRequest = !!shift.requested_by_id && !isRequestedByMe && !shift.soldier_id;
                                
                                return (
                                  <div key={shift.id} style={{ 
                                    fontSize: '0.8rem', padding: '6px 12px', borderRadius: 8, 
                                    background: isMeShift ? 'rgba(39, 174, 96, 0.2)' : isTaken ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)',
                                    border: isTaken ? '1px solid transparent' : '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', flex: '1 1 auto', justifyContent: 'center'
                                  }}>
                                    {isMeShift ? (
                                      <span style={{ fontWeight: 800, color: '#27ae60' }}>אני ({(shift as any).soldiers?.full_name})</span>
                                    ) : isTaken ? (
                                      <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>
                                        {(shift as any).soldiers?.full_name || 'נתפס'}
                                      </span>
                                    ) : isRequestedByMe ? (
                                      <span style={{ color: '#f39c12', fontWeight: 600 }}>בקשה שלי</span>
                                    ) : (
                                      !hasMe && !myRequest && !isCommitted ? (
                                        <button
                                          className="btn btn-primary btn-sm"
                                          disabled={saving}
                                          style={{ padding: '4px 10px', fontSize: '0.75rem', width: '100%' }}
                                          onClick={async () => {
                                            if (!confirm('האם לבקש להשתבץ למשמרת זו?')) return;
                                            setSaving(true);
                                            await supabase.from('guard_shifts').update({ requested_by_id: soldier?.id }).eq('id', shift.id);

                                            setGuardEvents(prev => prev.map(e => e.id === ev.id ? {
                                              ...e,
                                              guard_shifts: e.guard_shifts.map((s: GuardShift) => s.id === shift.id ? { ...s, requested_by_id: soldier?.id || null } : s)
                                            } : e));
                                            setSaving(false);
                                          }}
                                        >
                                          פנוי - בקש שיבוץ
                                        </button>
                                      ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                          {isTakenRequest ? 'ממתין לאישור סגל' : 'פנוי'}
                                        </span>
                                      )
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
                <Calendar size={18} className="text-muted" /> בקשות יציאה סבב לבנון
              </h3>

              <div style={{ background: 'var(--bg-surface)', padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 8px' }}>
                  <button 
                    onClick={() => {
                      if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
                      else setViewMonth(v => v - 1);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    ◀
                  </button>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    {new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(new Date(viewYear, viewMonth))}
                  </div>
                  <button 
                    onClick={() => {
                      if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
                      else setViewMonth(v => v + 1);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    ▶
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, textAlign: 'center' }}>סמן ימים בלוח להגשת בקשת יציאה:</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', paddingBottom: 4 }}>{d}</div>
                  ))}

                  {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: new Date(viewYear, viewMonth + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
                      disabled={saving || !rotationNote.trim()}
                      onClick={async () => {
                        if (!soldier || !rotationNote.trim()) return;
                        setSaving(true);
                        const sortedDates = [...selectedDates].sort().map(d => new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })).join(', ');

                        await supabase.from('requests').insert({
                          soldier_id: soldier.id,
                          title: 'בקשות יציאה סבב לבנון',
                          type: 'סבבי יציאות',
                          status: 'פתוח',
                          description: `תאריכים: ${sortedDates}\n\nסיבה: ${rotationNote}`
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


            {/* Rear Rotation Table (Only for specific soldiers) */}
            {soldier && REAR_ROTATION_DATA.some(r => soldier.full_name.includes(r.name)) && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} className="text-muted" /> סבב יציאות עורף
                </h3>
                <div style={{ overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', borderBottom: '2px solid var(--border)', background: 'var(--bg-surface)', position: 'sticky', right: 0, zIndex: 10 }}>שם</th>
                        {REAR_ROTATION_DATES.map((d, i) => (
                          <th key={i} style={{ padding: '8px', borderBottom: '2px solid var(--border)', minWidth: 40, background: i >= 7 ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent' }}>
                            <div style={{ opacity: 0.6, fontSize: '0.65rem' }}>{REAR_ROTATION_DAYS[i]}</div>
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {REAR_ROTATION_DATA.map((row, idx) => {
                        const isCurrent = soldier.full_name.includes(row.name);
                        return (
                          <tr key={idx} style={{ 
                            background: isCurrent ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent',
                            fontWeight: isCurrent ? 800 : 400
                          }}>
                            <td style={{ 
                              padding: '10px 8px', borderBottom: '1px solid var(--border)', 
                              position: 'sticky', right: 0, 
                              background: isCurrent ? 'var(--accent)' : 'var(--bg-surface)',
                              color: isCurrent ? 'white' : 'inherit',
                              zIndex: 5,
                              fontWeight: 800
                            }}>
                              {row.name}
                            </td>
                            {row.status.map((st, i) => {
                              let cellBg = 'transparent';
                              let cellColor = 'inherit';
                              if (st === 'בבית' || st === 'יוצא הביתה') {
                                cellBg = 'rgba(46, 204, 113, 0.15)';
                                cellColor = '#27ae60';
                              } else if (st === 'חוזר') {
                                cellBg = 'rgba(241, 196, 15, 0.15)';
                                cellColor = '#f39c12';
                              }
                              
                              return (
                                <td key={i} style={{ 
                                  padding: '10px 4px', borderBottom: '1px solid var(--border)',
                                  background: cellBg, color: cellColor, fontSize: '0.65rem',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {st === 'יוצא הביתה' ? 'בית' : st === 'בבית' ? 'בית' : st === 'חוזר' ? 'חוזר' : st === 'בבסיס' ? 'בסיס' : st}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 12, textAlign: 'center' }}>
                  * הטבלה מציגה את הסבב המתוכנן לשבועיים הקרובים.
                </p>
              </div>
            )}


              {/* Media Uploads */}
              <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ImageIcon size={18} className="text-muted" /> מדיה מהשטח
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {form.media_urls.map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-surface)' }}>
                      {url.match(/\.(mp4|webm|ogg|mov)$/) ? (
                        <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Image src={url} alt="" fill className="object-cover" unoptimized />
                      )}
                      <button 
                        type="button"
                        onClick={() => removeMedia(url)}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(231, 76, 60, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label style={{ 
                    aspectRatio: '1', border: '2px dashed var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 4, color: 'var(--text-dim)', transition: 'all 0.2s' 
                  }}>
                    <Plus size={24} />
                    <span style={{ fontSize: '0.75rem' }}>הוסף</span>
                    <input type="file" accept="image/*,video/*" multiple hidden onChange={uploadMedia} disabled={saving} />
                  </label>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ניתן להעלות תמונות או סרטונים מהשטח (מומלץ לצלם אופקית).
                </p>
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

        {activeTab === 'equipment' && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Backpack size={18} className="text-muted" /> רשימת ציוד ופורמט החתמה
              </h3>
              {!isEditingEquip && (
                <Button variant="secondary" size="sm" onClick={() => setIsEditingEquip(true)}>
                  ✏️ עריכה
                </Button>
              )}
            </div>

            {saved && (
              <div className="alert alert-success" style={{ marginBottom: 16, textAlign: 'center' }}>
                ✅ הציוד נשמר בהצלחה
              </div>
            )}
            
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
                        {item.type === 'select' && <span style={{ fontWeight: 700 }}>({val as string})</span>}
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
        )}

      </div>
    </div>
  );
}
