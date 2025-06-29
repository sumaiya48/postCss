import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminSidebar from "../AdminPanel/SharedComponentAdmin/AdminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminPanelLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 👇 Route অনুযায়ী auto-collapse অথবা auto-expand
  useEffect(() => {
    if (location.pathname.startsWith("/pos")) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isCollapsed={isCollapsed} />
      <div className="flex-1 bg-gray-100 p-4">
        <Outlet />
      </div>
    </div>
  );
}
