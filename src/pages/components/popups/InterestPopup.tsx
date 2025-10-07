import React, { useEffect, useState } from "react";
import { db, auth } from "../../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface InterestPopupProps {
  onClose: () => void;
  onSaved?: () => void;
}

const InterestPopup: React.FC<InterestPopupProps> = ({ onClose, onSaved }) => {
  const uid = auth.currentUser?.uid;
  const [interest, setInterest] = useState({
    age: "",
    gender: "",
    hobby: "",
    sport: "",
    subject: "",
    food: "",
    drink: "",
  });
  const [visible, setVisible] = useState(false);

  // 🔹 Auto-open when user has no interest data
  useEffect(() => {
    const checkInterest = async () => {
      if (!uid) return;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      const data = snap.data();
      if (!data?.interest) setVisible(true);
    };
    checkInterest();
  }, [uid]);

  const handleChange = (key: string, value: string) => {
    setInterest((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!uid) return;
    const ref = doc(db, "users", uid);
    try {
      await setDoc(ref, { interest }, { merge: true });
      console.log("✅ Interest saved successfully:", interest);
      setVisible(false);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("❌ Failed to save interest:", err);
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 400,
          height: 450,
          background: "#fff",
          borderRadius: 12,
          padding: "24px 20px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden", // ✅ prevents left-right scroll
        }}
      >
        {/* ❌ Close Button */}
        <button
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "transparent",
            border: "none",
            fontSize: 22,
            fontWeight: "bold",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ×
        </button>

        {/* 📝 Title */}
        <h2 style={{ textAlign: "center", marginBottom: 10 }}>
          Tell us about your interests
        </h2>

        {/* 🧩 Inputs */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden", // ✅ disables horizontal scroll
            paddingRight: 6,
            marginBottom: 10,
          }}
        >
          {Object.keys(interest).map((key) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type="text"
                value={(interest as any)[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>
          ))}
        </div>

        {/* 🔘 Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            style={{
              flex: 1,
              marginRight: 8,
              padding: "8px 0",
              borderRadius: 6,
              border: "1px solid #aaa",
              background: "#f3f3f3",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              marginLeft: 8,
              padding: "8px 0",
              borderRadius: 6,
              border: "none",
              background: "#007bff",
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterestPopup;
