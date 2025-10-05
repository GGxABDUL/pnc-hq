import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  setDoc,
  Unsubscribe,
} from "firebase/firestore";

interface RVProfileProps {
  user: any;
  role: "student" | "teacher" | null;
  studentUid?: string;
}

interface UserProfile {
  name?: string;
  email?: string;
  role?: "student" | "teacher" | null;
  interest?: Record<string, any> | null;
  streak?: number;
  [k: string]: any;
}

type DailyEntry = {
  id: string;
  type: string;
  value?: any;
  hours?: number;
  timestamp?: any;
};

const interestKeys = [
  "age",
  "gender",
  "hobby",
  "sport",
  "subject",
  "food",
  "drink",
];

const RVProfile: React.FC<RVProfileProps> = ({ user, role, studentUid }) => {
  const uidToLoad = studentUid ?? user?.uid;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [daily, setDaily] = useState<DailyEntry[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing states
  const [editing, setEditing] = useState(false);
  const [editInterest, setEditInterest] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uidToLoad) return;

    setLoading(true);
    let unsubProfile: Unsubscribe | null = null;
    let unsubDaily: Unsubscribe | null = null;
    let unsubLogs: Unsubscribe | null = null;

    const userRef = doc(db, "users", uidToLoad);
    unsubProfile = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          const fixedInterest: Record<string, string> = {};
          for (const key of interestKeys) {
            fixedInterest[key] = data.interest?.[key] ?? "—";
          }
          data.interest = fixedInterest;
          setProfile(data);

          if (!editing) setEditInterest(fixedInterest);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot user error:", err);
        setLoading(false);
      }
    );

    const dailyQ = query(
      collection(db, "daily"),
      where("uid", "==", uidToLoad),
      orderBy("timestamp", "desc")
    );
    unsubDaily = onSnapshot(dailyQ, (snap) => {
      const arr: DailyEntry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setDaily(arr);
    });

    const logsQ = query(
      collection(db, "logs"),
      where("uid", "==", uidToLoad),
      orderBy("timestamp", "desc")
    );
    unsubLogs = onSnapshot(logsQ, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setLogs(arr);
    });

    return () => {
      unsubProfile && unsubProfile();
      unsubDaily && unsubDaily();
      unsubLogs && unsubLogs();
    };
  }, [uidToLoad, editing]);

  const handleInterestChange = (key: string, value: string) => {
    setEditInterest((p) => ({ ...p, [key]: value }));
  };

  const handleSaveInterest = async () => {
    if (!uidToLoad) return;

    const changed = Object.keys(editInterest).some((k) => {
      const original = profile?.interest?.[k] ?? "";
      return String(original) !== String(editInterest[k]);
    });
    if (!changed) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const ref = doc(db, "users", uidToLoad);
      setProfile((prev) => (prev ? { ...prev, interest: editInterest } : prev));
      await setDoc(ref, { interest: editInterest }, { merge: true });

      console.log("✅ Interests saved to Firestore:", editInterest);
      setEditing(false);
    } catch (err: any) {
      console.error("❌ Error saving interest:", err);
      alert("Failed to save interest. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (t: any) => {
    try {
      return t?.toDate ? t.toDate().toLocaleString() : new Date(t).toLocaleString();
    } catch {
      return "—";
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profile) return <p>No profile found.</p>;

  const canEdit = auth.currentUser?.uid === uidToLoad;

  return (
    <div style={{ padding: 12 }}>
      <h3>{studentUid ? "Student Profile" : "Your Profile"}</h3>
      <p><strong>Name:</strong> {profile.name ?? user?.displayName ?? "—"}</p>
      <p><strong>Email:</strong> {profile.email ?? user?.email ?? "—"}</p>
      <p><strong>Role:</strong> {profile.role ?? role ?? "—"}</p>

      <h4>Interests</h4>
      {!editing ? (
        <>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {interestKeys.map((key) => (
              <li key={key} style={{ marginBottom: 4 }}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                {profile.interest?.[key] ?? "—"}
              </li>
            ))}
          </ul>
          {canEdit && (
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setEditing(true)}>Edit Interests</button>
            </div>
          )}
        </>
      ) : (
        <>
          {interestKeys.map((key) => (
            <div key={key} style={{ marginBottom: 8 }}>
              <label>
                {key.charAt(0).toUpperCase() + key.slice(1)}:
                <input
                  type="text"
                  value={editInterest[key] ?? ""}
                  onChange={(e) => handleInterestChange(key, e.target.value)}
                  style={{ width: "100%", marginTop: 6 }}
                />
              </label>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSaveInterest} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditInterest(profile.interest ?? {});
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* ===== Improved Log Layout ===== */}
      <h4 style={{ marginTop: 16 }}>Recent Logs</h4>
      {daily.length === 0 ? (
        <p>No daily logs yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {daily.map((d) => (
            <div
              key={d.id}
              style={{
                padding: "8px",
                border: "1px solid #eee",
                borderRadius: "6px",
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: "12px", color: "#777", marginBottom: "4px" }}>
                {formatTime(d.timestamp)}
              </div>
              <div style={{ fontSize: "14px" }}>
                {d.type === "emotion"
                  ? `Emotion: ${d.value}`
                  : d.type === "sleep"
                  ? `Sleep: ${d.hours ?? d.value} hours`
                  : `${d.type}: ${JSON.stringify(d.value)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      <h4 style={{ marginTop: 16 }}>Journal Entries</h4>
      {logs.length === 0 ? (
        <p>No journal entries yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                padding: "8px",
                border: "1px solid #eee",
                borderRadius: "6px",
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: "12px", color: "#777", marginBottom: "4px" }}>
                {formatTime(log.timestamp)}
              </div>
              <div>
                <strong style={{ color: log.vibe === "positive" ? "#2e7d32" : "#c62828" }}>
                  {log.vibe}
                </strong>
                : {log.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RVProfile;
