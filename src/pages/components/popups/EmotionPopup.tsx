// src/components/popups/EmotionPopup.tsx
import React, { useState } from "react";
import { db, auth } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Popup from "./Popup";

interface EmotionPopupProps {
  onClose: () => void;
}

const EmotionPopup: React.FC<EmotionPopupProps> = ({ onClose }) => {
  const [value, setValue] = useState<number>(3);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await addDoc(collection(db, "daily"), {
      uid,
      type: "emotion",
      value,
      timestamp: serverTimestamp(),
    });
    onClose();
  };

  return (
    <Popup onClose={onClose}>
      <h3>How are you feeling today?</h3>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value))}
      />
      <div>Selected: {value}</div>
      <button onClick={handleSave}>Save</button>
    </Popup>
  );
};

export default EmotionPopup;
