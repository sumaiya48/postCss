import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaTags,
  FaGift,
  FaImages,
  FaUsers,
  FaUserTie,
  FaTruck,
  FaMoneyCheckAlt,
  FaShoppingCart,
  FaBoxOpen,
  FaSearch,
  FaEnvelope,
  FaQuestionCircle,
  FaBriefcase,
  FaNewspaper,
  FaBell,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaUserCircle,
  FaChevronDown,
  FaSignOutAlt,
  FaUserEdit,
} from "react-icons/fa";

// --- Menu Items ---
const menuItems = [
  { label: "Dashboard", icon: <FaChartLine />, path: "/dashboard" },
  { label: "POS System", icon: <FaShoppingCart />, path: "/pos" },
  {
    label: "Order",
    icon: <FaTags />,
    children: [
      { label: "All Orders", path: "/orders/all" },
      { label: "Pending", path: "/orders/neworder" },
      { label: "Completed", path: "/orders/completed" },
      { label: "Cancelled", path: "/orders/cancelledorder" },
    ],
  },
  {
    label: "Products",
    icon: <FaBoxOpen />,
    children: [
      { label: "All Products", path: "/products/all" },
      { label: "Categories", path: "/products/categories" },
      { label: "Add Product", path: "/products/add" },
      { label: "Product Review", path: "/products/review" },
    ],
  },
  { label: "Coupons", icon: <FaGift />, path: "/coupons" },
  { label: "Media", icon: <FaImages />, path: "/media" },
  { label: "Customers", icon: <FaUsers />, path: "/customers" },
  { label: "Staff", icon: <FaUserTie />, path: "/staff" },
  { label: "Courier", icon: <FaTruck />, path: "/courier" },
  { label: "Transactions", icon: <FaMoneyCheckAlt />, path: "/transactions" },
  { label: "Newsletter", icon: <FaBell />, path: "/newsletter" },
  { label: "Inquiries", icon: <FaEnvelope />, path: "/inquiries" },
  { label: "Jobs", icon: <FaBriefcase />, path: "/jobs" },
  { label: "Blogs", icon: <FaNewspaper />, path: "/blogs" },
  { label: "FAQ", icon: <FaQuestionCircle />, path: "/faq" },
];

export default function AdminSidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  // Filter menu items based on search text (case-insensitive)
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.label.toLowerCase().includes(searchText.toLowerCase())) return true;
    if (item.children) {
      // Check if any child matches
      return item.children.some((child) =>
        child.label.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return false;
  });

  return (
    <div
      className={`flex flex-col min-h-screen bg-white border-r border-gray-200 ${
        isCollapsed ? "w-20" : "w-64"
      } duration-300 relative`}
    >
      {/* Logo and Search Section */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4 h-10">
          <img
            src="/assets/logo.svg"
            alt="Logo"
            className="w-10 h-10 flex-shrink-0"
          />
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-gray-800">
              Dhaka Plastic & Metal
            </h2>
          )}
        </div>
        {!isCollapsed && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="input input-bordered w-full h-10"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <FaSearch className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) =>
          item.children ? (
            <div
              key={item.label}
              className={`collapse collapse-arrow bg-base-100 min-h-0 rounded-lg p-0 ${
                isCollapsed ? "pointer-events-none" : ""
              }`}
            >
              <input type="checkbox" className="min-h-0 peer" />
              <div className="collapse-title text-sm font-medium min-h-0 p-3 flex items-center gap-3 peer-checked:bg-blue-500 peer-checked:text-white">
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && item.label}
              </div>
              <div className="collapse-content !p-0">
                <ul className="menu menu-sm p-0 pl-8">
                  {item.children
                    .filter((child) =>
                      child.label.toLowerCase().includes(searchText.toLowerCase())
                    )
                    .map((child) => (
                      <li key={child.label}>
                        <NavLink
                          to={child.path}
                          className={({ isActive }) =>
                            `py-2 rounded-none ${
                              isActive ? "bg-blue-100 text-blue-700 font-semibold" : ""
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg text-sm transition-colors hover:bg-gray-100 ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive ? "bg-blue-500 text-white font-semibold shadow" : "text-gray-600"
                }`
              }
              title={isCollapsed ? item.label : ""}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t mt-auto">
        <div className="dropdown dropdown-top w-full">
          <div
            tabIndex={0}
            role="button"
            className={`flex items-center w-full p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${
              isCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-3">
              <FaUserCircle className="text-4xl text-gray-400 flex-shrink-0" />
              {!isCollapsed && (
                <div>
                  <p className="font-bold text-sm">Admin</p>
                  <p className="text-xs text-gray-500">admin@dpmsign.com</p>
                </div>
              )}
            </div>
            {!isCollapsed && <FaChevronDown className="transform -rotate-90" />}
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mb-2"
          >
            <li>
              <Link to="/profile">
                <FaUserEdit className="mr-2" /> Edit Profile
              </Link>
            </li>
            <li>
              <button onClick={handleLogout}>
                <FaSignOutAlt className="mr-2" /> Log out
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3.5 bg-white border-2 border-blue-500 text-blue-500 rounded-full p-1 z-10 hover:bg-blue-500 hover:text-white transition-all"
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
      </button>
    </div>
  );
}
