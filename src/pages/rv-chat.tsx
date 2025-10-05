import React, { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

interface Message {
  uid: string;
  text: string;
  timestamp?: any;
}

interface ChatUser {
  uid: string;
  name: string;
  email: string;
  role: string;
}

const RVChat: React.FC<{ user: any; role: string | null }> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- Fetch user list ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const arr = snap.docs
        .map((d) => ({ uid: d.id, ...(d.data() as any) }))
        .filter((u) => u.uid !== user.uid);
      setUsers(arr);
    });
    return () => unsub();
  }, [user.uid]);

  // --- Load messages for selected user ---
  useEffect(() => {
    if (!selectedUser) return;

    const threadId = [user.uid, selectedUser.uid].sort().join("_");
    const q = query(
      collection(db, "chatThreads", threadId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => d.data() as Message);
        setMessages(arr);
      },
      (err) => {
        console.error("❌ onSnapshot error:", err);
        alert(
          "Permission denied while opening chat. Make sure Firestore rules allow both users."
        );
      }
    );

    return () => unsub();
  }, [selectedUser, user.uid]);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Send message ---
  const send = async () => {
    if (!input.trim() || !selectedUser || sending) return;
    setSending(true);
    try {
      const threadId = [user.uid, selectedUser.uid].sort().join("_");
      const threadRef = doc(db, "chatThreads", threadId);
      const msgCol = collection(threadRef, "messages");

      // ✅ Ensure thread exists
      const threadSnap = await getDoc(threadRef);
      if (!threadSnap.exists()) {
        await setDoc(threadRef, {
          participants: [user.uid, selectedUser.uid],
          createdAt: serverTimestamp(),
        });
      }

      // ✅ Add message
      await addDoc(msgCol, {
        uid: user.uid,
        text: input.trim(),
        timestamp: serverTimestamp(),
      });

      setInput("");
    } catch (err) {
      console.error("Send chat error:", err);
      alert("Failed to send message. Check Firestore rules.");
    } finally {
      setSending(false);
    }
  };

  // --- Handle Enter key ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // --- User selection screen ---
  if (!selectedUser) {
    const filtered = users.filter((u) =>
      (u.name ?? u.email ?? "")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    );

    return (
      <div style={{ padding: 10 }}>
        <h3>Select a user to chat</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: 10,
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
        <div style={{ maxHeight: 280, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <p>No users found.</p>
          ) : (
            filtered.map((u) => (
              <div
                key={u.uid}
                onClick={() => setSelectedUser(u)}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  padding: 10,
                  marginBottom: 6,
                  cursor: "pointer",
                  background: "#fafafa",
                }}
              >
                <strong>{u.name ?? "Unnamed User"}</strong>
                <div style={{ fontSize: 12, color: "#555" }}>{u.email}</div>
                <div style={{ fontSize: 11, color: "#777" }}>
                  Role: {u.role ?? "unknown"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- Chat screen ---
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <button
          onClick={() => setSelectedUser(null)}
          style={{
            marginRight: 8,
            padding: "4px 8px",
            border: "none",
            borderRadius: 4,
            background: "#ccc",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <h3 style={{ margin: 0 }}>
          {selectedUser.name ?? selectedUser.email}
        </h3>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 10,
          background: "#fafafa",
          maxHeight: 300,
        }}
      >
        {messages.map((m, i) => {
          const isOwn = m.uid === user.uid;
          const timeStr = m.timestamp
            ? new Date(
                m.timestamp.toDate?.() ?? m.timestamp
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";

          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isOwn ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  background: isOwn ? "#d1f7c4" : "#eaeaea",
                  borderRadius: 10,
                  padding: "6px 10px",
                  maxWidth: "70%",
                }}
              >
                <div style={{ fontSize: 14 }}>{m.text}</div>
                {timeStr && (
                  <div
                    style={{
                      fontSize: 10,
                      textAlign: "right",
                      color: "#777",
                      marginTop: 2,
                    }}
                  >
                    {timeStr}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ marginTop: 8, display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        />
        <button
          onClick={send}
          disabled={sending}
          style={{
            marginLeft: 8,
            padding: "8px 16px",
            borderRadius: 6,
            background: sending ? "#aaa" : "#007bff",
            color: "white",
            border: "none",
            cursor: sending ? "not-allowed" : "pointer",
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default RVChat;
