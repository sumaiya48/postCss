import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../AdminPanel/SharedComponentAdmin/AdminSidebar';

export default function AdminPanelLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar on the left */}
      <AdminSidebar />

      {/* Main content on the right */}
      <div className="flex-1 bg-gray-100 p-4">
        <Outlet />
      </div>
    </div>
  );
}
