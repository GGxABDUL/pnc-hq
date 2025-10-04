import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from "firebase/firestore";

interface RVProfileProps {
  user: any;
  role: "student" | "teacher" | null;
}

interface UserProfile {
  name?: string;
  email?: string;
  role?: "student" | "teacher" | null;
  interest?: {
    age?: string;
    gender?: string;
    hobby?: string;
    sport?: string;
    subject?: string;
    food?: string;
    drink?: string;
  } | null;
  streak?: number;
  lastOpened?: any;
  [k: string]: any;
}

const formatStatus = (value: number | null) =>
  value === null ? "Unknown" : value <= 2 ? "RED" : "GREEN";

const chickenStage = (streak: number) => {
  if (streak < 3) return { name: "Egg", emoji: "🥚", next: 3 };
  if (streak < 7) return { name: "Hatching", emoji: "🐣", next: 7 };
  if (streak < 14) return { name: "Chick", emoji: "🐥", next: 14 };
  return { name: "Chicken", emoji: "🐔", next: null };
};

const percentToNext = (streak: number) => {
  const stage = chickenStage(streak);
  if (!stage.next) return 100;
  const prevThreshold =
    stage.name === "Egg" ? 0 : stage.name === "Hatching" ? 3 : 7;
  const range = stage.next - prevThreshold;
  return Math.round(
    Math.max(0, Math.min(1, (streak - prevThreshold) / range)) * 100
  );
};

const RVProfile: React.FC<RVProfileProps> = ({ user, role }) => {
  const uid = user?.uid;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestEmotion, setLatestEmotion] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 🟢 Real-time listener for user profile
  useEffect(() => {
    if (!uid) return;

    const unsub = onSnapshot(doc(db, "users", uid), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data as UserProfile);
      } else {
        // create new doc if missing
        const newData = {
          email: user.email ?? null,
          name: user.displayName ?? "Unknown",
          role: role ?? null,
          createdAt: Timestamp.now(),
        };
        await updateDoc(doc(db, "users", uid), newData).catch(() => {});
        setProfile(newData);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [uid, user, role]);

  // 🟢 Fetch latest emotion (cached or new)
  useEffect(() => {
    const fetchLatestEmotion = async () => {
      if (!uid) return;
      try {
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
          const ts =
            d.timestamp instanceof Timestamp
              ? d.timestamp
              : Timestamp.fromDate(new Date(d.timestamp));
          setLatestEmotion(typeof d.value === "number" ? d.value : parseInt(d.value) || null);
        } else {
          setLatestEmotion(null);
        }
      } catch (err) {
        console.error("fetchLatestEmotion error", err);
        setLatestEmotion(null);
      }
    };
    fetchLatestEmotion();
  }, [uid]);

  const streakNum = profile?.streak ?? 0;
  const stage = chickenStage(streakNum);
  const progressPercent = percentToNext(streakNum);
  const emotionStatus = formatStatus(latestEmotion);

  if (loading)
    return (
      <div style={{ padding: 12 }}>
        <h3>Profile</h3>
        <div>Loading…</div>
      </div>
    );

  return (
    <div style={{ padding: 12, fontFamily: "Inter, Arial, sans-serif" }}>
      <h3 style={{ marginTop: 0 }}>RV Profile</h3>

      <div
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 10,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, color: "#666" }}>Name</div>
            <div style={{ fontWeight: 700 }}>
              {profile?.name ?? user?.displayName ?? "—"}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>Email</div>
            <div style={{ fontWeight: 700 }}>
              {profile?.email ?? user?.email ?? "—"}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#666" }}>Role</div>
            <div style={{ fontWeight: 700 }}>
              {profile?.role ?? role ?? "—"}
            </div>
          </div>
        </div>

        <hr
          style={{
            margin: "12px 0",
            border: "none",
            borderTop: "1px solid #eee",
          }}
        />

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "#666" }}>Interests</div>
          <div style={{ lineHeight: 1.6, fontWeight: 600 }}>
            <div>Age: {profile?.interest?.age ?? "—"}</div>
            <div>Gender: {profile?.interest?.gender ?? "—"}</div>
            <div>Hobby: {profile?.interest?.hobby ?? "—"}</div>
            <div>Sport: {profile?.interest?.sport ?? "—"}</div>
            <div>Subject: {profile?.interest?.subject ?? "—"}</div>
            <div>Food: {profile?.interest?.food ?? "—"}</div>
            <div>Drink: {profile?.interest?.drink ?? "—"}</div>
          </div>
        </div>

        <hr style={{ margin: "12px 0", borderTop: "1px solid #eee" }} />

        <div>
          <div style={{ fontSize: 13, color: "#666" }}>Emotion status</div>
          <div style={{ fontWeight: 700 }}>
            {emotionStatus}
            {latestEmotion !== null ? ` (${latestEmotion}/5)` : ""}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: "#666" }}>Streak (days)</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{streakNum}</div>
          <div style={{ fontSize: 24 }}>{stage.emoji}</div>
          <div style={{ fontSize: 12 }}>{stage.name}</div>
          {stage.next && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12 }}>
                Progress to next stage: {progressPercent}%
              </div>
              <div
                style={{
                  background: "#eee",
                  height: 10,
                  borderRadius: 999,
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: "100%",
                    background: "#ffb74d",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RVProfile;
