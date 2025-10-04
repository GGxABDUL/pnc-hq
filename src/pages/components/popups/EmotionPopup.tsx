import React, { useState } from "react";
import { auth, db } from "../../../firebase";
import { doc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import Popup from "./Popup";

interface EmotionPopupProps {
  onClose: () => void;
}

const EmotionPopup: React.FC<EmotionPopupProps> = ({ onClose }) => {
  const [emotion, setEmotion] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Mapping emotion numbers to descriptions & emojis
  const emotionMap: Record<number, { emoji: string; label: string }> = {
    1: { emoji: "😢", label: "Very Sad" },
    2: { emoji: "😞", label: "Sad" },
    3: { emoji: "😐", label: "Neutral" },
    4: { emoji: "🙂", label: "Happy" },
    5: { emoji: "😄", label: "Very Happy" },
  };

  const handleSave = async () => {
    if (emotion === null) {
      alert("Please select an emotion before saving.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("No user logged in.");
      return;
    }

    try {
      setSaving(true);
      const dailyRef = collection(db, "daily");

      await addDoc(dailyRef, {
        uid,
        type: "emotion",
        value: emotion,
        label: emotionMap[emotion].label,
        emoji: emotionMap[emotion].emoji,
        timestamp: serverTimestamp(),
      });

      alert("Emotion saved!");
      onClose();
    } catch (err) {
      console.error("Error saving emotion:", err);
      alert("Failed to save emotion. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popup onClose={onClose}>
      <h3>How are you feeling today?</h3>

      <div style={{ display: "flex", justifyContent: "space-around", margin: "12px 0" }}>
        {Object.entries(emotionMap).map(([num, { emoji, label }]) => (
          <button
            key={num}
            onClick={() => setEmotion(parseInt(num))}
            style={{
              background: emotion === parseInt(num) ? "#1976d2" : "#f0f0f0",
              color: emotion === parseInt(num) ? "#fff" : "#333",
              fontSize: "24px",
              border: "none",
              borderRadius: "10px",
              width: "50px",
              height: "50px",
              cursor: "pointer",
              transition: "0.2s",
            }}
            title={label}
          >
            {emoji}
          </button>
        ))}
      </div>

      {emotion !== null && (
        <div style={{ textAlign: "center", marginBottom: "10px", fontWeight: 600 }}>
          You selected: {emotionMap[emotion].emoji} {emotionMap[emotion].label}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: "#4caf50",
          color: "#fff",
          border: "none",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </Popup>
  );
};

export default EmotionPopup;
