// src/pages/rv-log.tsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

interface LogItem {
  id?: string;
  text: string;
  vibe: "positive" | "negative";
  timestamp?: any;
}

const RVLog: React.FC = () => {
  const [input, setInput] = useState("");
  const [vibe, setVibe] = useState<"positive" | "negative">("positive");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    // ✅ Real-time listener instead of manual fetching
    const q = query(collection(db, "logs"), where("uid", "==", uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const arr: LogItem[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
        .sort(
          (a, b) =>
            (a.timestamp?.seconds || a.timestamp) -
            (b.timestamp?.seconds || b.timestamp)
        );
      setLogs(arr);
    });

    return () => unsubscribe(); // cleanup listener
  }, [uid]);

  const send = async () => {
    if (!input.trim() || !uid) return;
    try {
      await addDoc(collection(db, "logs"), {
        uid,
        text: input.trim(),
        vibe,
        timestamp: Timestamp.now(), // ✅ Firestore timestamp for consistency
      });
      setInput("");
    } catch (err) {
      console.error("send log error", err);
    }
  };

  return (
    <div style={{ padding: 12, fontFamily: "Inter, Arial, sans-serif" }}>
      <h3>RV Log</h3>

      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setVibe("positive")}
          style={{
            fontWeight: vibe === "positive" ? "bold" : "normal",
            marginRight: 6,
          }}
        >
          Positive
        </button>
        <button
          onClick={() => setVibe("negative")}
          style={{ fontWeight: vibe === "negative" ? "bold" : "normal" }}
        >
          Negative
        </button>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        style={{
          width: "100%",
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
          resize: "none",
        }}
        placeholder="Write your log entry..."
      />
      <div style={{ marginTop: 8 }}>
        <button
          onClick={send}
          style={{
            background: "#1976d2",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Save entry
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Your logs (auto-sync)</h4>
        {logs.length === 0 ? (
          <div style={{ color: "#777" }}>No logs yet.</div>
        ) : (
          logs.map((l, i) => (
            <div
              key={l.id || i}
              style={{
                padding: 8,
                border: "1px solid #eee",
                borderRadius: 6,
                marginBottom: 6,
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: 12, color: "#555" }}>
                {l.vibe} vibe •{" "}
                {new Date(
                  l.timestamp?.toDate?.() ?? l.timestamp
                ).toLocaleString()}
              </div>
              <div>{l.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RVLog;
