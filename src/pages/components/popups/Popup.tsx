// src/components/popups/Popup.tsx
import React from "react";

interface PopupProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Popup: React.FC<PopupProps> = ({ onClose, children }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "20px",
          width: "300px",
          maxWidth: "90%",
          boxShadow: "0px 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        {children}
        <button
          onClick={onClose}
          style={{
            marginTop: "10px",
            background: "#ccc",
            border: "none",
            padding: "8px 12px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Popup;
