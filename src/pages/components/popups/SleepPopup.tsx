import React, { useState } from "react";
import { auth, db } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Popup from "./Popup";

interface SleepPopupProps {
  onClose: () => void;
}

const SleepPopup: React.FC<SleepPopupProps> = ({ onClose }) => {
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(hours);
    if (isNaN(num) || num <= 0) {
      alert("Please enter valid sleep hours.");
      return;
    }

    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("No user logged in.");

      await addDoc(collection(db, "daily"), {
        uid,
        type: "sleep",
        hours: num,
        timestamp: serverTimestamp(),
      });

      alert("Sleep record saved!");
      onClose();
    } catch (err) {
      console.error("Error saving sleep:", err);
      alert("Failed to save sleep. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popup onClose={onClose}>
      <h3>How many hours did you sleep?</h3>
      <input
        type="number"
        placeholder="Enter hours (e.g., 7)"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "12px", padding: "6px" }}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          background: "#4caf50",
          color: "white",
          padding: "8px 12px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </Popup>
  );
};

export default SleepPopup;
