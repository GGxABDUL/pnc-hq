import React, { useState, useEffect } from "react";
import "./App.css";
import { app, analytics } from "./firebase";
import { db } from "./firebase"; // Firebase connection file
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [currentPage, setCurrentPage] = useState("RV LOG");
  const [selectedLog, setSelectedLog] = useState<number | null>(null);
  const [vibe, setVibe] = useState<"positive" | "negative">("positive");

    // ====== SAVE LOCALLY TO PC ======
  const handleSaveLocal = () => {
    if (logs.length === 0) {
      alert("No logs to save!");
      return;
    }

    const latestLog = logs[logs.length - 1];

    // Send log to Electron backend
    // @ts-ignore (ignore TS warning if not declared)
    window.electronAPI.saveLog(latestLog);

    // Listen for confirmation from Electron
    // @ts-ignore
    window.electronAPI.onSaveLogResponse((msg) => {
      alert(msg); // shows ✅ or ❌
    });
  };


  // ===== FETCH LOGS FROM FIREBASE =====
  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, "logs"), orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedLogs: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() });
      });
      setLogs(fetchedLogs);
    };
    fetchLogs();
  }, []);

  // ====== SEND (save into local state first) ======
  const handleSend = () => {
    if (input.trim() !== "") {
      const newLog = {
        text: input,
        vibe: vibe,
        timestamp: new Date(),
      };
      setLogs([...logs, newLog]);
      setInput("");
    }
  };

  // ====== SAVE TO FIREBASE ======
  const handleSave = async () => {
    if (logs.length === 0) {
      alert("No logs to save!");
      return;
    }

    try {
      const latestLog = logs[logs.length - 1];
      await addDoc(collection(db, "logs"), latestLog);
      alert(`Saved as ${latestLog.vibe} vibe ✅`);
      setCurrentPage("LOG LIST");
    } catch (error) {
      console.error("Error saving log:", error);
      alert("Failed to save log ❌");
    }
  };

  // ====== TOGGLE VIBE ======
  const toggleVibe = () => {
    setVibe(vibe === "positive" ? "negative" : "positive");
  };

  return (
    <div className="app-container">
      {/* ===== HEADER BAR ===== */}
      <header className="header-bar">
        <button className="sidebar-button" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>

        <div className="header-right">
          {currentPage === "RV LOG" && (
            <>
              <div className="vibe-pill" onClick={toggleVibe}>
                {vibe} vibe
              </div>
              <button className="save-button" onClick={handleSave}>
                💾
              </button>
              <button className="save-local-button" onClick={handleSaveLocal}>
                💾 Local
              </button>
            </>
          )}
        </div>
      </header>

      {/* ===== MAIN TITLE ===== */}
      <h1 className="title">{currentPage}</h1>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-home">
        {/* RV LOG PAGE */}
        {currentPage === "RV LOG" && (
          <div className="rv-log">
            <div className="log-area">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  {log.vibe} vibe {index + 1}: {log.text}
                </div>
              ))}
            </div>

            <div className="input-bar">
              <input
                type="text"
                placeholder="Type here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
              />
              <button className="send-button" onClick={handleSend}>
                📨
              </button>
            </div>

          </div>
        )}

        {/* LOG LIST PAGE */}
        {currentPage === "LOG LIST" && (
          <div className="rv-log">
            {selectedLog === null ? (
              <div className="log-area">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="log-entry clickable"
                    onClick={() => setSelectedLog(index)}
                  >
                    {log.vibe} vibe {index + 1}
                  </div>
                ))}
              </div>
            ) : (
              <div className="log-area">
                <h3>
                  {logs[selectedLog].vibe} vibe {selectedLog + 1}
                </h3>
                <p>{logs[selectedLog].text}</p>
                <button
                  className="back-button"
                  onClick={() => setSelectedLog(null)}
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* OTHER PAGES */}
        {currentPage === "RV CHAT" && (
          <div className="page-placeholder">💬 Welcome to RV CHAT</div>
        )}
        {currentPage === "RV STATS" && (
          <div className="page-placeholder">📊 RV STATS coming soon...</div>
        )}
        {currentPage === "RV SCHEDULE" && (
          <div className="page-placeholder">📅 RV SCHEDULE</div>
        )}
        {currentPage === "RV STREAK" && (
          <div className="page-placeholder">🔥 RV STREAK</div>
        )}
        {currentPage === "RV PROFILE" && (
          <div className="page-placeholder">👤 RV PROFILE</div>
        )}
      </div>

      {/* ===== SIDEBAR NAVIGATION ===== */}
      {isOpen && (
        <nav className="sidebar-nav">
          <ul>
            <li onClick={() => setCurrentPage("RV LOG")}>RV LOG</li>
            <li onClick={() => setCurrentPage("RV CHAT")}>RV CHAT</li>
            <li onClick={() => setCurrentPage("RV STATS")}>RV STATS</li>
            <li onClick={() => setCurrentPage("RV SCHEDULE")}>RV SCHEDULE</li>
            <li onClick={() => setCurrentPage("RV STREAK")}>RV STREAK</li>
            <li onClick={() => setCurrentPage("RV PROFILE")}>RV PROFILE</li>
            <li className="rv-logout">
              <button className="logout-button">Log out</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default App;
