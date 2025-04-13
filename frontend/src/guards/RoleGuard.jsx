import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

const RoleGuard = ({ element, allowedRoles }) => {
  console.log("element", element);
  console.log("allowedRoles", allowedRoles);
  const token = localStorage.getItem("jwtToken");

  if (!token) {
    return <Navigate to="/unauthorized" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    console.log("decoded", decoded);
    const userRole = decoded?.userRole;
    console.log("userRole", userRole);

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    console.log("roles", roles);

    if (!roles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return element;
  } catch (err) {
    console.error("Error decoding token", err);
    return <Navigate to="/unauthorized" replace />;
  }
};

export default RoleGuard;
