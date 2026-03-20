'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(() => {
    // Skip protection for login page and soldier public links
    if (pathname === '/login' || pathname.startsWith('/soldier')) {
      setAuthorized(true);
      return;
    }

    const userStr = localStorage.getItem('plugah_user');
    
    // Unauthenticated attempts to access restricted (admin) space -> redirect to login
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // If a soldier tries to access admin pages, bounce them back to their portal
      if (user.role !== 'admin') {
        router.push(`/soldier/${user.token}`);
        return;
      }
      
      setAuthorized(true);
    } catch {
      router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    const load = () => {
      checkAuth();
    };
    load();
  }, [checkAuth]);

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  return <>{children}</>;
}
