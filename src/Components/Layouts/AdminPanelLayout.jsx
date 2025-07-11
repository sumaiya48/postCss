import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../AdminPanel/SharedComponentAdmin/AdminSidebar"; // Your sidebar component

export default function AdminPanelLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // This useEffect hook will automatically collapse the sidebar
  // if the current route path starts with "/pos", and expand it otherwise.
  useEffect(() => {
    if (location.pathname.startsWith("/pos")) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [location.pathname]); // Dependency array ensures this runs when the route changes

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Admin Sidebar */}
      {/* The isCollapsed state is passed down to AdminSidebar. */}
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      {/* The margin-left (ml-20 or ml-64) is dynamically applied here
          to accommodate the sidebar's width change.
          The padding on the main content area is adjusted to reduce the gap. */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "ml-0" : "ml-0"
        }`}
      >
        {/* Admin Navbar (if you have one) */}
        {/* <AdminNavbar isCollapsed={isCollapsed} /> */}{" "}
        {/* Uncomment if you have AdminNavbar */}
        {/* Main content outlet for nested routes */}
        {/* Changed padding from p-4 md:p-6 to p-0 to remove all padding and eliminate the gap.
            If you need minimal padding, you can use classes like 'p-1' or 'px-2 py-1'. */}
        <main className="flex-grow p-0">
          {" "}
          {/* Changed to p-0 to remove the gap */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
