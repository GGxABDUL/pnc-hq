// src/pages/login.tsx
import React from "react";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const Login: React.FC = () => {
  const auth = getAuth();
  const db = getFirestore();

  // ✅ Temporary test email for this session
  const TEST_EMAIL = "ahmirhafy@gmail.com";

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      // Force account chooser and allow any account temporarily
      provider.setCustomParameters({
        hd: "", // remove domain restriction for trial
        prompt: "select_account", // forces account chooser
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) throw new Error("No email found in Google account.");

      let role: "student" | "teacher";

      // ✅ Temporary override for testing with Gmail
      if (user.email === TEST_EMAIL) {
        role = "teacher";
        console.log("✅ Test mode: treating ahmirhafy@gmail.com as teacher");
      } else {
        // Normal strict domain check
        if (!user.email.endsWith("@moe-dl.edu.my")) {
          await signOut(auth);
          alert("Only MOE accounts (@moe-dl.edu.my) are allowed.");
          return;
        }

        // Role by prefix
        if (user.email.includes("g-")) role = "teacher";
        else if (user.email.includes("m-")) role = "student";
        else {
          await signOut(auth);
          alert("MOE account must start with m- (student) or g- (teacher).");
          return;
        }
      }

      // ✅ Save user in Firestore with default interest
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: role,
          interest: {
            age: "N/A",
            gender: "N/A",
            hobby: "N/A",
            sport: "N/A",
            subject: "N/A",
            food: "N/A",
            drink: "N/A",
          },
        },
        { merge: true }
      );

      console.log("✅ Login successful:", user.email, "role:", role);
      alert(`Welcome ${user.displayName}! You are logged in as a ${role}.`);

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
