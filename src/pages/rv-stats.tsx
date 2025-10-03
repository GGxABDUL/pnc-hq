// src/pages/rv-stats.tsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

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
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13); // 14 days including today

      // emotion: average of daily emotion values (1-5) over 14 days -> % formula = (value/5)*100
      const emoQ = query(collection(db, "daily"), where("uid", "==", uid), where("type", "==", "emotion"), orderBy("timestamp", "asc"));
      const emoSnap = await getDocs(emoQ);
      const emos: number[] = [];
      emoSnap.forEach(d => {
        const data = d.data() as any;
        if (data.timestamp?.toDate) {
          const dt = data.timestamp.toDate();
          if (dt >= twoWeeksAgo) emos.push(data.value);
        } else {
          emos.push(data.value);
        }
      });
      const emoAvg = emos.length ? emos.reduce((a,b)=>a+b,0)/emos.length : 3; // default neutral
      setEmotionPercent(calcPercent((emoAvg/5)*100));

      // sleep: average hours over 14 days, formula = totalHour/7 * 100 (cap at 100)
      const sleepQ = query(collection(db, "daily"), where("uid", "==", uid), where("type","==","sleep"), orderBy("timestamp","asc"));
      const sleepSnap = await getDocs(sleepQ);
      const sleeps: number[] = [];
      sleepSnap.forEach(d => {
        const data = d.data() as any;
        if (data.timestamp?.toDate) {
          const dt = data.timestamp.toDate();
          if (dt >= twoWeeksAgo) sleeps.push(data.hours);
        } else sleeps.push(data.hours);
      });
      const sleepAvg = sleeps.length ? (sleeps.reduce((a,b)=>a+b,0)/sleeps.length) : 7;
      setSleepPercent(calcPercent(Math.min((sleepAvg/7)*100, 200)));

      // streaks: total days used in a week /7 *100 -> compute last 7 days active days
      const last7 = new Date(); last7.setDate(last7.getDate()-6);
      const usedDaysSet = new Set<string>();
      const allDailyQ = query(collection(db, "daily"), where("uid","==",uid), orderBy("timestamp","asc"));
      const allDailySnap = await getDocs(allDailyQ);
      allDailySnap.forEach(d => {
        const data = d.data() as any;
        const dt = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
        if (dt >= last7) usedDaysSet.add(dt.toDateString());
      });
      const usedDaysCount = usedDaysSet.size;
      setStreakPercent(calcPercent((usedDaysCount/7)*100));

      // scheduled sessions: total hours used /15 *100 (cap)
      const schedQ = query(collection(db, "schedules"), where("uid","==",uid), orderBy("timestamp","asc"));
      const schedSnap = await getDocs(schedQ);
      let totalHours = 0;
      schedSnap.forEach(d => {
        const data = d.data() as any;
        // assume schedule doc has hours field
        if (data.timestamp?.toDate) {
          const dt = data.timestamp.toDate();
          if (dt >= twoWeeksAgo) totalHours += data.hours || 0;
        } else totalHours += data.hours || 0;
      });
      setSchedulePercent(calcPercent(Math.min((totalHours/15)*100, 200)));

      // happy journal: positive logs / total logs * 100
      const logsQ = query(collection(db, "logs"), where("uid","==",uid), orderBy("timestamp","asc"));
      const logsSnap = await getDocs(logsQ);
      let total = 0, pos=0;
      logsSnap.forEach(d => {
        const data = d.data() as any;
        if (data.timestamp?.toDate) {
          const dt = data.timestamp.toDate();
          if (dt >= twoWeeksAgo) {
            total++; if (data.vibe === "positive") pos++;
          }
        } else {
          total++; if (data.vibe === "positive") pos++;
        }
      });
      setHappyJournalPercent(total ? Math.round((pos/total)*100) : 0);
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
