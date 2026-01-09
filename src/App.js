import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  ShoppingCart,
  History,
  Settings,
  Wine,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  User,
  LogOut,
  RefreshCw,
  ClipboardCheck,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Info
} from 'lucide-react';

// === FIREBASE CONFIG ===
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

const colors = {
  primary: '#8E3A3A',
  secondary: '#F9F4F0',
  accent: '#D4AF37',
  background: '#F4EBE2',
  textDark: '#432C2C',
  success: '#5B8C5A',
};

const ADMIN_PIN = "8923";

const CafeOrderingApp = () => {
  const [view, setView] = useState('orders');
  const [staffName, setStaffName] = useState(localStorage.getItem('staffName') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('staffName'));
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const todayKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

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

  const saveToFirebase = (path, data) => set(ref(db, `cafe_data/${path}`), data);

  const resetToday = () => {
    if (window.confirm("Reset Today? This will clear all counts and checks for the current shift.")) {
        const newQuantities = { ...orderQuantities };
        const newHistory = { ...orderHistory };
        delete newQuantities[todayKey];
        delete newHistory[todayKey];
        saveToFirebase('quantities', newQuantities);
        saveToFirebase('history', newHistory);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (staffName.trim()) {
      localStorage.setItem('staffName', staffName);
      setIsLoggedIn(true);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><Loader2 className="animate-spin text-stone-400" /></div>;

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center border-t-8 border-primary" style={{ borderColor: colors.primary }}>
          <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Wine className="text-stone-400" /></div>
          <h1 className="font-serif text-2xl mb-2">Bobby's</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-8">Shift Entry</p>
          <input autoFocus className="w-full p-4 rounded-2xl bg-stone-50 mb-4 outline-none text-center font-bold border-2 border-transparent focus:border-amber-200" placeholder="Your Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
          <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-full font-black uppercase tracking-widest shadow-xl">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: colors.background, color: colors.textDark }}>
      <header className="sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto rounded-3xl shadow-2xl p-5 flex items-center justify-between border-b-4" style={{ backgroundColor: colors.primary, borderColor: colors.accent }}>
          <div className="flex flex-col">
            <span className="text-3xl font-serif tracking-widest text-white uppercase leading-none">BOBBY'S</span>
            <div className="flex items-center gap-2 mt-1">
                <User className="w-3 h-3 text-white/50" />
                <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{staffName}</span>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('staffName'); setIsLoggedIn(false); }} className="bg-white/10 p-2 rounded-full"><LogOut size={18} className="text-white" /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {view === 'orders' && <OrdersView staffName={staffName} todayKey={todayKey} suppliers={suppliers} history={orderHistory} quantities={orderQuantities} onSave={saveToFirebase} />}
        {view === 'history' && <HistoryView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} />}
        {view === 'admin' && (
          !isAdminAuthenticated ? (
            <PinPad pinInput={pinInput} setPinInput={setPinInput} onAuth={() => setIsAdminAuthenticated(true)} />
          ) : (
            <AdminView suppliers={suppliers} onSave={(newList) => saveToFirebase('suppliers', newList)} onLogout={() => setIsAdminAuthenticated(false)} onReset={resetToday} />
          )
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="rounded-full shadow-2xl border-2 p-2 flex justify-around items-center backdrop-blur-md bg-white/80" style={{ borderColor: colors.accent }}>
          <NavButton icon={ShoppingCart} active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={History} active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

// === ORDERS VIEW WITH DESCRIPTION DISPLAY ===
const OrdersView = ({ staffName, todayKey, suppliers, history, quantities, onSave }) => {
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  
  const scheduledSuppliers = suppliers.filter(s => s.days?.includes(dayName));
  const activeSuppliers = showAllSuppliers ? suppliers : scheduledSuppliers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="bg-white/40 p-4 rounded-3xl flex items-center justify-center gap-3 border border-stone-200">
            <ClipboardCheck className="text-stone-400" size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Inventory Mode</span>
        </div>
        
        <button 
          onClick={() => setShowAllSuppliers(!showAllSuppliers)}
          className={`w-full p-4 rounded-3xl border-2 border-dashed flex items-center justify-center gap-2 transition-all active:scale-95 ${
            showAllSuppliers ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-stone-50 border-stone-200 text-stone-400'
          }`}
        >
          {showAllSuppliers ? <X size={16}/> : <AlertCircle size={16} />}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {showAllSuppliers ? 'Show Scheduled Only' : 'New Non-Scheduled Order'}
          </span>
        </button>
      </div>

      {activeSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];
        const isNotScheduledToday = !s.days?.includes(dayName);

        return (
          <div key={s.id} className="rounded-[40px] shadow-xl border-t-8 bg-white p-6 transition-all relative overflow-hidden" 
               style={{ borderColor: isCompleted ? colors.success : (isNotScheduledToday ? colors.accent : colors.primary) }}>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-serif text-stone-800">{s.name}</h3>
                {s.description && (
                  <div className="flex items-start gap-2 mt-2 max-w-[200px]">
                    <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-stone-400 leading-tight uppercase tracking-tight">{s.description}</p>
                  </div>
                )}
              </div>
              <button onClick={() => {
                const newHistory = { ...history };
                if (!newHistory[todayKey]) newHistory[todayKey] = {};
                newHistory[todayKey][s.id] = isCompleted ? null : { done: true, by: staffName };
                onSave('history', newHistory);
              }} className="p-4 rounded-full shadow-lg" style={{ backgroundColor: isCompleted ? colors.success : colors.background }}>
                <CheckCircle2 className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-stone-300'}`} />
              </button>
            </div>

            <div className="space-y-3">
              {s.items?.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-stone-50 border border-stone-100">
                  <span className="font-bold text-xs text-stone-500 uppercase">{item.name}</span>
                  <input type="number" className="w-20 p-3 rounded-full border-none bg-white shadow-inner text-center font-bold text-lg outline-none" value={quantities[todayKey]?.[s.id]?.[item.id] || ''} onChange={(e) => {
                    const newQ = { ...quantities };
                    if (!newQ[todayKey]) newQ[todayKey] = {};
                    if (!newQ[todayKey][s.id]) newQ[todayKey][s.id] = {};
                    newQ[todayKey][s.id][item.id] = e.target.value;
                    onSave('quantities', newQ);
                  }} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// === ADMIN VIEW & FORM WITH DESCRIPTION INPUT ===
const AdminView = ({ suppliers, onSave, onLogout, onReset }) => {
    const [mode, setMode] = useState('list');
    const [formData, setFormData] = useState(null);
    if (mode === 'form') return <SupplierForm initialData={formData} onSave={(data) => {
        const newList = !suppliers.find(s => s.id === data.id) ? [...suppliers, data] : suppliers.map(s => s.id === data.id ? data : s);
        onSave(newList); setMode('list');
    }} onCancel={() => setMode('list')} />;
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-4 mb-4">
                <h2 className="font-serif text-2xl">Admin Control</h2>
                <button onClick={onLogout} className="text-xs font-bold text-red-500 uppercase">Lock</button>
            </div>
            <button onClick={onReset} className="w-full p-4 rounded-3xl bg-red-50 text-red-700 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 mb-8"><RefreshCw size={14} /> Clear Today's Counts</button>
            {suppliers.map(s => (
                <div key={s.id} className="p-6 rounded-[30px] bg-white flex justify-between items-center shadow-lg mb-2">
                    <span className="font-serif text-lg">{s.name}</span>
                    <div className="flex gap-2">
                        <button onClick={() => { setFormData(s); setMode('form'); }} className="p-3 bg-stone-50 rounded-full text-stone-400"><Edit3 size={18} /></button>
                        <button onClick={() => window.confirm("Delete?") && onSave(suppliers.filter(x => x.id !== s.id))} className="p-3 bg-stone-50 rounded-full text-red-200"><Trash2 size={18} /></button>
                    </div>
                </div>
            ))}
            <button onClick={() => { setFormData({ id: Date.now().toString(), name: '', description: '', days: [], items: [] }); setMode('form'); }} className="w-full p-6 rounded-[30px] border-4 border-dashed border-stone-200 text-stone-300 flex justify-center hover:bg-white transition-all"><Plus size={32} /></button>
        </div>
    );
};

const SupplierForm = ({ initialData, onSave, onCancel }) => {
    const [data, setData] = useState(initialData);
    const moveItem = (index, direction) => {
        const newItems = [...data.items];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;
        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        setData({ ...data, items: newItems });
    };
    return (
      <div className="bg-white rounded-[40px] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8"><h3 className="font-serif text-2xl">Supplier Profile</h3><X onClick={onCancel} className="w-6 h-6 text-stone-300 cursor-pointer" /></div>
        
        <label className="text-[10px] font-black uppercase text-stone-400 px-2">Supplier Name</label>
        <input className="w-full p-4 rounded-2xl bg-stone-50 text-xl mb-4 outline-none border-2 border-transparent focus:border-amber-200 font-serif" placeholder="e.g. Brasserie Bread" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
        
        <label className="text-[10px] font-black uppercase text-stone-400 px-2">Order Info (Cutoff/Method/Delivery Days)</label>
        <textarea className="w-full p-4 rounded-2xl bg-stone-50 text-xs font-bold mb-6 outline-none border-2 border-transparent focus:border-amber-200 min-h-[80px]" placeholder="e.g. Cutoff 2pm via App. Delivered Mon/Wed/Fri." value={data.description} onChange={e => setData({...data, description: e.target.value})} />

        <label className="text-[10px] font-black uppercase text-stone-400 px-2">Scheduled Count Days</label>
        <div className="flex flex-wrap gap-2 mb-8 mt-2">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <button key={day} onClick={() => {
              const days = data.days?.includes(day) ? data.days.filter(d => d !== day) : [...(data.days || []), day];
              setData({...data, days});
            }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${data.days?.includes(day) ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-300 border-stone-200'}`}>{day.slice(0,3)}</button>
          ))}
        </div>
        
        <div className="space-y-3 mb-8">
          <p className="text-[10px] font-black uppercase text-stone-400 px-2 mb-2">Items</p>
          {data.items?.map((item, i) => (
            <div key={item.id} className="flex gap-2 items-center">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveItem(i, -1)} disabled={i === 0} className={`p-1 rounded bg-stone-50 ${i === 0 ? 'opacity-20' : 'text-stone-400'}`}><ChevronUp size={14} /></button>
                <button onClick={() => moveItem(i, 1)} disabled={i === data.items.length - 1} className={`p-1 rounded bg-stone-50 ${i === data.items.length - 1 ? 'opacity-20' : 'text-stone-400'}`}><ChevronDown size={14} /></button>
              </div>
              <input className="flex-1 p-4 rounded-2xl bg-stone-50 text-xs font-bold outline-none border-2 border-transparent focus:border-amber-100" placeholder="Item" value={item.name} onChange={e => {
                const items = [...data.items]; items[i].name = e.target.value; setData({...data, items});
              }} />
              <input className="w-16 p-4 rounded-2xl bg-stone-50 text-xs text-center font-bold outline-none" placeholder="Par" value={item.par} onChange={e => {
                const items = [...data.items]; items[i].par = e.target.value; setData({...data, items});
              }} />
              <button onClick={() => { const items = [...data.items]; items.splice(i,1); setData({...data, items}); }} className="p-2 text-red-200">×</button>
            </div>
          ))}
          <button onClick={() => setData({...data, items: [...(data.items || []), { id: Date.now(), name: '', par: '' }]})} className="text-xs font-black uppercase tracking-widest text-amber-600 mt-2">+ Add Product</button>
        </div>
        <button onClick={() => onSave(data)} className="w-full py-5 bg-stone-900 text-white rounded-full font-black uppercase tracking-widest shadow-2xl active:scale-95">Save Supplier</button>
      </div>
    );
};

// ... HistoryView, PinPad, NavButton remain same ...
const HistoryView = ({ suppliers, history, quantities }) => {
  const complianceDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + (i - 3));
    return { key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, label: d.toLocaleDateString('en-US', { weekday: 'short' }), isToday: i === 3 };
  });
  return (
    <div className="space-y-6">
      <div className="rounded-[30px] bg-white p-6 shadow-xl text-center">
        <h2 className="font-serif text-lg mb-4 italic text-stone-600">Compliance Tracking</h2>
        <div className="flex justify-between px-2">
          {complianceDays.map(d => {
            const completedCount = Object.values(history[d.key] || {}).filter(v => v?.done).length;
            return (
              <div key={d.key} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-20 rounded-full relative overflow-hidden ${d.isToday ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`} style={{ backgroundColor: '#F0F0F0' }}>
                  <div className="absolute bottom-0 w-full rounded-full transition-all duration-700" style={{ height: `${completedCount * 33}%`, backgroundColor: colors.primary }}></div>
                </div>
                <span className={`text-[9px] font-black uppercase ${d.isToday ? 'text-amber-600' : 'text-stone-400'}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        {[...complianceDays].reverse().map(d => {
            const dayData = quantities[d.key];
            const dayMeta = history[d.key];
            if (!dayData) return null;
            return (
                <div key={d.key} className="p-6 rounded-[30px] bg-white/60 border border-stone-200">
                    <p className="font-black text-[10px] uppercase text-stone-400 mb-4 tracking-widest">{d.label} History</p>
                    {Object.entries(dayData).map(([sId, items]) => (
                        <div key={sId} className="mb-4 last:mb-0">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-black text-amber-600 uppercase">{suppliers.find(s => s.id === sId)?.name}</p>
                                <span className="text-[9px] bg-white px-2 py-1 rounded-full border text-stone-400 font-bold">BY: {dayMeta?.[sId]?.by || 'System'}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(items).map(([itemId, qty]) => (
                                    <span key={itemId} className="px-3 py-1 bg-white rounded-full text-[10px] font-bold shadow-sm border border-stone-100">{suppliers.find(s => s.id === sId)?.items.find(i => i.id.toString() === itemId)?.name}: {qty}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        })}
      </div>
    </div>
  );
};

const PinPad = ({ pinInput, setPinInput, onAuth }) => {
    const handleDigit = (d) => {
      const next = pinInput + d;
      if (next.length <= 4) {
        setPinInput(next);
        if (next === ADMIN_PIN) { onAuth(); setPinInput(""); }
      }
    };
    return (
      <div className="flex flex-col items-center py-10">
        <div className="flex gap-4 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all ${pinInput.length > i ? 'bg-amber-600 border-amber-600 scale-125' : 'border-stone-300'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map(btn => (
            <button key={btn} onClick={() => {
              if (btn === "C") setPinInput("");
              else if (btn === "⌫") setPinInput(pinInput.slice(0, -1));
              else handleDigit(btn);
            }} className="w-20 h-20 rounded-full bg-white shadow-xl text-2xl font-bold active:scale-90 transition-transform">{btn}</button>
          ))}
        </div>
      </div>
    );
};

const NavButton = ({ icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`p-4 rounded-full transition-all duration-500 ${active ? 'shadow-inner' : ''}`}
            style={{ backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.primary }}>
      <Icon className="w-6 h-6" />
    </button>
);

export default CafeOrderingApp;
