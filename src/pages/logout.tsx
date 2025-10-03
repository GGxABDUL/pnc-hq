// src/pages/logout.tsx
import React from "react";

interface LogoutProps {
  onLogout: () => Promise<void>;
}

const Logout: React.FC<LogoutProps> = ({ onLogout }) => {
  return (
    <div>
      <h2>Logout</h2>
      <button onClick={onLogout}>Sign Out</button>
    </div>
  );
};

export default Logout;
