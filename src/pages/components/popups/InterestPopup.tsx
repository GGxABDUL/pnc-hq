// src/components/popups/InterestPopup.tsx
import React, { useState } from "react";
import { db, auth } from "../../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import Popup from "./Popup";

interface InterestPopupProps {
  onClose: () => void;
}

const InterestPopup: React.FC<InterestPopupProps> = ({ onClose }) => {
  const [age, setAge] = useState("");
  const [hobby, setHobby] = useState("");

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), {
      interest: { age, hobby },
    });
    onClose();
  };

  return (
    <Popup onClose={onClose}>
      <h3>Set Your Interests</h3>
      <input
        placeholder="Age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        style={{ display: "block", margin: "8px 0" }}
      />
      <input
        placeholder="Hobby"
        value={hobby}
        onChange={(e) => setHobby(e.target.value)}
        style={{ display: "block", margin: "8px 0" }}
      />
      <button onClick={handleSave}>Save</button>
    </Popup>
  );
};

export default InterestPopup;
