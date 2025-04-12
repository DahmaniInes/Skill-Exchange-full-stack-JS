import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

const RoleGuard = ({ element, allowedRoles }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/unauthorized" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole = decoded?.role;

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return element;
  } catch (err) {
    return <Navigate to="/unauthorized" replace />;
  }
};

export default RoleGuard;
