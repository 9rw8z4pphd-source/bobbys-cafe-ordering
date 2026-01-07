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

// === THEME CONFIGURATION ===
const colors = {
  primary: '#722F37',    // Wine/Merlot
  secondary: '#F4EFE8',  // Cream/Off-White
  accent: '#D4AF37',     // Gold
  background: '#FDFBF7', // Light Cream Background
  textDark: '#2D0D15',   // Deep Wine (almost black)
  textLight: '#F4EFE8',  // Cream
  success: '#3A7D44',    // Muted Green
  danger: '#9E2A2B',     // Muted Red
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
      <p className="mt-4 font-serif italic" style={{ color: colors.primary }}>Pouring a glass...</p>
    </div>
  );

  return (
    <div className="min-h-screen font-sans pb-24" style={{ backgroundColor: colors.background, color: colors.textDark }}>
      
      {/* HEADER (LOGO RECREATED IN CODE) */}
      <header className="sticky top-0 z-50 shadow-xl border-b-4" style={{ backgroundColor: colors.primary, borderColor: colors.accent }}>
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <Wine className="w-8 h-8" style={{ color: colors.accent }} />
            {/* Text Logo */}
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-serif tracking-widest uppercase" style={{ color: colors.secondary }}>BOBBY'S</span>
              <div className="h-0.5 w-full my-0.5 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
              <span className="text-[10px] tracking-[0.3em] font-sans font-bold uppercase text-right" style={{ color: colors.secondary }}>WINE BAR</span>
            </div>
          </div>
          <div className="text-xs font-medium opacity-80" style={{ color: colors.secondary }}>
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
      <nav className="fixed bottom-0 left-0 right-0 border-t shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] pb-safe" style={{ backgroundColor: colors.secondary, borderColor: colors.accent }}>
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
    className={`flex flex-col items-center justify-center p-2 min-w-[4rem] rounded-xl transition-all duration-300`}
    style={{
      color: active ? colors.primary : '#A08D93',
      transform: active ? 'translateY(-4px)' : 'none',
    }}
  >
    <div className={`p-1.5 rounded-full mb-1 ${active ? 'shadow-sm' : ''}`} style={{ backgroundColor: active ? colors.primary + '15' : 'transparent' }}>
       <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
    </div>
    <span className="text-[9px] uppercase tracking-widest font-bold">{label}</span>
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
    <div className="flex flex-col items-center justify-center py-20 opacity-40">
      <Wine className="w-20 h-20 mb-4" style={{ color: colors.primary }} />
      <h2 className="text-2xl font-serif text-center" style={{ color: colors.primary }}>No Deliveries Today</h2>
      <p className="text-sm font-sans tracking-wide uppercase">The cellar is quiet</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {todaysSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];

        return (
          <div key={s.id} className="rounded-xl shadow-lg border overflow-hidden transition-all duration-300"
            style={{
              backgroundColor: colors.secondary,
              borderColor: isCompleted ? colors.success : colors.primary,
              transform: isCompleted ? 'scale(0.99)' : 'scale(1)',
              opacity: isCompleted ? 0.8 : 1
            }}
          >
            {/* Supplier Header */}
            <div className="p-5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundColor: isCompleted ? colors.success : colors.primary }}></div>
              <div className="relative z-10">
                <h3 className="font-serif text-xl tracking-wide uppercase" style={{ color: colors.primary }}>{s.name}</h3>
                <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-60" style={{ color: colors.textDark }}>{s.items?.length || 0} Products</p>
              </div>
              <button
                onClick={() => toggleStatus(s.id)}
                className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md relative z-10"
                style={{
                  backgroundColor: isCompleted ? colors.success : colors.primary,
                  color: colors.secondary,
                }}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                {isCompleted ? 'Received' : 'Mark In'}
              </button>
            </div>

            {/* Product List */}
            <div className="divide-y" style={{ borderColor: colors.primary + '20' }}>
              {s.items?.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-sm uppercase tracking-wide" style={{ color: colors.textDark }}>{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest" style={{ backgroundColor: colors.primary + '15', color: colors.primary }}>Par: {item.par}</span>
                    </div>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full h-10 text-center border rounded-lg font-serif text-lg outline-none transition-all shadow-inner"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.primary + '30',
                        color: colors.textDark,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.accent;
                        e.target.style.backgroundColor = '#fff';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.primary + '30';
                        e.target.style.backgroundColor = colors.background;
                      }}
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
    <div className="rounded-xl shadow-lg border overflow-hidden bg-white" style={{ borderColor: colors.primary + '30' }}>
      <div className="p-4 border-b" style={{ backgroundColor: colors.secondary, borderColor: colors.primary + '30' }}>
        <h2 className="font-serif uppercase tracking-widest text-sm text-center" style={{ color: colors.primary }}>Compliance Record</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: colors.primary + '10' }}>
              <th className="p-4 text-left font-bold uppercase text-[10px] tracking-widest opacity-60" style={{ color: colors.textDark }}>Supplier</th>
              {days.map(d => (
                <th key={d.key} className="p-4 text-center font-bold text-[10px] uppercase tracking-wider min-w-[70px]" style={{ color: colors.textDark }}>{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors" style={{ borderColor: colors.primary + '10' }}>
                <td className="p-4 font-bold text-xs uppercase tracking-wide" style={{ color: colors.textDark }}>{s.name}</td>
                {days.map(d => {
                  const shouldOrder = s.days?.includes(d.dayName);
                  const isDone = history[d.key]?.[s.id];

                  if (!shouldOrder) return <td key={d.key} className="text-center opacity-20 text-xs">-</td>;

                  return (
                    <td key={d.key} className="text-center">
                      {isDone ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: colors.success, color: 'white' }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border opacity-40" style={{ borderColor: colors.danger, color: colors.danger }}>
                          <Circle className="w-3.5 h-3.5" />
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

// === 3. ADMIN VIEW ===
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
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="font-serif text-xl tracking-wide" style={{ color: colors.primary }}>Manage Cellar</h2>
        <button
          onClick={() => startEdit(null)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          style={{ backgroundColor: colors.primary, color: colors.secondary }}
        >
          <Plus className="w-4 h-4" />
          <span>New Supplier</span>
        </button>
      </div>

      <div className="grid gap-3">
        {suppliers.map(s => (
          <div key={s.id} className="p-5 rounded-xl shadow-sm border flex justify-between items-center group transition-colors hover:shadow-md bg-white"
            style={{ borderColor: colors.primary + '20' }}
          >
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: colors.textDark }}>{s.name}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50" style={{ color: colors.textDark }}>
                {s.days?.length || 0} Days • {s.items?.length || 0} Products
              </p>
            </div>
            <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
                <Edit3 className="w-4 h-4" style={{ color: colors.primary }} />
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-slate-100 transition-all">
                <Trash2 className="w-4 h-4" style={{ color: colors.danger }} />
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
    <div className="rounded-xl shadow-xl border overflow-hidden bg-white animate-in slide-in-from-bottom-8" style={{ borderColor: colors.primary + '30' }}>
      <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: colors.secondary, borderColor: colors.primary + '30' }}>
        <h3 className="font-serif tracking-wide uppercase text-sm" style={{ color: colors.primary }}>{initialData.name ? 'Edit Profile' : 'New Profile'}</h3>
        <button onClick={onCancel} className="p-1 rounded-full hover:bg-black/5 transition-colors"><X className="w-5 h-5 opacity-40" /></button>
      </div>

      <div className="p-6 space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">Supplier Name</label>
          <input
            className="w-full p-3 border rounded-lg font-serif text-lg outline-none transition-all bg-slate-50"
            style={{ color: colors.textDark }}
            onFocus={(e) => { e.target.style.borderColor = colors.accent; e.target.style.backgroundColor = '#fff'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
            placeholder="Name..."
            value={data.name}
            onChange={e => setData({ ...data, name: e.target.value })}
          />
        </div>

        {/* Days Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50">Schedule</label>
          <div className="flex flex-wrap gap-2">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border`}
                style={{
                  backgroundColor: data.days?.includes(day) ? colors.primary : '#fff',
                  color: data.days?.includes(day) ? colors.secondary : '#94a3b8',
                  borderColor: data.days?.includes(day) ? colors.primary : '#e2e8f0'
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
            <label className="block text-[10px] font-bold uppercase tracking-widest opacity-50">Inventory</label>
            <button onClick={addItem} className="text-[10px] font-bold uppercase tracking-widest hover:underline" style={{ color: colors.primary }}>+ Add Item</button>
          </div>
          <div className="space-y-3">
            {(data.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="flex-1 p-3 border rounded-lg text-sm font-semibold outline-none transition-all bg-slate-50"
                  onFocus={(e) => { e.target.style.borderColor = colors.accent; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                />
                <input
                  type="number"
                  className="w-16 p-3 border rounded-lg text-sm font-semibold text-center outline-none transition-all bg-slate-50"
                  onFocus={(e) => { e.target.style.borderColor = colors.accent; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; }}
                  placeholder="#"
                  value={item.par}
                  onChange={(e) => updateItem(idx, 'par', e.target.value)}
                />
                <button onClick={() => removeItem(idx)} className="p-3 rounded-lg transition-all hover:bg-red-50 text-slate-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors bg-slate-100 text-slate-500 hover:bg-slate-200">
            Cancel
          </button>
          <button onClick={() => onSave(data)} className="flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95" style={{ backgroundColor: colors.primary, color: colors.secondary }}>
            <Save className="w-4 h-4 inline mr-2" />
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default CafeOrderingApp;
