// src/pages/rv-schedule.tsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface ScheduleItem {
  id?: string;
  title: string;
  date: Timestamp;
  startTime: string;
  endTime: string;
  duration: number;
  notes?: string;
}

const RVScheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "schedules"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as ScheduleItem),
      }));
      setSchedules(data);
    });
    return () => unsub();
  }, [uid]);

  const calcDuration = (start: string, end: string): number => {
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    const startTotal = sH + sM / 60;
    const endTotal = eH + eM / 60;
    return Math.max(0, endTotal - startTotal);
  };

  const handleSave = async () => {
    if (!uid || !title.trim() || !date || !startTime || !endTime) return;

    const duration = calcDuration(startTime, endTime);
    const dateTimestamp = Timestamp.fromDate(new Date(date));

    const sameDaySchedules = schedules.filter(
      (s) => s.date.toDate().toDateString() === new Date(date).toDateString()
    );
    const totalHours = sameDaySchedules.reduce(
      (sum, s) => sum + s.duration,
      duration
    );

    if (totalHours > 15) {
      alert("⚠️ Total scheduled hours exceed 15 hours for this day!");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "schedules", editingId), {
          title,
          date: dateTimestamp,
          startTime,
          endTime,
          duration,
          notes,
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "schedules"), {
          uid,
          title,
          date: dateTimestamp,
          startTime,
          endTime,
          duration,
          notes,
        });
      }
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setNotes("");
    } catch (err) {
      console.error("❌ Error saving schedule:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this schedule?")) {
      await deleteDoc(doc(db, "schedules", id));
    }
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingId(item.id!);
    setTitle(item.title);
    setDate(item.date.toDate().toISOString().split("T")[0]);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setNotes(item.notes || "");
  };

  return (
    <div style={{ padding: 16, fontFamily: "Inter, sans-serif" }}>
      <h3>RV Schedule</h3>
      <p style={{ color: "#555" }}>
        Create sessions with start and end times. Warns if total exceeds 15 hours per day.
      </p>

      {/* --- Form --- */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
          background: "#fafafa",
        }}
      >
        <input
          placeholder="Session title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              margin: "6px 0 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
          />
        </label>

        {/* --- Start / End Time Inputs --- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 10,
          }}
        >
          <label style={{ flex: "0 0 45%" }}>
            Start:
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </label>

          <label style={{ flex: "0 0 45%" }}>
            End:
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 4,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </label>
        </div>

        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: "100%",
            height: 60,
            padding: 8,
            marginTop: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            resize: "none",
          }}
        />

        <button
          onClick={handleSave}
          style={{
            marginTop: 10,
            padding: "8px 12px",
            border: "none",
            borderRadius: 6,
            background: "#1976d2",
            color: "white",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {editingId ? "Update Schedule" : "Add Schedule"}
        </button>
      </div>

      {/* --- List --- */}
      <div>
        <h4>Your Schedules</h4>
        {schedules.length === 0 ? (
          <p>No schedules yet.</p>
        ) : (
          schedules
            .sort((a, b) => a.date.toMillis() - b.date.toMillis())
            .map((s) => (
              <div
                key={s.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 6,
                  padding: 10,
                  marginBottom: 8,
                  background: "#fff",
                }}
              >
                <strong>{s.title}</strong>
                <div style={{ fontSize: 13, color: "#555" }}>
                  {s.date.toDate().toLocaleDateString()} — {s.startTime} to{" "}
                  {s.endTime} ({s.duration.toFixed(1)}h)
                </div>
                {s.notes && (
                  <p style={{ fontSize: 13, marginTop: 6, color: "#333" }}>
                    📝 {s.notes}
                  </p>
                )}
                <div style={{ marginTop: 6 }}>
                  <button
                    onClick={() => handleEdit(s)}
                    style={{
                      padding: "4px 8px",
                      marginRight: 6,
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      background: "#eee",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id!)}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #f55",
                      borderRadius: 4,
                      background: "#fdd",
                      color: "#900",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default RVScheduler;
