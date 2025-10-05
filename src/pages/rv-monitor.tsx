// src/pages/rv-monitor.tsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import RVProfile from "./rv-profile";

interface Student {
  uid: string;
  name?: string;
  email?: string;
  role?: "student" | "teacher";
  [k: string]: any;
}

const RVMonitor: React.FC<{ user: any; role: "teacher" | "student" | null }> = ({ user, role }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentUid, setSelectedStudentUid] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Student[] = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
      setStudents(arr);
    }, (err) => {
      console.error("students onSnapshot error", err);
    });
    return () => unsub();
  }, []);

  if (selectedStudentUid) {
    return (
      <div>
        <button onClick={() => setSelectedStudentUid(null)}>← Back to Student List</button>
        <RVProfile user={user} role={role as any} studentUid={selectedStudentUid} />
      </div>
    );
  }

  return (
    <div>
      <h2>RV Monitor (Teacher)</h2>
      {students.length === 0 ? <p>No students found.</p> : (
        <ul>
          {students.map((s) => (
            <li key={s.uid} style={{ marginBottom: 10 }}>
              <strong>{s.name ?? s.email ?? "Unnamed"}</strong> ({s.email}){" "}
              <button onClick={() => setSelectedStudentUid(s.uid)}>View</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RVMonitor;
