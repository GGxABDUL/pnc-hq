// src/App.tsx
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

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

// Popups (paths you already use)
import InterestPopup from "./pages/components/popups/InterestPopup";
import EmotionPopup from "./pages/components/popups/EmotionPopup";
import SleepPopup from "./pages/components/popups/SleepPopup";

const TEST_EMAIL = "ahmirhafy@gmail.com"; // trial teacher account

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

      // trial override
      let effectiveRole: "student" | "teacher" | null = null;
      if (u.email === TEST_EMAIL) effectiveRole = "teacher";
      else if (u.email?.includes("m-")) effectiveRole = "student";
      else if (u.email?.includes("g-")) effectiveRole = "teacher";

      setRole(effectiveRole);

      // === popup logic: interest (once), daily emotion/sleep once per day ===
      try {
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        const today = new Date().toDateString();

        if (!userSnap.exists()) {
          // If no user doc exists yet we will open interest popup (only for non-teacher)
          if (effectiveRole !== "teacher") {
            setShowInterestPopup(true);
            return;
          }
        } else {
          const data = userSnap.data();
          if (!data?.interest && effectiveRole !== "teacher") {
            setShowInterestPopup(true);
            return;
          }

          // Emotion: get most recent emotion entry and check if it was today
          const q1 = query(
            collection(db, "daily"),
            where("uid", "==", u.uid),
            where("type", "==", "emotion")
          );
          const eSnap = await getDocs(q1);
          if (eSnap.empty) {
            setShowEmotionPopup(true);
          } else {
            // find latest timestamp and compare date
            const latest = eSnap.docs.reduce((a, b) => {
              const ta = a.data().timestamp;
              const tb = b.data().timestamp;
              const at = ta?.toDate ? ta.toDate().getTime() : new Date(ta).getTime();
              const bt = tb?.toDate ? tb.toDate().getTime() : new Date(tb).getTime();
              return at > bt ? a : b;
            });
            const lastDate = new Date(latest.data().timestamp?.toDate?.() || latest.data().timestamp).toDateString();
            if (lastDate !== today) setShowEmotionPopup(true);
          }

          // Sleep
          const q2 = query(
            collection(db, "daily"),
            where("uid", "==", u.uid),
            where("type", "==", "sleep")
          );
          const sSnap = await getDocs(q2);
          if (sSnap.empty) {
            setShowSleepPopup(true);
          } else {
            const latest = sSnap.docs.reduce((a, b) => {
              const ta = a.data().timestamp;
              const tb = b.data().timestamp;
              const at = ta?.toDate ? ta.toDate().getTime() : new Date(ta).getTime();
              const bt = tb?.toDate ? tb.toDate().getTime() : new Date(tb).getTime();
              return at > bt ? a : b;
            });
            const lastDate = new Date(latest.data().timestamp?.toDate?.() || latest.data().timestamp).toDateString();
            if (lastDate !== today) setShowSleepPopup(true);
          }
        }
      } catch (err) {
        console.error("Popup check error", err);
      }
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
        return <RVChat user={user} role={role} />;
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
        return role === "teacher" ? <RVMonitor user={user} role={role} /> : <RVProfile user={user} role={role} />;
      case "logout":
        return <Logout onLogout={handleLogout} />;
      default:
        return <RVProfile user={user} role={role} />;
    }
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "150px", background: "#f0f0f0", padding: "10px" }}>
        <button onClick={() => setCurrentPage("profile")}>Profile</button>
        <button onClick={() => setCurrentPage("streak")}>Streak</button>
        <button onClick={() => setCurrentPage("chat")}>Chat</button>
        <button onClick={() => setCurrentPage("log")}>Log</button>
        <button onClick={() => setCurrentPage("schedule")}>Schedule</button>
        <button onClick={() => setCurrentPage("stats")}>Stats</button>
        {role === "teacher" && <button onClick={() => setCurrentPage("monitor")}>Monitor</button>}
        <button onClick={() => setCurrentPage("logout")}>Logout</button>
      </div>

      {/* Main content */}
      <div style={{ width: "400px", height: "450px", border: "1px solid #ccc", overflowY: "scroll", padding: "10px" }}>
        {renderPage()}
      </div>

      {/* Popups (simple mounting) */}
      {showInterestPopup && <InterestPopup onClose={() => setShowInterestPopup(false)} onSaved={() => window.location.reload()} />}
      {showEmotionPopup && <EmotionPopup onClose={() => setShowEmotionPopup(false)} />}
      {showSleepPopup && <SleepPopup onClose={() => setShowSleepPopup(false)} />}
    </div>
  );
};

export default App;
