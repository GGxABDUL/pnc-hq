import React, { useEffect, useState } from "react";
import { db, auth } from "../../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Popup from "./Popup";

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

  // 🔹 Show popup automatically when user has no "interest" yet
  useEffect(() => {
    const checkInterest = async () => {
      if (!uid) return;
      const ref = doc(db, "users", uid);
      const snap = await getDoc(ref);
      const data = snap.data();
      if (!data?.interest) {
        setVisible(true);
      }
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
      // ✅ Merge interest field without overwriting other data
      await setDoc(ref, { interest }, { merge: true });
      console.log("✅ Interest saved successfully:", interest);
      setVisible(false);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("❌ Failed to save interest:", err);
    }
  };

  // 🔸 Don’t render anything until popup should be shown
  if (!visible) return null;

  return (
    <Popup onClose={() => { setVisible(false); onClose(); }}>
      <h3>Tell us about your interests</h3>

      {Object.keys(interest).map((key) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <label>
            {key.charAt(0).toUpperCase() + key.slice(1)}:
            <input
              type="text"
              value={(interest as any)[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                padding: 6,
              }}
            />
          </label>
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => { setVisible(false); onClose(); }}>Cancel</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </Popup>
  );
};

export default InterestPopup;
