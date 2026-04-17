import React from "react";
import { Navigate } from "react-router-dom";

const isTokenValid = () => {
  try {
    const raw = localStorage.getItem("authUser");
    if (!raw) return false;
    const user = JSON.parse(raw);
    if (!user || !user.access) return false;
    const payload = JSON.parse(atob(user.access.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      localStorage.removeItem("authUser");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("authUser");
    return false;
  }
};

const Authmiddleware = (props) => {
  if (!isTokenValid()) {
    return <Navigate to={{ pathname: "/login", state: { from: props.location } }} />;
  }
  return <React.Fragment>{props.children}</React.Fragment>;
};

export default Authmiddleware;