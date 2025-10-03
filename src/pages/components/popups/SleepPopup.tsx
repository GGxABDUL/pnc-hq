// src/components/popups/SleepPopup.tsx
import React, { useState } from "react";
import { db, auth } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Popup from "./Popup";

interface SleepPopupProps {
  onClose: () => void;
}

const SleepPopup: React.FC<SleepPopupProps> = ({ onClose }) => {
  const [hours, setHours] = useState("");

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await addDoc(collection(db, "daily"), {
      uid,
      type: "sleep",
      value: parseFloat(hours),
      timestamp: serverTimestamp(),
    });
    onClose();
  };

  return (
    <Popup onClose={onClose}>
      <h3>Sleep Tracker</h3>
      <input
        placeholder="Hours slept"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        style={{ display: "block", margin: "8px 0" }}
      />
      <button onClick={handleSave}>Save</button>
    </Popup>
  );
};

export default SleepPopup;
