'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { supabase, MediaItem } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [uploaderName, setUploaderName] = useState('');
  const [title, setTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async () => {
    const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchMedia();
    };
    load();
  }, [fetchMedia]);

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const arr = Array.from(files);
    for (const file of arr) {
      const ext = file.name.split('.').pop();
      const path = `${uuidv4()}.${ext}`;
      const isVideo = file.type.startsWith('video/');
      const { error } = await supabase.storage.from('media-gallery').upload(path, file);
      if (error) { console.error(error); continue; }
      const { data: urlData } = supabase.storage.from('media-gallery').getPublicUrl(path);
      await supabase.from('media').insert({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        file_url: urlData.publicUrl,
        file_type: isVideo ? 'video' : 'image',
        uploader_name: uploaderName || 'אנונימי',
      });
      setTitle('');
    }
    setUploading(false);
    fetchMedia();
  };

  const remove = async (item: MediaItem) => {
    if (!confirm('למחוק קובץ זה?')) return;
    const path = item.file_url.split('/').pop();
    if (path) await supabase.storage.from('media-gallery').remove([path]);
    await supabase.from('media').delete().eq('id', item.id);
    fetchMedia();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
  };

  const formatDate = (dt: string) => new Date(dt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h2>📸 גלריה ומדיה</h2>
          <span className="header-badge">{items.length} קבצים</span>
        </div>
        <div className="page-body">
          {/* Upload Zone */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>העלאת קבצים</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <input className="form-input" value={uploaderName} onChange={e => setUploaderName(e.target.value)} placeholder="שמך (אופציונלי)" style={{ flex: 1 }} />
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="כותרת (אופציונלי)" style={{ flex: 2 }} />
            </div>
            <div
              className={`upload-zone ${dragOver ? 'dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <><div className="spinner" style={{ margin: '0 auto 12px' }} /><p>מעלה...</p></>
              ) : (
                <>
                  <p style={{ fontSize: '2rem', marginBottom: 8 }}>📤</p>
                  <p><strong>גרור ושחרר</strong> תמונות וסרטונים כאן</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--text-dim)' }}>או לחץ לבחירה מהמחשב</p>
                  <p style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--text-dim)' }}>JPG, PNG, MP4, MOV</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) uploadFiles(e.target.files); }} />
            </div>
          </div>

          {/* Gallery */}
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : items.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <p style={{ fontSize: '3rem' }}>📷</p>
              <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>עדיין לא הועלו קבצים. התחל להעלות!</p>
            </div>
          ) : (
            <div className="media-grid">
              {items.map(item => (
                <div key={item.id} className="media-card">
                  {item.file_type === 'video' ? (
                    <video src={item.file_url} controls style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  ) : (
                   <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                      <Image 
                        src={item.file_url} 
                        alt={item.title || ''} 
                        fill
                        className="object-cover"
                        onClick={() => setLightbox(item.file_url)} 
                        style={{ cursor: 'pointer' }}
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="media-card-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        {item.title && <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{item.title}</p>}
                        <p>{item.uploader_name} · {formatDate(item.created_at)}</p>
                      </div>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => remove(item)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div className="modal-overlay" onClick={() => setLightbox(null)} style={{ padding: 20 }}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <Image 
                src={lightbox} 
                alt="" 
                width={1200}
                height={800}
                style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12 }} 
                unoptimized
              />
              <button className="btn btn-secondary" onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -16, left: -16 }}>✕</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
