import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://nutrigo-ai-backend.onrender.com').replace(/\/$/, '') + '/api';

export default function ScanLabelModal({ currentUserEmail, onCartUpdated }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Please sign in again.');
      // 1. Send image to Gemini OCR Endpoint
      const formData = new FormData();
      formData.append("file", file);

      const ocrResponse = await fetch(`${API_BASE_URL}/ai/scan-label`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!ocrResponse.ok) throw new Error("Failed to scan label");
      const scannedData = await ocrResponse.json();

      // 2. Map OCR JSON to Cart POST payload
      const cartPayload = {
        user_email: currentUserEmail || "user@example.com",
        item_name: scannedData.item_name || "Scanned Item",
        calories: scannedData.calories || 0,
        protein: scannedData.protein || 0,
        carbs: scannedData.carbs || 0,
        fat: scannedData.fat || 0,
        quantity: 1
      };

      // 3. Post automatically to /api/cart
      const cartResponse = await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cartPayload),
      });

      if (cartResponse.ok) {
        alert("Item scanned and added to cart!");
        if (onCartUpdated) onCartUpdated(); // Refresh cart list UI
      } else {
        throw new Error("Failed to add item to cart");
      }
    } catch (err) {
      console.error(err);
      alert("Error scanning image or adding to cart.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scan-upload-container my-4">
      <label className="upload-btn cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
        {loading ? "Scanning Label..." : "📷 Scan Nutrition Label"}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          disabled={loading}
          hidden 
        />
      </label>
    </div>
  );
}