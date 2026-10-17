import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch directly from your live Render backend
    fetch("https://nutrigo-ai-backend.onrender.com/")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setStatus(data.status);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Failed to connect to backend API");
        setStatus("");
      });
  }, []);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">NutriGo AI Dashboard</h1>
      <p className="text-lg">
        <strong>API status:</strong>{" "}
        {error ? (
          <span className="text-red-500 font-semibold">{error}</span>
        ) : (
          <span className="text-green-600 font-semibold">{status}</span>
        )}
      </p>
    </div>
  );
}