import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { logout } from "../../redux/slices/authSlice";

const SKIP_LOGIN = false;

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  if (SKIP_LOGIN) {
    return children ? children : <Outlet />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    if (decoded.user_type !== 1) {
      dispatch(logout());
      return <Navigate to="/login" replace />;
    }
  } catch {
    dispatch(logout());
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
