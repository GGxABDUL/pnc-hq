// src/pages/rv-log.tsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, query, where, orderBy, getDocs } from "firebase/firestore";

interface LogItem { id?: string; text: string; vibe: "positive" | "negative"; timestamp?: any }

const RVLog: React.FC = () => {
  const [input, setInput] = useState("");
  const [vibe, setVibe] = useState<"positive" | "negative">("positive");
  const [logs, setLogs] = useState<LogItem[]>([]);

  const uid = auth.currentUser?.uid;

  const fetchLogs = async () => {
    if (!uid) return;
    const q = query(collection(db, "logs"), where("uid", "==", uid), orderBy("timestamp", "asc"));
    const snap = await getDocs(q);
    const arr: LogItem[] = [];
    snap.forEach(doc => arr.push({ id: doc.id, ...(doc.data() as any) }));
    setLogs(arr);
  };

  useEffect(() => { fetchLogs(); }, [uid]);

  const send = async () => {
    if (!input.trim() || !uid) return;
    await addDoc(collection(db, "logs"), {
      uid,
      text: input.trim(),
      vibe,
      timestamp: new Date()
    });
    setInput("");
    fetchLogs();
  };

  return (
    <div>
      <h3>RV Log</h3>
      <div>
        <button onClick={() => setVibe("positive")} style={{ fontWeight: vibe==="positive" ? "bold" : "normal" }}>Positive</button>
        <button onClick={() => setVibe("negative")} style={{ fontWeight: vibe==="negative" ? "bold" : "normal" }}>Negative</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={3} style={{ width: "100%" }} />
        <div style={{ marginTop: 8 }}>
          <button onClick={send}>Save entry</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Your logs</h4>
        {logs.map((l, i) => (
          <div key={l.id || i} style={{ padding: 8, border: "1px solid #eee", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "#555" }}>{l.vibe} vibe • {new Date(l.timestamp?.toDate?.() ?? l.timestamp).toLocaleString()}</div>
            <div>{l.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RVLog;
