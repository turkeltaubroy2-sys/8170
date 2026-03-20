'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [personalNumber, setPersonalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personal_number: personalNumber, password }),
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
