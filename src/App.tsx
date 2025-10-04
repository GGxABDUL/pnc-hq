import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

// Pages
import Login from "./pages/login";
import Logout from "./pages/logout";
import RVChat from "./pages/rv-chat";
import RVLog from "./pages/rv-log";
import RVProfile from "./pages/rv-profile";
import RVStreak from "./pages/rv-streak";
import RVSchedule from "./pages/rv-schedule";
import RVStats from "./pages/rv-stats";
import RVMonitor from "./pages/rv-monitor";

// Popups
import InterestPopup from "./pages/components/popups/InterestPopup";
import EmotionPopup from "./pages/components/popups/EmotionPopup";
import SleepPopup from "./pages/components/popups/SleepPopup";

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [currentPage, setCurrentPage] = useState<string>("profile");

  // Popup state
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [showEmotionPopup, setShowEmotionPopup] = useState(false);
  const [showSleepPopup, setShowSleepPopup] = useState(false);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        return;
      }

      setUser(u);
      if (u.email?.includes("m-")) setRole("student");
      else if (u.email?.includes("g-")) setRole("teacher");

      const userRef = doc(db, "users", u.uid);
      const userSnap = await getDoc(userRef);
      const today = new Date().toDateString();

      if (!userSnap.exists()) return;

      const data = userSnap.data();

      // === Interest popup ===
      if (!data.interest) {
        setShowInterestPopup(true);
        return;
      }

      // === Emotion popup ===
      const q1 = query(
        collection(db, "daily"),
        where("uid", "==", u.uid),
        where("type", "==", "emotion")
      );
      const eSnap = await getDocs(q1);
      const emotionDocs = eSnap.docs.map((d) => d.data());
      let latestEmotionDate: string | null = null;
      if (emotionDocs.length > 0) {
        const sorted = emotionDocs.sort(
          (a, b) =>
            (b.timestamp?.seconds || new Date(b.timestamp).getTime() / 1000) -
            (a.timestamp?.seconds || new Date(a.timestamp).getTime() / 1000)
        );
        latestEmotionDate = new Date(
          sorted[0].timestamp?.toDate?.() || sorted[0].timestamp
        ).toDateString();
      }
      if (!latestEmotionDate || latestEmotionDate !== today)
        setShowEmotionPopup(true);

      // === Sleep popup ===
      const q2 = query(
        collection(db, "daily"),
        where("uid", "==", u.uid),
        where("type", "==", "sleep")
      );
      const sSnap = await getDocs(q2);
      const sleepDocs = sSnap.docs.map((d) => d.data());
      let latestSleepDate: string | null = null;
      if (sleepDocs.length > 0) {
        const sorted = sleepDocs.sort(
          (a, b) =>
            (b.timestamp?.seconds || new Date(b.timestamp).getTime() / 1000) -
            (a.timestamp?.seconds || new Date(a.timestamp).getTime() / 1000)
        );
        latestSleepDate = new Date(
          sorted[0].timestamp?.toDate?.() || sorted[0].timestamp
        ).toDateString();
      }
      if (!latestSleepDate || latestSleepDate !== today)
        setShowSleepPopup(true);
    });

    return () => unsubscribe();
  }, [auth]);

  if (!user) return <Login />;

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentPage("login");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "chat":
        return <RVChat />;
      case "log":
        return <RVLog />;
      case "profile":
        return <RVProfile user={user} role={role} />;
      case "streak":
        return <RVStreak />;
      case "schedule":
        return <RVSchedule />;
      case "stats":
        return <RVStats />;
      case "monitor":
        return role === "teacher" ? (
          <RVMonitor user={user} role={role} />
        ) : (
          <RVProfile user={user} role={role} />
        );
      case "logout":
        return <Logout onLogout={handleLogout} />;
      default:
        return <RVProfile user={user} role={role} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Sidebar */}
      <div style={{ width: "150px", background: "#f0f0f0", padding: "10px" }}>
        <button onClick={() => setCurrentPage("profile")}>Profile</button>
        <button onClick={() => setCurrentPage("streak")}>Streak</button>
        <button onClick={() => setCurrentPage("chat")}>Chat</button>
        <button onClick={() => setCurrentPage("log")}>Log</button>
        <button onClick={() => setCurrentPage("schedule")}>Schedule</button>
        <button onClick={() => setCurrentPage("stats")}>Stats</button>
        {role === "teacher" && (
          <button onClick={() => setCurrentPage("monitor")}>Monitor</button>
        )}
        <button onClick={() => setCurrentPage("logout")}>Logout</button>
      </div>

      {/* Main content */}
      <div
        style={{
          width: "400px",
          height: "450px",
          border: "1px solid #ccc",
          overflowY: "scroll",
          padding: "10px",
        }}
      >
        {renderPage()}
      </div>

      {/* Popups */}
      {showInterestPopup && (
        <InterestPopup
          onClose={() => setShowInterestPopup(false)}
          onSaved={() => window.location.reload()}
        />
      )}
      {showEmotionPopup && (
        <EmotionPopup onClose={() => setShowEmotionPopup(false)} />
      )}
      {showSleepPopup && (
        <SleepPopup onClose={() => setShowSleepPopup(false)} />
      )}
    </div>
  );
};

export default App;
