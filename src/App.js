import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  ShoppingCart, History, Settings, Wine, Plus, Edit3, Trash2, X, Loader2, 
  CheckCircle2, User, LogOut, AlertCircle, Info, ListFilter, ClipboardList, 
  AlertTriangle, Trash, FileText, BarChart3, Save
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
  background: '#F4EBE2',
  textDark: '#432C2C',
  success: '#5B8C5A',
  accent: '#D4AF37'
};

const ADMIN_PIN = "2323";

const CafeOrderingApp = () => {
  // Use sessionStorage so reload = logout
  const [staffName, setStaffName] = useState(sessionStorage.getItem('staffName') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem('staffName'));
  
  const [view, setView] = useState('orders');
  const [suppliers, setSuppliers] = useState([]);
  const [wastageItems, setWastageItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [wastageData, setWastageData] = useState({});
  const [incidents, setIncidents] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const displayDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSuppliers(data.suppliers || []);
      setWastageItems(data.wastageItems || []);
      setOrderHistory(data.history || {});
      setOrderQuantities(data.quantities || {});
      setWastageData(data.wastage || {});
      setIncidents(data.incidents || {});
      setLoading(false);
    });
  }, []);

  const saveToFirebase = (path, data) => set(ref(db, `cafe_data/${path}`), data);

  const handleLogin = (e) => {
    e.preventDefault();
    if (staffName.trim()) {
      sessionStorage.setItem('staffName', staffName);
      setIsLoggedIn(true);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F4EBE2]"><Loader2 className="animate-spin text-stone-400" /></div>;

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-[#F4EBE2]">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center border-t-8 border-[#8E3A3A]">
          <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Wine className="text-stone-400" /></div>
          <h1 className="font-serif text-2xl mb-2">Bobby's</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-8">Shift Login Required</p>
          <input autoFocus className="w-full p-4 rounded-2xl bg-stone-50 mb-4 outline-none text-center font-bold border-2 border-transparent focus:border-amber-200" placeholder="Enter Your Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
          <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-full font-black uppercase tracking-widest shadow-xl">Start Shift</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-[#F4EBE2]" style={{ color: colors.textDark }}>
      <header className="sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto rounded-3xl shadow-2xl p-5 flex items-center justify-between border-b-4 bg-[#8E3A3A]" style={{ borderColor: colors.accent }}>
          <div className="flex flex-col">
            <span className="text-3xl font-serif tracking-widest text-white uppercase leading-none">BOBBY'S</span>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{staffName} ON SHIFT</span>
            </div>
          </div>
          <button onClick={() => { sessionStorage.removeItem('staffName'); setStaffName(''); setIsLoggedIn(false); }} className="bg-white/10 p-2 rounded-full"><LogOut size={18} className="text-white" /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {view === 'orders' && <OrdersView staffName={staffName} todayKey={todayKey} suppliers={suppliers} history={orderHistory} quantities={orderQuantities} onSave={saveToFirebase} />}
        {view === 'ops' && (
          <OpsView 
            displayDate={displayDate} todayKey={todayKey} wastageItems={wastageItems} wastageData={wastageData} staffName={staffName}
            onSaveWastage={(data) => saveToFirebase('wastage', data)} 
            onSaveIncident={(inc) => {
              const newInc = {...incidents};
              if(!newInc[todayKey]) newInc[todayKey] = [];
              newInc[todayKey].push({...inc, by: staffName, time: new Date().toLocaleTimeString(), id: Date.now()});
              saveToFirebase('incidents', newInc);
            }}
          />
        )}
        {view === 'history' && <HistoryView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} />}
        {view === 'admin' && (
          !isAdminAuthenticated ? (
            <PinPad pinInput={pinInput} setPinInput={setPinInput} onAuth={() => setIsAdminAuthenticated(true)} />
          ) : (
            <AdminView 
                suppliers={suppliers} wastageItems={wastageItems} wastageData={wastageData} incidents={incidents}
                onSaveSuppliers={(newList) => saveToFirebase('suppliers', newList)} 
                onSaveWastageItems={(newList) => saveToFirebase('wastageItems', newList)}
                onDeleteIncident={(date, id) => {
                    const newInc = {...incidents};
                    newInc[date] = newInc[date].filter(r => r.id !== id);
                    if(newInc[date].length === 0) delete newInc[date];
                    saveToFirebase('incidents', newInc);
                }}
                onLogout={() => setIsAdminAuthenticated(false)} 
            />
          )
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="rounded-full shadow-2xl border-2 p-2 flex justify-around items-center backdrop-blur-md bg-white/80" style={{ borderColor: colors.accent }}>
          <NavButton icon={ShoppingCart} active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={ClipboardList} active={view === 'ops'} onClick={() => setView('ops')} />
          <NavButton icon={History} active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

// --- UPDATED OPS VIEW ---
const OpsView = ({ displayDate, todayKey, wastageItems, wastageData, onSaveWastage, onSaveIncident, staffName }) => {
    const [incidentText, setIncidentText] = useState("");
    const [tempWastage, setTempWastage] = useState({});

    const handleAllWastageSave = () => {
        if (Object.keys(tempWastage).length === 0) return;
        const newData = {...wastageData};
        if(!newData[todayKey]) newData[todayKey] = {};
        
        Object.entries(tempWastage).forEach(([id, qty]) => {
            if(qty && qty !== '0') {
                newData[todayKey][id] = { qty: parseFloat(qty), by: staffName };
            }
        });
        onSaveWastage(newData);
        setTempWastage({});
        alert("Wastage items saved and locked.");
    };

    return (
        <div className="space-y-6">
            <div className="text-center py-4">
                <h2 className="text-3xl font-serif text-stone-800">{displayDate}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Daily Operations Report</p>
            </div>

            <div className="bg-white rounded-[40px] p-6 shadow-xl border-b-4 border-stone-200">
                <div className="flex items-center gap-3 mb-6">
                    <Trash className="text-[#8E3A3A]" size={20} />
                    <h3 className="font-serif text-xl">Daily Wastage</h3>
                </div>
                <div className="space-y-3 mb-6">
                    {wastageItems.map(item => {
                        const saved = wastageData[todayKey]?.[item.id];
                        return (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-stone-50">
                                <span className="font-bold text-xs text-stone-500 uppercase">{item.name}</span>
                                {saved ? (
                                    <div className="flex items-center gap-2 bg-stone-200 px-4 py-2 rounded-full">
                                        <span className="text-xs font-black">{saved.qty}</span>
                                        <CheckCircle2 size={14} className="text-[#5B8C5A]" />
                                    </div>
                                ) : (
                                    <input type="number" className="w-20 p-2 rounded-xl text-center font-bold outline-none bg-white shadow-sm" placeholder="0" value={tempWastage[item.id] || ''} onChange={e => setTempWastage({...tempWastage, [item.id]: e.target.value})} />
                                )}
                            </div>
                        );
                    })}
                </div>
                <button onClick={handleAllWastageSave} className="w-full py-4 bg-stone-900 text-white rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <Save size={18} /> Save All Wastage
                </button>
            </div>

            <div className="bg-white rounded-[40px] p-6 shadow-xl border-b-4 border-stone-200">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <h3 className="font-serif text-xl">Incident & Breakage</h3>
                </div>
                <textarea className="w-full p-4 rounded-3xl bg-stone-50 min-h-[120px] outline-none text-sm border-2 border-transparent focus:border-amber-100 mb-4" placeholder="Describe any breakage or incidents here..." value={incidentText} onChange={e => setIncidentText(e.target.value)} />
                <button onClick={() => { if(!incidentText.trim()) return; onSaveIncident({ note: incidentText }); setIncidentText(""); alert("Report Sent."); }} className="w-full py-4 bg-white text-stone-900 border-2 border-stone-900 rounded-full font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 active:bg-stone-50">
                    <FileText size={18} /> Send Report
                </button>
            </div>
        </div>
    );
};

// --- UPDATED ADMIN VIEW ---
const AdminView = ({ suppliers, wastageItems, wastageData, incidents, onSaveSuppliers, onSaveWastageItems, onDeleteIncident, onLogout }) => {
    const [tab, setTab] = useState('suppliers');
    const getMonthlyTotals = () => {
        const totals = {};
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        Object.entries(wastageData).forEach(([dateStr, items]) => {
            if (new Date(dateStr) >= thirtyDaysAgo) {
                Object.entries(items).forEach(([itemId, record]) => {
                    const itemName = wastageItems.find(i => i.id.toString() === itemId)?.name || "Unknown Item";
                    totals[itemName] = (totals[itemName] || 0) + parseFloat(record.qty);
                });
            }
        });
        return Object.entries(totals).sort((a, b) => b[1] - a[1]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl">Management</h2>
                <button onClick={onLogout} className="text-[#8E3A3A] font-black text-xs uppercase underline">Lock</button>
            </div>
            <div className="flex bg-white rounded-full p-1 shadow-inner overflow-x-auto no-scrollbar">
                {['suppliers', 'wastage', 'reports', 'totals'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`flex-1 min-w-[80px] py-3 rounded-full text-[9px] font-black uppercase transition-all ${tab === t ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>{t}</button>
                ))}
            </div>

            {tab === 'reports' && (
                <div className="space-y-6">
                    {Object.entries(incidents).reverse().map(([date, reports]) => (
                        <div key={date} className="bg-white rounded-[30px] p-6 shadow-md border-l-8 border-amber-400">
                            <h4 className="font-black text-[10px] uppercase text-stone-400 mb-4">{date}</h4>
                            {reports.map((r) => (
                                <div key={r.id} className="mb-4 last:mb-0 border-b border-stone-50 pb-4 relative">
                                    <button onClick={() => window.confirm("Delete report?") && onDeleteIncident(date, r.id)} className="absolute top-0 right-0 text-red-200 hover:text-red-500"><Trash2 size={16}/></button>
                                    <div className="flex justify-between items-center mb-1"><span className="text-[8px] font-bold text-stone-300">{r.time} by {r.by}</span></div>
                                    <p className="text-sm text-stone-600 italic pr-8">"{r.note}"</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
            {/* ... Other Tabs (Suppliers, Wastage Items, Totals) stay as before ... */}
        </div>
    );
};

// ... Rest of the components (NavButton, OrdersView, HistoryView, PinPad) remain identical ...
const NavButton = ({ icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`p-4 rounded-full transition-all duration-500 ${active ? 'shadow-inner' : ''}`}
            style={{ backgroundColor: active ? '#8E3A3A' : 'transparent', color: active ? '#fff' : '#8E3A3A' }}>
      <Icon className="w-6 h-6" />
    </button>
);

export default CafeOrderingApp;
