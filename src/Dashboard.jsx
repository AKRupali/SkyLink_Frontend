// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Example: Fetch logged-in user details using stored token
    const token = localStorage.getItem("token");

    if (token) {
      axios
        .get("http://localhost:8081/api/users/1", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data))
        .catch((err) => console.error(err));
    }
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to Skylink Dashboard 🚀</h1>
      {user ? (
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      ) : (
        <p>Loading user details...</p>
      )}
    </div>
  );
}

export default Dashboard;
