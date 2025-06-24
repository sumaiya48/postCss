// src/router/ProtectedRoute.jsx

import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // Check if an authentication token exists in local storage
  const isAuthenticated = localStorage.getItem("authToken");

  // If the user is authenticated, render the child components (your admin panel).
  // Otherwise, redirect them to the /login page.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
