// src/pages/components/popups/InterestPopup.tsx
import React, { useState } from "react";
import { db, auth } from "../../../firebase";
import { doc, updateDoc, setDoc } from "firebase/firestore";

const InterestPopup: React.FC<{ onClose: () => void; onSaved?: () => void }> = ({
  onClose,
  onSaved,
}) => {
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

  const handleChange = (key: string, value: string) => {
    setInterest((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!uid) return;
    const ref = doc(db, "users", uid);

    try {
      // ✅ Safely merge the full interest object
      await setDoc(
        ref,
        { interest },
        { merge: true } // ensures we keep other user fields
      );

      console.log("✅ Interest saved successfully:", interest);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("❌ Failed to save interest:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ background: "white", padding: 20, borderRadius: 8, width: 300 }}>
        <h3>Tell us about your interests</h3>
        {Object.keys(interest).map((key) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <label>
              {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
              <input
                type="text"
                value={(interest as any)[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default InterestPopup;
