// src/pages/rv-stats.tsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const calcPercent = (num: number) => Math.round(num);

const RVStats: React.FC = () => {
  const uid = auth.currentUser?.uid;
  const [emotionPercent, setEmotionPercent] = useState<number | null>(null);
  const [sleepPercent, setSleepPercent] = useState<number | null>(null);
  const [streakPercent, setStreakPercent] = useState<number | null>(null);
  const [schedulePercent, setSchedulePercent] = useState<number | null>(null);
  const [happyJournalPercent, setHappyJournalPercent] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!uid) return;

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);

      // === Emotion ===
      const emoQ = query(collection(db, "daily"), where("uid", "==", uid), where("type", "==", "emotion"));
      const emoSnap = await getDocs(emoQ);
      const emos: number[] = emoSnap.docs
        .map(d => d.data() as any)
        .filter(d => {
          const t = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
          return t >= twoWeeksAgo;
        })
        .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0))
        .map(d => d.value);
      const emoAvg = emos.length ? emos.reduce((a, b) => a + b, 0) / emos.length : 3;
      setEmotionPercent(calcPercent((emoAvg / 5) * 100));

      // === Sleep ===
      const sleepQ = query(collection(db, "daily"), where("uid", "==", uid), where("type", "==", "sleep"));
      const sleepSnap = await getDocs(sleepQ);
      const sleeps: number[] = sleepSnap.docs
        .map(d => d.data() as any)
        .filter(d => {
          const t = d.timestamp?.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
          return t >= twoWeeksAgo;
        })
        .map(d => d.hours);
      const sleepAvg = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : 7;
      setSleepPercent(calcPercent(Math.min((sleepAvg / 7) * 100, 200)));

      // === Streak ===
      const last7 = new Date();
      last7.setDate(last7.getDate() - 6);
      const allDailyQ = query(collection(db, "daily"), where("uid", "==", uid));
      const allDailySnap = await getDocs(allDailyQ);
      const usedDaysSet = new Set<string>();
      allDailySnap.forEach(d => {
        const data = d.data() as any;
        const dt = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (dt >= last7) usedDaysSet.add(dt.toDateString());
      });
      setStreakPercent(calcPercent((usedDaysSet.size / 7) * 100));

      // === Schedule ===
      const schedQ = query(collection(db, "schedules"), where("uid", "==", uid));
      const schedSnap = await getDocs(schedQ);
      let totalHours = 0;
      schedSnap.forEach(d => {
        const data = d.data() as any;
        const dt = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (dt >= twoWeeksAgo) totalHours += data.hours || 0;
      });
      setSchedulePercent(calcPercent(Math.min((totalHours / 15) * 100, 200)));

      // === Happy Journal ===
      const logsQ = query(collection(db, "logs"), where("uid", "==", uid));
      const logsSnap = await getDocs(logsQ);
      let total = 0, pos = 0;
      logsSnap.forEach(d => {
        const data = d.data() as any;
        const dt = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (dt >= twoWeeksAgo) {
          total++;
          if (data.vibe === "positive") pos++;
        }
      });
      setHappyJournalPercent(total ? Math.round((pos / total) * 100) : 0);
    };

    fetch();
  }, [uid]);

  return (
    <div>
      <h3>RV Stats (last 2 weeks)</h3>
      <div><strong>Emotion</strong>: {emotionPercent ?? "—"}%</div>
      <div><strong>Sleep</strong>: {sleepPercent ?? "—"}%</div>
      <div><strong>Streaks</strong>: {streakPercent ?? "—"}%</div>
      <div><strong>Scheduled sessions</strong>: {schedulePercent ?? "—"}%</div>
      <div><strong>Happy Journal</strong>: {happyJournalPercent ?? "—"}%</div>
    </div>
  );
};

export default RVStats;
