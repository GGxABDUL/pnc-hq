// src/pages/rv-chat.tsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";

const RVChat: React.FC = () => {
  const uid = auth.currentUser?.uid;
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const all: any[] = [];
      snap.forEach(d => all.push({ id: d.id, ...(d.data() as any) }));
      setUsers(all.filter(u => u.uid !== uid));
    };
    fetchUsers();
  }, [uid]);

  useEffect(() => {
    if (!selectedUser || !uid) return;
    // we store messages in collection 'chats' as documents with id sorted uid1_uid2 (deterministic)
    const chatId = [uid, selectedUser.uid].sort().join("_");
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "asc"));
    return onSnapshot(q, snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
      setMessages(arr);
    });
  }, [selectedUser, uid]);

  const send = async () => {
    if (!message.trim() || !selectedUser || !uid) return;
    const chatId = [uid, selectedUser.uid].sort().join("_");
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      from: uid,
      to: selectedUser.uid,
      text: message.trim(),
      timestamp: new Date()
    });
    setMessage("");
  };

  return (
    <div>
      <h3>RV Chat (1-on-1)</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ width: 140 }}>
          <h4>Users</h4>
          {users.map(u => (
            <div key={u.uid} style={{ padding: 6, cursor: "pointer", border: selectedUser?.uid === u.uid ? "1px solid #000" : "1px solid #eee" }} onClick={() => setSelectedUser(u)}>
              {u.email} <div style={{ fontSize: 11, color: "#666" }}>{u.role}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {selectedUser ? (
            <>
              <h4>Chat with {selectedUser.email}</h4>
              <div style={{ height: 220, overflow: "auto", border: "1px solid #eee", padding: 8 }}>
                {messages.map(m => (
                  <div key={m.id} style={{ textAlign: m.from === uid ? "right" : "left", marginBottom: 6 }}>
                    <div style={{ display: "inline-block", background: m.from === uid ? "#dcf8c6" : "#fff", padding: 6, borderRadius: 6 }}>{m.text}</div>
                    <div style={{ fontSize: 10, color: "#999" }}>{new Date(m.timestamp?.toDate?.() ?? m.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8 }}>
                <input value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: "70%" }} />
                <button onClick={send}>Send</button>
              </div>
            </>
          ) : (
            <div>Select a user to chat</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RVChat;
