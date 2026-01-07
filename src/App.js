import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  LayoutDashboard,
  Package,
  Settings,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  ShoppingCart,
  CalendarDays,
  History,
  Wine
} from 'lucide-react';
import logo from './bobbys-logo.png'; // Make sure this path is correct

// === YOUR FIREBASE CONFIG ===
const firebaseConfig = {
  apiKey: "AIzaSyDL7h0nWWE4YV_IMXO7_gupvf1QUZamHGU",
  authDomain: "bobbys-cafe.firebaseapp.com",
  databaseURL: "https://bobbys-cafe-default-rtdb.firebaseio.com",
  projectId: "bobbys-cafe",
  storageBucket: "bobbys-cafe.firebasestorage.app",
  messagingSenderId: "605393276080",
  appId: "1:605393276080:web:e62049aadf7940b5b23f75"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Define the new color palette
const colors = {
  primary: '#5D0E2A',   // Deep Burgundy from logo background
  secondary: '#F4EFE8', // Off-White/Cream from logo text
  accent: '#D4AF37',    // A complementary Gold/Cream for accents
  background: '#F9F6F2', // Very light cream for main background
  textDark: '#3E091C',  // Darker burgundy for text on light backgrounds
  textLight: '#F4EFE8', // Off-white for text on dark backgrounds
  success: '#2E7D32',   // Standard success green, tweaked slightly
  danger: '#C62828',    // Standard danger red, tweaked slightly
};

const CafeOrderingApp = () => {
  const [view, setView] = useState('orders');
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSuppliers(data.suppliers || []);
      setOrderHistory(data.history || {});
      setOrderQuantities(data.quantities || {});
      setLoading(false);
    });
  }, []);

  const saveToFirebase = (path, data) => {
    set(ref(db, `cafe_data/${path}`), data);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.background }}>
      <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.primary }} />
      <p className="mt-4 font-semibold" style={{ color: colors.textDark }}>Loading System...</p>
    </div>
  );

  return (
    <div className="min-h-screen font-sans pb-24" style={{ backgroundColor: colors.background, color: colors.textDark }}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 shadow-lg border-b-4" style={{ backgroundColor: colors.primary, borderColor: colors.accent }}>
        <div className="max-w-4xl mx-auto px-4 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 py-2">
            <img src={logo} alt="Bobby's Wine Bar Logo" className="h-12 w-auto" />
          </div>
          <div className="text-xs font-medium" style={{ color: colors.secondary }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto p-4">
        {view === 'orders' && (
          <OrdersView
            suppliers={suppliers}
            history={orderHistory}
            quantities={orderQuantities}
            onSave={saveToFirebase}
          />
        )}
        {view === 'history' && (
          <HistoryView
            suppliers={suppliers}
            history={orderHistory}
          />
        )}
        {view === 'admin' && (
          <AdminView
            suppliers={suppliers}
            onSave={(newList) => saveToFirebase('suppliers', newList)}
          />
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe" style={{ backgroundColor: colors.secondary, borderColor: colors.accent }}>
        <div className="max-w-4xl mx-auto flex justify-around p-2">
          <NavButton icon={ShoppingCart} label="Orders" active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={History} label="History" active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 min-w-[4rem] rounded-xl transition-all`}
    style={{
      color: active ? colors.primary : colors.textDark,
      backgroundColor: active ? colors.accent + '40' : 'transparent', // Add transparency to accent color for background
      fontWeight: active ? 'bold' : 'normal'
    }}
  >
    <Icon className={`w-6 h-6 mb-1 ${active ? 'fill-current' : ''}`} />
    <span className="text-[10px] uppercase tracking-wide">{label}</span>
  </button>
);

// === 1. ORDERS VIEW ===
const OrdersView = ({ suppliers, history, quantities, onSave }) => {
  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };
  const todayKey = getTodayKey();
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

  const todaysSuppliers = suppliers.filter(s => s.days && s.days.includes(dayName));

  const toggleStatus = (supplierId) => {
    const newHistory = { ...history };
    if (!newHistory[todayKey]) newHistory[todayKey] = {};
    newHistory[todayKey][supplierId] = !newHistory[todayKey][supplierId];
    onSave('history', newHistory);
  };

  const updateQty = (supplierId, prodId, val) => {
    const newQuantities = { ...quantities };
    if (!newQuantities[todayKey]) newQuantities[todayKey] = {};
    if (!newQuantities[todayKey][supplierId]) newQuantities[todayKey][supplierId] = {};
    newQuantities[todayKey][supplierId][prodId] = val;
    onSave('quantities', newQuantities);
  };

  if (todaysSuppliers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20" style={{ color: colors.textDark, opacity: 0.6 }}>
      <Wine className="w-16 h-16 mb-4" style={{ color: colors.primary }} />
      <h2 className="text-xl font-bold">No Orders Today</h2>
      <p className="text-sm">Enjoy the quiet day!</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {todaysSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];

        return (
          <div key={s.id} className={`rounded-2xl shadow-sm border-2 overflow-hidden transition-all`}
            style={{
              backgroundColor: colors.secondary,
              borderColor: isCompleted ? colors.success : colors.primary
            }}
          >
            {/* Supplier Header */}
            <div className={`p-4 flex justify-between items-center`}
              style={{
                backgroundColor: isCompleted ? colors.success + '20' : colors.secondary,
                borderBottom: `2px solid ${isCompleted ? colors.success : colors.primary}`
              }}
            >
              <div>
                <h3 className="font-black text-lg uppercase tracking-tight" style={{ color: colors.primary }}>{s.name}</h3>
                <p className="text-xs font-bold uppercase" style={{ color: colors.textDark, opacity: 0.7 }}>{s.items?.length || 0} Items</p>
              </div>
              <button
                onClick={() => toggleStatus(s.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 shadow-md`}
                style={{
                  backgroundColor: isCompleted ? colors.success : colors.primary,
                  color: colors.secondary,
                  boxShadow: isCompleted ? `0 4px 6px -1px ${colors.success}40` : `0 4px 6px -1px ${colors.primary}40`
                }}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                {isCompleted ? 'Done' : 'Mark Done'}
              </button>
            </div>

            {/* Product List */}
            <div className="divide-y" style={{ borderColor: colors.accent + '60' }}>
              {s.items?.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/50 transition-colors">
                  <div className="flex-1 pr-4">
                    <p className="font-bold" style={{ color: colors.textDark }}>{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: colors.primary + '20', color: colors.primary }}>Par: {item.par}</span>
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full h-12 text-center border-2 rounded-xl font-bold text-lg outline-none transition-all"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.accent,
                        color: colors.textDark,
                      }}
                      onFocus={(e) => e.target.style.borderColor = colors.primary}
                      onBlur={(e) => e.target.style.borderColor = colors.accent}
                      value={quantities[todayKey]?.[s.id]?.[item.id] || ''}
                      onChange={(e) => updateQty(s.id, item.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// === 2. HISTORY / MANAGER VIEW ===
const HistoryView = ({ suppliers, history }) => {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    };
  });

  return (
    <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ backgroundColor: colors.secondary, borderColor: colors.primary }}>
      <div className="p-4 border-b" style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary }}>
        <h2 className="font-bold uppercase tracking-wide text-sm" style={{ color: colors.primary }}>Order Compliance (Last 5 Days)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: colors.primary + '40' }}>
              <th className="p-4 text-left font-bold uppercase text-xs" style={{ color: colors.textDark, opacity: 0.7 }}>Supplier</th>
              {days.map(d => (
                <th key={d.key} className="p-4 text-center font-bold min-w-[80px]" style={{ color: colors.textDark }}>{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-white/50 transition-colors" style={{ borderColor: colors.primary + '20' }}>
                <td className="p-4 font-bold" style={{ color: colors.textDark }}>{s.name}</td>
                {days.map(d => {
                  const shouldOrder = s.days?.includes(d.dayName);
                  const isDone = history[d.key]?.[s.id];

                  if (!shouldOrder) return <td key={d.key} className="text-center" style={{ color: colors.textDark, opacity: 0.3 }}>-</td>;

                  return (
                    <td key={d.key} className="text-center">
                      {isDone ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: colors.success + '20', color: colors.success }}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: colors.danger + '20', color: colors.danger }}>
                          <Circle className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// === 3. ADMIN VIEW (FIXED FORM) ===
const AdminView = ({ suppliers, onSave }) => {
  const [mode, setMode] = useState('list');
  const [formData, setFormData] = useState(null);

  const startEdit = (supplier) => {
    setFormData(supplier ? { ...supplier } : {
      id: Date.now().toString(),
      name: '',
      days: [],
      items: []
    });
    setMode('form');
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this supplier permanently?")) {
      onSave(suppliers.filter(s => s.id !== id));
    }
  };

  if (mode === 'form') {
    return (
      <SupplierForm
        initialData={formData}
        onSave={(data) => {
          const isNew = !suppliers.find(s => s.id === data.id);
          const newList = isNew
            ? [...suppliers, data]
            : suppliers.map(s => s.id === data.id ? data : s);

          onSave(newList);
          setMode('list');
        }}
        onCancel={() => setMode('list')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold" style={{ color: colors.textDark }}>Suppliers ({suppliers.length})</h2>
        <button
          onClick={() => startEdit(null)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
          style={{ backgroundColor: colors.primary, color: colors.secondary, boxShadow: `0 4px 6px -1px ${colors.primary}40` }}
        >
          <Plus className="w-5 h-5" />
          <span>Add New</span>
        </button>
      </div>

      <div className="grid gap-3">
        {suppliers.map(s => (
          <div key={s.id} className="p-5 rounded-2xl shadow-sm border flex justify-between items-center group transition-colors"
            style={{ backgroundColor: colors.secondary, borderColor: colors.primary }}
          >
            <div>
              <h3 className="font-bold text-lg" style={{ color: colors.textDark }}>{s.name}</h3>
              <p className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: colors.textDark, opacity: 0.6 }}>
                {s.days?.length || 0} Days • {s.items?.length || 0} Products
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(s)} className="p-3 rounded-xl transition-all" style={{ color: colors.textDark, backgroundColor: colors.primary + '10' }}>
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-3 rounded-xl transition-all" style={{ color: colors.danger, backgroundColor: colors.danger + '10' }}>
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SupplierForm = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState(initialData);

  const toggleDay = (day) => {
    const currentDays = data.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setData({ ...data, days: newDays });
  };

  const updateItem = (idx, field, val) => {
    const newItems = [...(data.items || [])];
    newItems[idx][field] = val;
    setData({ ...data, items: newItems });
  };

  const addItem = () => {
    setData({ ...data, items: [...(data.items || []), { id: Date.now(), name: '', par: '' }] });
  };

  const removeItem = (idx) => {
    const newItems = [...(data.items || [])];
    newItems.splice(idx, 1);
    setData({ ...data, items: newItems });
  };

  return (
    <div className="rounded-2xl shadow-xl border overflow-hidden animate-in slide-in-from-bottom-10" style={{ backgroundColor: colors.secondary, borderColor: colors.primary }}>
      <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: colors.primary + '10', borderColor: colors.primary + '40' }}>
        <h3 className="font-bold" style={{ color: colors.primary }}>{initialData.name ? 'Edit Supplier' : 'New Supplier'}</h3>
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/50 transition-colors"><X className="w-5 h-5" style={{ color: colors.textDark, opacity: 0.6 }} /></button>
      </div>

      <div className="p-6 space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold uppercase mb-2" style={{ color: colors.textDark, opacity: 0.6 }}>Supplier Name</label>
          <input
            className="w-full p-4 border-2 rounded-xl font-bold text-lg outline-none transition-all"
            style={{ backgroundColor: colors.background, borderColor: colors.accent, color: colors.textDark }}
            onFocus={(e) => e.target.style.borderColor = colors.primary}
            onBlur={(e) => e.target.style.borderColor = colors.accent}
            placeholder="e.g. Vintner's Best"
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
          />
        </div>

        {/* Days Selector */}
        <div>
          <label className="block text-xs font-bold uppercase mb-2" style={{ color: colors.textDark, opacity: 0.6 }}>Delivery Days</label>
          <div className="flex flex-wrap gap-2">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-sm`}
                style={{
                  backgroundColor: data.days?.includes(day) ? colors.primary : colors.background,
                  color: data.days?.includes(day) ? colors.secondary : colors.textDark,
                  opacity: data.days?.includes(day) ? 1 : 0.7
                }}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Products List */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold uppercase" style={{ color: colors.textDark, opacity: 0.6 }}>Products</label>
            <button onClick={addItem} className="text-xs font-bold uppercase hover:underline" style={{ color: colors.primary }}>+ Add Item</button>
          </div>
          <div className="space-y-3">
            {(data.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="flex-1 p-3 border rounded-xl text-sm font-semibold outline-none transition-all"
                  style={{ backgroundColor: colors.background, borderColor: colors.accent, color: colors.textDark }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.accent}
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                />
                <input
                  type="number"
                  className="w-20 p-3 border rounded-xl text-sm font-semibold text-center outline-none transition-all"
                  style={{ backgroundColor: colors.background, borderColor: colors.accent, color: colors.textDark }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = colors.accent}
                  placeholder="Par"
                  value={item.par}
                  onChange={(e) => updateItem(idx, 'par', e.target.value)}
                />
                <button onClick={() => removeItem(idx)} className="p-3 rounded-xl transition-all" style={{ color: colors.danger, backgroundColor: colors.danger + '10' }}>
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {(data.items || []).length === 0 && (
              <div className="text-center p-8 border-2 border-dashed rounded-xl text-sm" style={{ borderColor: colors.accent, color: colors.textDark, opacity: 0.6 }}>
                No items yet. Click "+ Add Item" to start.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t flex gap-3" style={{ borderColor: colors.primary + '20' }}>
          <button onClick={onCancel} className="flex-1 py-4 rounded-xl font-bold transition-colors" style={{ backgroundColor: colors.background, color: colors.textDark }}>
            Cancel
          </button>
          <button onClick={() => onSave(data)} className="flex-1 py-4 rounded-xl font-bold shadow-xl transition-all active:scale-95" style={{ backgroundColor: colors.primary, color: colors.secondary }}>
            <Save className="w-5 h-5 inline mr-2" />
            Save Supplier
          </button>
        </div>
      </div>
    </div>
  );
};

export default CafeOrderingApp;
