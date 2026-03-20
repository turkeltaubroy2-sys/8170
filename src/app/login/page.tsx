'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('plugah_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') router.push('/');
        else if (user.role === 'soldier' && user.token) router.push(`/soldier/${user.token}`);
      } catch {
        // Ignored
      }
    }
  }, [router]);

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

      // Save to localStorage
      localStorage.setItem('plugah_user', JSON.stringify({ 
        role: data.role, 
        token: data.token, 
        name: data.name 
      }));

      // Redirect based on role
      if (data.role === 'admin') {
        router.push('/');
      } else {
        router.push(`/soldier/${data.token}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('שגיאה לא ידועה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        
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
          <Input 
            label="מספר אישי (מ.א) / שם משתמש"
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="הזן מספר אישי"
            required 
            style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
          />
          
          <div style={{ position: 'relative' }}>
            <Input 
              label="סיסמה"
              type={showPassword ? 'text' : 'password'} 
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

          <Button 
            type="submit" 
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px 20px', fontSize: '1rem', fontWeight: 600 }}
            loading={loading}
          >
            <LogIn size={18} /> התחבר
          </Button>
        </form>

        <div style={{ marginTop: 24 }}>
          <Link
            href="/register"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '14px',
              borderRadius: 8,
              background: 'rgba(200,168,75,0.1)',
              border: '2px solid var(--accent)',
              color: 'var(--accent)',
              fontWeight: 700,
              fontSize: '1.1rem',
              textDecoration: 'none',
              cursor: 'pointer',
              zIndex: 10,
              position: 'relative'
            }}
          >
            📋 חייל חדש בפלוגה? לחץ כאן להרשמה
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: 14 }}>
            במקרה של תקלה נא לפנות לטורקל המלך
          </p>
        </div>
      </div>
    </div>
  );
}
