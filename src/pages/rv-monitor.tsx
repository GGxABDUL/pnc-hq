import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase"; // adjust path if needed

// Match the profile schema we fixed earlier
interface UserProfile {
  uid: string;
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

interface RVMonitorProps {
  user: any; // Firebase User
  role: "student" | "teacher" | null;
}

const RVMonitor: React.FC<RVMonitorProps> = ({ user, role }) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "teacher") return;

    const fetchStudents = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "student"));
        const snapshot = await getDocs(q);

        const data: UserProfile[] = snapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as UserProfile[];

        setStudents(data);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [role]);

  if (role !== "teacher") {
    return <div>Access denied. Only teachers can view this page.</div>;
  }

  if (loading) {
    return <div>Loading student data...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Student Monitor Dashboard</h2>
      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Email</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Age</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Hobby</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Streak</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Last Opened</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.uid}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{s.email}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{s.interest?.age ?? "-"}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{s.interest?.hobby ?? "-"}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{s.streak ?? 0}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {s.lastOpened ? new Date(s.lastOpened.seconds * 1000).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RVMonitor;
