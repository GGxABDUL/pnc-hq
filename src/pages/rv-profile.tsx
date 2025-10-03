// rv-profile
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

interface RVProfileProps {
  user: any; // passed from App.tsx (Firebase User)
  role: "student" | "teacher"| null;
}


interface UserProfile {
  email?: string;
  role?: "student" | "teacher" | null;
  interest?: {
    age?: string;
    hobby?: string;
  } | null;
  streak?: number;
  lastOpened?: any;
  [k: string]: any;
}

const formatStatus = (value: number | null) => {
  if (value === null) return "Unknown";
  return value <= 2 ? "RED" : "GREEN";
};

const chickenStage = (streak: number) => {
  // thresholds: [egg, hatching, chick, chicken, rooster]
  // tweak these values as you want the growth pace to be different
  if (streak < 3) {
    return { name: "Egg", emoji: "🥚", next: 3 };
  } else if (streak < 7) {
    return { name: "Hatching", emoji: "🐣", next: 7 };
  } else if (streak < 14) {
    return { name: "Chick", emoji: "🐥", next: 14 };
  } else {
    return { name: "Chicken", emoji: "🐔", next: null };
  }
};

const percentToNext = (streak: number) => {
  const stage = chickenStage(streak);
  if (!stage.next) return 100;
  const prevThreshold =
    stage.name === "Egg" ? 0 : stage.name === "Hatching" ? 3 : 7;
  const range = stage.next - prevThreshold;
  const progress = Math.max(0, Math.min(1, (streak - prevThreshold) / range));
  return Math.round(progress * 100);
};

const RVProfile: React.FC<RVProfileProps> = ({ user, role }) => {
  const uid = user?.uid;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestEmotion, setLatestEmotion] = useState<number | null>(null);
  const [otherStudents, setOtherStudents] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editAge, setEditAge] = useState("");
  const [editHobby, setEditHobby] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setEditAge(data.interest?.age ?? "");
        setEditHobby(data.interest?.hobby ?? "");
      } else {
        // create a minimal profile if missing
        await updateDoc(userRef, {
          email: user.email ?? null,
          role: role ?? null,
          createdAt: new Date(),
        }).catch(() => {});
        setProfile({ email: user.email, role: role ?? null, interest: null, streak: 0 });
      }
    } catch (err) {
      console.error("fetchProfile error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestEmotion = async () => {
    if (!uid) return;
    try {
      // search 'daily' collection (as used by popups) for most recent emotion
      const q = query(
        collection(db, "daily"),
        where("uid", "==", uid),
        where("type", "==", "emotion"),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0].data() as any;
        // some code uses 'value' as number
        setLatestEmotion(typeof d.value === "number" ? d.value : parseInt(d.value) || null);
      } else {
        setLatestEmotion(null);
      }
    } catch (err) {
      console.error("fetchLatestEmotion error", err);
      setLatestEmotion(null);
    }
  };

  const fetchOtherStudents = async () => {
    try {
      // show other students' streaks (limit to 10 for performance)
      const q = query(collection(db, "users"), where("role", "==", "student"), orderBy("streak", "desc"));
      const snap = await getDocs(q);
      const arr: any[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        arr.push({ uid: d.id, email: data.email, streak: data.streak ?? 0 });
      });
      // keep top 10
      setOtherStudents(arr.slice(0, 10));
    } catch (err) {
      console.error("fetchOtherStudents error", err);
    }
  };

  useEffect(() => {
    if (!uid) return;
    fetchProfile();
    fetchLatestEmotion();
    fetchOtherStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const handleSaveInterest = async () => {
    if (!uid) return;
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        interest: { age: editAge, hobby: editHobby },
      });
      await fetchProfile();
      setEditing(false);
    } catch (err) {
      console.error("handleSaveInterest error", err);
      alert("Failed to save interest.");
    }
  };

  const streakNum = profile?.streak ?? 0;
  const stage = chickenStage(streakNum);
  const progressPercent = percentToNext(streakNum);
  const emotionStatus = formatStatus(latestEmotion);

  if (loading) {
    return (
      <div style={{ padding: 12 }}>
        <h3>Profile</h3>
        <div>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontFamily: "Inter, Arial, sans-serif", lineHeight: 1.4 }}>
      <h3 style={{ marginTop: 0 }}>RV Profile</h3>

      <div style={{ background: "#fff", padding: 12, borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "#666" }}>Email</div>
            <div style={{ fontWeight: 700 }}>{profile?.email ?? user?.email ?? "—"}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#666" }}>Role</div>
            <div style={{ fontWeight: 700 }}>{profile?.role ?? role ?? "—"}</div>
          </div>
        </div>

        <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #eee" }} />

        {/* Interest / editable */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "#666" }}>Interest / Age</div>

          {!editing ? (
            <>
              <div style={{ fontWeight: 600 }}>
                Age: {profile?.interest?.age ?? "—"} — Hobby: {profile?.interest?.hobby ?? "—"}
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => setEditing(true)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#4caf50", color: "white", cursor: "pointer" }}>
                  Edit interests
                </button>
              </div>
            </>
          ) : (
            <div>
              <input
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                placeholder="Age"
                style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd", width: "48%", marginRight: "4%" }}
              />
              <input
                value={editHobby}
                onChange={(e) => setEditHobby(e.target.value)}
                placeholder="Hobby"
                style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd", width: "48%" }}
              />
              <div style={{ marginTop: 8 }}>
                <button onClick={handleSaveInterest} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#1976d2", color: "white", marginRight: 8 }}>
                  Save
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: "6px 10px", borderRadius: 8 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <hr style={{ margin: "12px 0", border: "none", borderTop: "1px solid #eee" }} />

        {/* Emotion status */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#666" }}>Emotion status</div>
          <div style={{ fontWeight: 700 }}>{emotionStatus}{latestEmotion !== null ? ` (${latestEmotion}/5)` : ""}</div>
        </div>

        {/* Streak & chicken growth */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#666" }}>Streak (days)</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{streakNum}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>{stage.emoji}</div>
              <div style={{ fontSize: 12, color: "#333", marginTop: 4 }}>{stage.name}</div>
            </div>
          </div>

          {/* progress bar */}
          {stage.next && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Progress to next stage: {progressPercent}%</div>
              <div style={{ background: "#eee", height: 10, borderRadius: 999, marginTop: 6 }}>
                <div style={{ width: `${progressPercent}%`, height: "100%", background: "#ffb74d", borderRadius: 999 }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => { fetchLatestEmotion(); fetchProfile(); }} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "#4caf50", color: "white" }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Other students' streaks */}
      <div style={{ marginTop: 12 }}>
        <h4 style={{ marginBottom: 8 }}>Other students' streaks</h4>
        <div style={{ background: "#fff", padding: 10, borderRadius: 10 }}>
          {otherStudents.length === 0 ? (
            <div style={{ color: "#666" }}>No students found.</div>
          ) : (
            otherStudents.map((s) => (
              <div key={s.uid} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f2f2f2" }}>
                <div style={{ fontSize: 14 }}>{s.email ?? "anonymous"}</div>
                <div style={{ fontWeight: 700 }}>{s.streak ?? 0}d</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RVProfile;
