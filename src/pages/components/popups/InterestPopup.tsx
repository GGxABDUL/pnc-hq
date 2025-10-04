import React, { useState } from "react";
import { auth, db } from "../../../firebase";
import { doc, setDoc } from "firebase/firestore";
import Popup from "./Popup";

interface InterestPopupProps {
  onClose: () => void;
  onSaved?: () => void; // ✅ New: allows parent (App.tsx) or Profile to refresh
}

const InterestPopup: React.FC<InterestPopupProps> = ({ onClose, onSaved }) => {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState(""); // ✅ new field
  const [hobby, setHobby] = useState("");
  const [sport, setSport] = useState("");
  const [subject, setSubject] = useState("");
  const [food, setFood] = useState("");
  const [drink, setDrink] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        alert("No user logged in.");
        setSaving(false);
        return;
      }

      await setDoc(
        doc(db, "users", uid),
        {
          interest: {
            age,
            gender,
            hobby,
            sport,
            subject,
            food,
            drink,
          },
        },
        { merge: true }
      );

      alert("✅ Interest saved!");
      onClose();
      onSaved && onSaved(); // ✅ trigger auto-refresh
    } catch (err) {
      console.error("Error saving interest:", err);
      alert("❌ Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popup onClose={onClose}>
      <h3>Interest Survey</h3>

      <input
        placeholder="Age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        style={{ display: "block", margin: "8px 0", width: "100%" }}
      />
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        style={{ display: "block", margin: "8px 0", width: "100%" }}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      <input
        placeholder="Hobby"
        value={hobby}
        onChange={(e) => setHobby(e.target.value)}
        style={{ display: "block", margin: "8px 0", width: "100%" }}
      />
      <input
        placeholder="Favorite Sport"
        value={sport}
        onChange={(e) => setSport(e.target.value)}
        style={{ display: "block", margin: "8px 0", width: "100%" }}
      />
      <input
        placeholder="Favorite Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ display: "block", margin: "8px 0", width: "100%" }}
      />
      <input
        placeholder="Favorite Food"
        value={food}
        onChange={(e) => setFood(e.target.value)}
        style={{ display: "block", margin: "8px 0", width: "100%" }}
      />
      <input
        placeholder="Favorite Drink"
        value={drink}
        onChange={(e) => setDrink(e.target.value)}
        style={{ display: "block", margin: "12px 0", width: "100%" }}
      />

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

export default InterestPopup;
