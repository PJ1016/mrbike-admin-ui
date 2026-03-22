import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

// Set VITE_SKIP_LOGIN=true in .env.local to bypass login during development
const SKIP_LOGIN = false;

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);

  if (!SKIP_LOGIN && !token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // If authenticated (or login skipped), render children or the nested route
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
