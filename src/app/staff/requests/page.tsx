'use client';

import Sidebar from '@/components/Sidebar';
import StaffRequests from '@/components/StaffRequests';
import { PageHeader } from '@/components/ui/PageHeader';

export default function RequestsPage() {
  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <PageHeader 
          title="💬 פניות חיילים" 
          subtitle="ניהול ומעקב אחר פניות ובקשות מהשטח" 
          badge="סגל פלוגה"
        />

        <div className="page-body">
          <StaffRequests />
        </div>
      </main>
    </div>
  );
}
