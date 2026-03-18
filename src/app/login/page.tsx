'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'התחברות נכשלה');
      }

      // Success! Redirect to the soldier's unique portal
      router.push(`/soldier/${data.token}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Heebo', direction: 'rtl' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32, background: 'var(--glass)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-light)', marginBottom: 16 }}>
            <Shield size={40} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)' }}>פלוגה 8170</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>התחברות לאזור האישי</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 20 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)' }}>מספר אישי או שם משתמש</label>
            <input 
              type="text" 
              className="form-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="הזן שם משתמש"
              required 
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
            />
          </div>
          
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" style={{ color: 'var(--text-muted)' }}>סיסמה</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="הזן סיסמה"
              required 
              style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', paddingLeft: 40 }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', left: 12, top: 38, background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading} 
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px 20px', fontSize: '1rem', fontWeight: 600 }}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><LogIn size={18} /> התחבר</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 24 }}>
          במקרה של תקלה נא לפנות לטורקל המלך 👑
        </p>
      </div>
    </div>
  );
}
