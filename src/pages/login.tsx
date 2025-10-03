// src/pages/login.tsx
import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const Login: React.FC = () => {
  const auth = getAuth();
  const db = getFirestore();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      // Optional: restrict login to MOE domain at Google popup level
      provider.setCustomParameters({
        hd: "moe-dl.edu.my",
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("No email found in Google account.");
      }

      // ✅ Strict domain check
      if (!user.email.endsWith("@moe-dl.edu.my")) {
        await signOut(auth);
        alert("Only MOE accounts (@moe-dl.edu.my) are allowed.");
        return;
      }

      // ✅ Role check by prefix
      let role: "student" | "teacher";
      if (user.email.includes("g-")) {
        role = "teacher";
      } else if (user.email.includes("m-")) {
        role = "student";
      } else {
        await signOut(auth);
        alert("MOE account must start with m- (student) or g- (teacher).");
        return;
      }

      // ✅ Save user in Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: role,
        },
        { merge: true }
      );

      console.log("✅ Login successful:", user.email, "role:", role);
    } catch (err) {
      console.error("❌ Login failed:", err);
      alert("Login failed: Please check Firebase Auth configuration and allowed domains.");
    }
  };

  return (
    <div
      style={{
        width: "400px",
        height: "450px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        border: "1px solid #ccc",
      }}
    >
      <h2>Welcome to RELEVARE</h2>
      <p>Please log in with your MOE Google account</p>
      <button
        onClick={handleLogin}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
