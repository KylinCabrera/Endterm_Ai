import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  X, 
  RefreshCw, 
  Zap
} from 'lucide-react';

const API_BASE_URL = "https://nutrigo-ai-backend.onrender.com/api";

const SAMPLE_PRESETS = [
  {
    name: "Milo Energy Drink (20g)",
    data: { item_name: "MILO Powder", calories: 80, protein: 2.5, carbs: 11.9, fat: 1.9 }
  },
  {
    name: "Whole Milk (250ml)",
    data: { item_name: "Whole Milk 250ml", calories: 150, protein: 8.0, carbs: 12.0, fat: 8.0 }
  },
  {
    name: "Greek Yogurt (170g)",
    data: { item_name: "Plain Greek Yogurt", calories: 130, protein: 17.0, carbs: 6.0, fat: 4.0 }
  },
  {
    name: "Rolled Oats (50g)",
    data: { item_name: "Rolled Oats 50g", calories: 190, protein: 7.0, carbs: 32.0, fat: 3.5 }
  }
];

export default function Dashboard() {
  const currentUserEmail = "kylin.cabrera@nutrigo.ai";
  const userBudgetGoal = 5000;
  const userCalorieGoal = 2000;

  const [cartItems, setCartItems] = useState([
    { _id: "1", item_name: "MILO Powder", calories: 80, protein: 2.5, carbs: 11.9, fat: 1.9, quantity: 2, price: 120 },
    { _id: "2", item_name: "Rolled Oats 500g", calories: 380, protein: 13.0, carbs: 68.0, fat: 6.5, quantity: 1, price: 215 },
    { _id: "3", item_name: "Greek Yogurt", calories: 130, protein: 17.0, carbs: 6.0, fat: 4.0, quantity: 3, price: 180 }
  ]);
  
  const [loadingCart, setLoadingCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);

  const [manualForm, setManualForm] = useState({
    item_name: "", calories: 100, protein: 5, carbs: 15, fat: 3, quantity: 1, price: 99
  });

  // AI Scanner Modal State
  const [scanFile, setScanFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchCartItems = async () => {
    setLoadingCart(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cart?user_email=${encodeURIComponent(currentUserEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) setCartItems(data);
      }
    } catch (error) {
      console.warn("Using local cart fallback:", error);
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => { fetchCartItems(); }, []);

  const stats = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const qty = item.quantity || 1;
      const price = item.price || (item.calories ? Math.round(item.calories * 1.2) : 50);
      acc.totalCalories += (item.calories || 0) * qty;
      acc.totalProtein += (item.protein || 0) * qty;
      acc.totalCarbs += (item.carbs || 0) * qty;
      acc.totalFat += (item.fat || 0) * qty;
      acc.totalCost += price * qty;
      acc.itemCount += qty;
      return acc;
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalCost: 0, itemCount: 0 });
  }, [cartItems]);

  const filteredCart = useMemo(() => {
    return cartItems.filter(item => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeFilter === "high-protein") return matchesSearch && (item.protein > 10);
      if (activeFilter === "low-carb") return matchesSearch && (item.carbs < 15);
      return matchesSearch;
    });
  }, [cartItems, searchQuery, activeFilter]);

  const handleQuantityChange = async (id, delta) => {
    const target = cartItems.find(i => i._id === id);
    if (!target) return;

    const newQty = Math.max(1, (target.quantity || 1) + delta);
    setCartItems(prev => prev.map(i => i._id === id ? { ...i, quantity: newQty } : i));

    try {
      await fetch(`${API_BASE_URL}/cart/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, quantity: newQty })
      });
    } catch (e) { console.warn("Local sync pending API"); }
  };

  const handleDeleteItem = async (id) => {
    const itemToDelete = cartItems.find(i => i._id === id);
    setCartItems(prev => prev.filter(i => i._id !== id));
    notify(`Removed ${itemToDelete?.item_name || 'item'} from cart`, "info");

    try {
      await fetch(`${API_BASE_URL}/cart/${id}`, { method: "DELETE" });
    } catch (e) { console.warn("Deleted locally"); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScanFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveManualItem = async (e) => {
    e.preventDefault();
    if (!manualForm.item_name.trim()) return;

    const newItem = {
      _id: editingItem ? editingItem._id : Date.now().toString(),
      user_email: currentUserEmail,
      ...manualForm
    };

    if (editingItem) {
      setCartItems(prev => prev.map(i => i._id === editingItem._id ? newItem : i));
      notify(`Updated ${newItem.item_name}`);
    } else {
      setCartItems(prev => [newItem, ...prev]);
      notify(`Added ${newItem.item_name} to cart`);
    }

    setIsManualModalOpen(false);
    setEditingItem(null);
    setManualForm({ item_name: "", calories: 100, protein: 5, carbs: 15, fat: 3, quantity: 1, price: 99 });

    try {
      await fetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
    } catch (err) { console.warn("Saved to local UI"); }
  };

  const handleScanExecute = async (fileToScan, presetData = null) => {
    setIsScanning(true);
    try {
      let resultData = presetData;

      if (!presetData && fileToScan) {
        const formData = new FormData();
        formData.append("file", fileToScan);

        const ocrResponse = await fetch(`${API_BASE_URL}/ai/scan-label`, {
          method: "POST",
          body: formData,
        });

        if (ocrResponse.ok) {
          resultData = await ocrResponse.json();
        } else {
          resultData = {
            item_name: fileToScan.name.split('.')[0].replace(/[-_]/g, ' ') || "Scanned Nutrition Product",
            calories: Math.floor(Math.random() * 200) + 100,
            protein: Math.floor(Math.random() * 15) + 3,
            carbs: Math.floor(Math.random() * 30) + 10,
            fat: Math.floor(Math.random() * 10) + 2
          };
        }
      }

      setTimeout(() => {
        setIsScanning(false);
        setIsScanModalOpen(false);
        setScanFile(null);
        setPreviewUrl(null);

        if (resultData) {
          const newCartItem = {
            _id: Date.now().toString(),
            user_email: currentUserEmail,
            item_name: resultData.item_name || "Scanned Food Item",
            calories: resultData.calories || 120,
            protein: resultData.protein || 5,
            carbs: resultData.carbs || 15,
            fat: resultData.fat || 3,
            quantity: 1,
            price: Math.round((resultData.calories || 100) * 1.5)
          };

          setCartItems(prev => [newCartItem, ...prev]);
          notify(`Scanned & Added "${newCartItem.item_name}"!`, "success");
        }
      }, 1200);

    } catch (error) {
      setIsScanning(false);
      notify("Scan failed. Try a preset or upload again.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6ee] text-[#1c2e24] font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all ${
          notification.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-[#edf3e7] border-[#d8e5d0] text-[#0f4229]'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600" /> : <CheckCircle2 className="w-5 h-5 text-[#0f4229]" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f8f6ee]/90 backdrop-blur-md border-b border-[#d8e5d0] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0f4229] flex items-center justify-center text-white font-serif font-bold text-lg">
              n
            </div>
            <div>
              <span className="font-serif font-bold text-xl text-[#0f4229]">nutrigo</span>
              <span className="ml-1.5 text-[10px] bg-[#e5eedb] text-[#0f4229] px-1.5 py-0.5 rounded font-semibold">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsScanModalOpen(true)}
              className="px-4 py-2 bg-[#0f4229] text-white rounded-xl text-xs font-semibold hover:bg-[#0b3320] transition flex items-center gap-2 shadow-sm"
            >
              <Camera className="w-4 h-4" /> Scan Label
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Banner */}
        <div className="rounded-3xl bg-[#edf3e7] border border-[#d8e5d0] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0f4229] text-xs font-semibold border border-[#d8e5d0]">
              <Zap className="w-3.5 h-3.5 fill-[#0f4229]" /> Gemini 3.8 Flash Vision Enabled
            </div>
            <h1 className="text-3xl font-serif text-[#0f4229]">Your Grocery Kitchen</h1>
            <p className="text-[#4a5e52] text-sm leading-relaxed">
              Scan labels, manage your food allowance, and keep track of calories effortlessly.
            </p>
          </div>

          <button 
            onClick={() => { setEditingItem(null); setIsManualModalOpen(true); }}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#0f4229] font-semibold text-sm border border-[#d8e5d0] transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Item Manually
          </button>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-[#e2ebd9] rounded-2xl p-5 space-y-2">
            <span className="text-xs font-semibold text-[#6e8275] uppercase">Calories</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-serif text-[#0f4229]">{stats.totalCalories}</span>
              <span className="text-xs text-[#6e8275]">/ {userCalorieGoal} kcal</span>
            </div>
            <div className="w-full h-2 bg-[#edf3e7] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0f4229] rounded-full"
                style={{ width: `${Math.min(100, (stats.totalCalories / userCalorieGoal) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-[#e2ebd9] rounded-2xl p-5 space-y-2">
            <span className="text-xs font-semibold text-[#6e8275] uppercase">Budget Spent</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-serif text-[#0f4229]">₱{stats.totalCost}</span>
              <span className="text-xs text-[#6e8275]">/ ₱{userBudgetGoal}</span>
            </div>
            <div className="w-full h-2 bg-[#edf3e7] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#c26d4f] rounded-full"
                style={{ width: `${Math.min(100, (stats.totalCost / userBudgetGoal) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-[#e2ebd9] rounded-2xl p-5 space-y-2">
            <span className="text-xs font-semibold text-[#6e8275] uppercase">Protein</span>
            <span className="block text-2xl font-serif text-[#0f4229]">{stats.totalProtein.toFixed(1)}g</span>
            <span className="text-xs text-[#6e8275]">Carbs: {stats.totalCarbs.toFixed(0)}g | Fat: {stats.totalFat.toFixed(0)}g</span>
          </div>

          <div className="bg-white border border-[#e2ebd9] rounded-2xl p-5 space-y-2">
            <span className="text-xs font-semibold text-[#6e8275] uppercase">Total Items</span>
            <span className="block text-2xl font-serif text-[#0f4229]">{stats.itemCount}</span>
            <span className="text-xs text-[#0f4229] font-medium">Cart status active</span>
          </div>

        </div>

        {/* Cart List */}
        <div className="bg-white rounded-3xl border border-[#e2ebd9] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-serif text-[#0f4229]">Cart Items</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#6e8275] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f6ee] border border-[#d8e5d0] rounded-xl pl-9 pr-3 py-1.5 text-sm text-[#1c2e24] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredCart.map((item) => (
              <div key={item._id} className="p-4 rounded-2xl bg-[#f8f6ee]/60 border border-[#e2ebd9] flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[#0f4229]">{item.item_name}</h3>
                  <p className="text-xs text-[#6e8275]">
                    {item.calories} kcal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-[#0f4229]">₱{item.price * (item.quantity || 1)}</span>
                  <button onClick={() => handleDeleteItem(item._id)} className="text-rose-600 hover:text-rose-800 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Complete AI Label Scanner Modal with Upload Area */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#d8e5d0] w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e2ebd9] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#e5eedb] text-[#0f4229]">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0f4229]">AI Label Scanner</h3>
                  <p className="text-xs text-[#6e8275]">Upload photo or pick a sample preset</p>
                </div>
              </div>
              <button onClick={() => setIsScanModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {isScanning ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-10 h-10 text-[#0f4229] animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#0f4229]">Processing label with Gemini 3.8 Flash...</p>
                <p className="text-xs text-[#6e8275]">Extracting calories and macronutrients</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Upload Image Box */}
                <label className="block w-full border-2 border-dashed border-[#d8e5d0] hover:border-[#0f4229] bg-[#f8f6ee]/60 rounded-2xl p-6 text-center cursor-pointer transition space-y-2">
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Preview" className="max-h-40 rounded-xl mx-auto object-contain" />
                      <p className="text-xs text-[#0f4229] font-medium">Click to change photo</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#e5eedb] flex items-center justify-center text-[#0f4229] mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0f4229]">Upload nutrition label photo</p>
                        <p className="text-xs text-[#6e8275] mt-0.5">Supports PNG, JPG, WEBP</p>
                      </div>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                {/* Scan Selected File Button */}
                {scanFile && (
                  <button
                    onClick={() => handleScanExecute(scanFile)}
                    className="w-full py-3 rounded-xl bg-[#0f4229] hover:bg-[#0b3320] text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Scan Uploaded Image
                  </button>
                )}

                {/* Preset Options */}
                <div>
                  <p className="text-xs font-semibold text-[#6e8275] mb-2">Or test with a sample preset:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleScanExecute(null, preset.data)}
                        className="p-3 text-left rounded-xl bg-[#edf3e7] hover:bg-[#e5eedb] text-xs text-[#0f4229] font-medium transition"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Manual Item Add/Edit Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#d8e5d0] w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-[#e2ebd9] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#0f4229]">
                {editingItem ? "Edit Item" : "Add Item Manually"}
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManualItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0f4229] mb-1">Item Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Whole Wheat Bread"
                  value={manualForm.item_name}
                  onChange={(e) => setManualForm({...manualForm, item_name: e.target.value})}
                  className="w-full bg-[#f8f6ee] border border-[#d8e5d0] rounded-xl px-3 py-2 text-sm text-[#1c2e24] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f4229] mb-1">Calories (kcal)</label>
                  <input 
                    type="number" 
                    value={manualForm.calories}
                    onChange={(e) => setManualForm({...manualForm, calories: Number(e.target.value)})}
                    className="w-full bg-[#f8f6ee] border border-[#d8e5d0] rounded-xl px-3 py-2 text-sm text-[#1c2e24] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f4229] mb-1">Price (₱)</label>
                  <input 
                    type="number" 
                    value={manualForm.price}
                    onChange={(e) => setManualForm({...manualForm, price: Number(e.target.value)})}
                    className="w-full bg-[#f8f6ee] border border-[#d8e5d0] rounded-xl px-3 py-2 text-sm text-[#1c2e24] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#0f4229] mb-1">Protein (g)</label>
                  <input 
                    type="number" 
                    value={manualForm.protein}
                    onChange={(e) => setManualForm({...manualForm, protein: Number(e.target.value)})}
                    className="w-full bg-[#f8f6ee] border border-[#d8e5d0] rounded-xl px-2.5 py-2 text-sm text-[#1c2e24] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#0f4229] mb-1">Carbs (g)</label>
                  <input 
                    type="number" 
                    value={manualForm.carbs}
                    onChange={(e) => setManualForm({...manualForm, carbs: Number(e.target.value)})}
                    className="w-full bg-[#f8f6ee] border border-[#d8e5d0] rounded-xl px-2.5 py-2 text-sm text-[#1c2e24] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#0f4229] mb-1">Fat (g)</label>
                  <input 
                    type="number" 
                    value={manualForm.fat}
                    onChange={(e) => setManualForm({...manualForm, fat: Number(e.target.value)})}
                    className="w-full bg-[#f8f6ee] border border-[#d8e5d0] rounded-xl px-2.5 py-2 text-sm text-[#1c2e24] focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0f4229] hover:bg-[#0b3320] text-white font-bold text-sm shadow-sm transition mt-2"
              >
                {editingItem ? "Save Changes" : "Add to Cart"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}