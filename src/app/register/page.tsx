'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [personalNumber, setPersonalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalNumber || !password || !confirmPassword) {
      setError('נא למלא את כל השדות');
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    // Usually Personal numbers are 7 digits
    if (personalNumber.length < 5) {
      setError('נא להזין מספר אישי תקין');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let photoUrl = null;
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `reg-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photo);

        if (uploadError) throw new Error('שגיאה בהעלאת התמונה: ' + uploadError.message);

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personal_number: personalNumber, password, photo_url: photoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'אירעה שגיאה בהרשמה');
      }

      // Save to localStorage using the same format as login
      if (data.soldier) {
        localStorage.setItem('plugah_user', JSON.stringify({ 
          role: 'soldier', 
          token: data.soldier.unique_token, 
          name: data.soldier.full_name 
        }));
        
        // Redirect to the tokenized portal
        router.push(`/soldier/${data.soldier.unique_token}`);
      } else {
        router.push('/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 className="login-title">הרשמה לפלוגה</h1>
          <p className="login-subtitle">הזן מספר אישי כדי למשוך את פרטיך ולהירשם למערכת</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Camera size={32} />
                </div>
              )}
              <label style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--accent)', color: 'black', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-surface)' }}>
                <Camera size={14} />
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user" 
                  hidden 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPhoto(file);
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }} 
                />
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>הוסף תמונת פרופיל (אופציונלי)</p>
          </div>

          <Input
            label="מספר אישי (מ.א)"
            type="number"
            value={personalNumber}
            onChange={(e) => setPersonalNumber(e.target.value)}
            placeholder="לדוגמה: 8857288"
            required
            disabled={loading}
            autoComplete="username"
            style={{ textAlign: 'left' }}
          />

          <Input
            label="בחר סיסמה"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="בחר סיסמה מאובטחת"
            required
            disabled={loading}
            autoComplete="new-password"
            style={{ textAlign: 'left' }}
          />

          <Input
            label="אימות סיסמה"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="הקלד את הסיסמה שנית"
            required
            disabled={loading}
            autoComplete="new-password"
            style={{ textAlign: 'left' }}
          />

          <Button
            type="submit"
            style={{ width: '100%', marginTop: '12px', fontSize: '1.1rem', padding: '12px' }}
            loading={loading}
          >
            הירשם למערכת
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
            כבר רשום? התחבר כאן
          </Link>
        </div>
      </div>
    </div>
  );
}
