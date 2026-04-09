'use client';

import Sidebar from '@/components/Sidebar';
import MissionsTab from '@/components/MissionsTab';

export default function ListsPage() {
  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <MissionsTab />
      </main>
    </div>
  );
}
