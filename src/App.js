import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  ShoppingCart, History, Settings, Wine, Plus, Edit3, Trash2, X, Loader2, 
  CheckCircle2, User, LogOut, AlertCircle, ListFilter, ClipboardList, 
  AlertTriangle, Trash, FileText, BarChart3, Save, Calendar, ChevronRight
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

const colors = { primary: '#8E3A3A', background: '#F4EBE2', textDark: '#432C2C', success: '#5B8C5A', accent: '#D4AF37' };
const ADMIN_PIN = "8923";

const CafeOrderingApp = () => {
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

  // FORCE LOGOUT ON RELOAD
  useEffect(() => {
    const handleUnload = () => sessionStorage.clear();
    window.addEventListener('beforeunload', handleUnload);
    
    const dataRef = ref(db, 'cafe_data');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSuppliers(data.suppliers || []);
      setWastageItems(data.wastageItems || []);
      setOrderHistory(data.history || {});
      setOrderQuantities(data.quantities || {});
      setWastageData(data.wastage || {});
      setIncidents(data.incidents || {});
      setLoading(false);
    });

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      unsubscribe();
    };
  }, []);

  const saveToFirebase = (path, data) => set(ref(db, `cafe_data/${path}`), data);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F4EBE2]"><Loader2 className="animate-spin text-stone-400" /></div>;

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-[#F4EBE2]">
        <form onSubmit={(e) => { e.preventDefault(); if(staffName.trim()){ sessionStorage.setItem('staffName', staffName); setIsLoggedIn(true); }}} className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center border-t-8 border-[#8E3A3A]">
          <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Wine className="text-stone-400" /></div>
          <h1 className="font-serif text-2xl mb-2">Bobby's</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-8">Shift Login Required</p>
          <input autoFocus className="w-full p-4 rounded-2xl bg-stone-50 mb-4 outline-none text-center font-bold border-2 border-transparent focus:border-amber-200" placeholder="Enter Your Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
          <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-full font-black uppercase tracking-widest">Start Shift</button>
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
                <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{staffName} ON SHIFT</span>
            </div>
          </div>
          <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="bg-white/10 p-2 rounded-full"><LogOut size={18} className="text-white" /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {view === 'orders' && <OrdersView staffName={staffName} todayKey={todayKey} suppliers={suppliers} history={orderHistory} quantities={orderQuantities} onSave={saveToFirebase} />}
        {view === 'ops' && <OpsView displayDate={displayDate} todayKey={todayKey} wastageItems={wastageItems} wastageData={wastageData} staffName={staffName} onSaveWastage={(data) => saveToFirebase('wastage', data)} onSaveIncident={(inc) => {
              const newInc = {...incidents}; if(!newInc[todayKey]) newInc[todayKey] = [];
              newInc[todayKey].push({...inc, by: staffName, time: new Date().toLocaleTimeString(), id: Date.now()});
              saveToFirebase('incidents', newInc);
        }} />}
        {view === 'history' && <HistoryView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} />}
        {view === 'admin' && (!isAdminAuthenticated ? <PinPad pinInput={pinInput} setPinInput={setPinInput} onAuth={() => setIsAdminAuthenticated(true)} /> : 
          <AdminView suppliers={suppliers} wastageItems={wastageItems} wastageData={wastageData} incidents={incidents} 
            onSaveSuppliers={(newList) => saveToFirebase('suppliers', newList)} 
            onSaveWastageItems={(newList) => saveToFirebase('wastageItems', newList)} 
            onDeleteIncident={(date, id) => {
                const newInc = {...incidents}; newInc[date] = newInc[date].filter(r => r.id !== id);
                if(newInc[date].length === 0) delete newInc[date]; saveToFirebase('incidents', newInc);
            }} onLogout={() => setIsAdminAuthenticated(false)} />)}
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

// --- RESTORED SETUP IN ADMIN ---
const AdminView = ({ suppliers, wastageItems, wastageData, incidents, onSaveSuppliers, onSaveWastageItems, onDeleteIncident, onLogout }) => {
    const [tab, setTab] = useState('reports');
    const [editingSupplier, setEditingSupplier] = useState(null);

    const getTotals = () => {
        const t = {};
        Object.values(wastageData || {}).forEach(day => {
            Object.entries(day?.items || {}).forEach(([id, val]) => {
                const name = wastageItems.find(i => i.id.toString() === id)?.name || "Unknown";
                t[name] = (t[name] || 0) + parseFloat(val);
            });
        });
        return Object.entries(t).sort((a,b) => b[1] - a[1]);
    };

    return (
        <div className="space-y-6">
            <div className="flex bg-white rounded-full p-1 shadow-inner overflow-x-auto no-scrollbar">
                {['reports', 'wastage-history', 'totals', 'setup'].map(t => (
                    <button key={t} onClick={() => {setTab(t); setEditingSupplier(null);}} className={`flex-1 min-w-[100px] py-3 rounded-full text-[9px] font-black uppercase transition-all ${tab === t ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>{t.replace('-', ' ')}</button>
                ))}
            </div>

            {tab === 'setup' && !editingSupplier && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[30px] shadow-sm">
                        <h3 className="font-serif text-lg mb-4">Supplier Management</h3>
                        {suppliers.map(s => (
                            <button key={s.id} onClick={() => setEditingSupplier(s)} className="w-full flex justify-between items-center p-4 border-b last:border-0 hover:bg-stone-50">
                                <span className="font-bold text-sm uppercase">{s.name}</span>
                                <ChevronRight size={16} className="text-stone-300"/>
                            </button>
                        ))}
                        <button onClick={() => onSaveSuppliers([...suppliers, {id: Date.now().toString(), name: 'New Supplier', items: [], days: []}])} className="w-full py-4 text-stone-400 text-[10px] font-black uppercase tracking-widest">+ Add New Supplier</button>
                    </div>

                    <div className="bg-white p-6 rounded-[30px] shadow-sm">
                        <h3 className="font-serif text-lg mb-4">Wastage Item Setup</h3>
                        {wastageItems.map(i => (
                            <div key={i.id} className="flex gap-2 mb-2">
                                <input className="flex-1 bg-stone-50 p-2 rounded-xl text-sm font-bold" value={i.name} onChange={e => onSaveWastageItems(wastageItems.map(x => x.id === i.id ? {...x, name: e.target.value} : x))} />
                                <button onClick={() => onSaveWastageItems(wastageItems.filter(x => x.id !== i.id))} className="text-red-200"><X size={18}/></button>
                            </div>
                        ))}
                        <button onClick={() => onSaveWastageItems([...wastageItems, {id: Date.now().toString(), name: 'New Item'}])} className="w-full py-4 text-stone-400 text-[10px] font-black uppercase tracking-widest">+ Add Wastage Item</button>
                    </div>
                </div>
            )}

            {tab === 'setup' && editingSupplier && (
                <div className="bg-white p-6 rounded-[30px] shadow-sm space-y-4">
                    <button onClick={() => setEditingSupplier(null)} className="text-[10px] font-black uppercase text-stone-400 underline mb-4">← Back to Setup</button>
                    <input className="text-2xl font-serif w-full outline-none border-b-2 border-stone-100 pb-2" value={editingSupplier.name} onChange={e => {
                        const updated = {...editingSupplier, name: e.target.value};
                        setEditingSupplier(updated);
                        onSaveSuppliers(suppliers.map(s => s.id === editingSupplier.id ? updated : s));
                    }} />
                    
                    <div className="space-y-2 pt-4">
                        <p className="text-[10px] font-black uppercase text-stone-400">Inventory Items & Par Levels</p>
                        {editingSupplier.items?.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input className="flex-1 bg-stone-50 p-2 rounded-xl text-xs font-bold" value={item.name} onChange={e => {
                                    const newItems = [...editingSupplier.items]; newItems[idx].name = e.target.value;
                                    const updated = {...editingSupplier, items: newItems}; setEditingSupplier(updated);
                                    onSaveSuppliers(suppliers.map(s => s.id === editingSupplier.id ? updated : s));
                                }} />
                                <input className="w-16 bg-stone-50 p-2 rounded-xl text-xs text-center font-bold" placeholder="PAR" value={item.par || ''} onChange={e => {
                                    const newItems = [...editingSupplier.items]; newItems[idx].par = e.target.value;
                                    const updated = {...editingSupplier, items: newItems}; setEditingSupplier(updated);
                                    onSaveSuppliers(suppliers.map(s => s.id === editingSupplier.id ? updated : s));
                                }} />
                            </div>
                        ))}
                        <button onClick={() => {
                            const updated = {...editingSupplier, items: [...(editingSupplier.items || []), {id: Date.now(), name: '', par: ''}]};
                            setEditingSupplier(updated);
                            onSaveSuppliers(suppliers.map(s => s.id === editingSupplier.id ? updated : s));
                        }} className="w-full py-2 bg-stone-50 rounded-xl text-[10px] font-black text-stone-400">+ Add Item</button>
                    </div>
                </div>
            )}

            {/* Totals, Reports, and Wastage History tabs follow the same stable logic as before... */}
            {tab === 'wastage-history' && (
                <div className="space-y-4">
                    {Object.entries(wastageData || {}).reverse().slice(0, 60).map(([date, data]) => (
                        <div key={date} className="bg-white p-6 rounded-3xl border">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <span className="font-serif">{date}</span>
                                <span className="text-[9px] font-black text-stone-300 uppercase">By {data.meta?.by || 'Unknown'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(data.items || {}).map(([id, q]) => (
                                    <div key={id} className="flex justify-between bg-stone-50 p-2 rounded-xl text-[10px]">
                                        <span className="text-stone-400 font-bold uppercase">{wastageItems.find(i => i.id.toString() === id)?.name || 'Item'}</span>
                                        <span className="font-black">{q}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {tab === 'reports' && (
                <div className="space-y-4">
                    {Object.entries(incidents || {}).reverse().map(([date, list]) => (
                        <div key={date} className="bg-white p-6 rounded-3xl border-l-8 border-amber-400">
                            <p className="text-[9px] font-black text-stone-400 uppercase mb-4">{date}</p>
                            {list.map(r => (
                                <div key={r.id} className="relative mb-4 border-b pb-4 last:border-0">
                                    <p className="text-sm italic">"{r.note}"</p>
                                    <div className="flex justify-between items-end mt-2"><span className="text-[8px] font-bold text-stone-300">{r.time} by {r.by}</span><button onClick={() => window.confirm('Delete?') && onDeleteIncident(date, r.id)} className="text-red-200"><Trash2 size={14}/></button></div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {tab === 'totals' && <div className="bg-white p-8 rounded-[40px] shadow-xl">
                {getTotals().map(([name, total]) => (
                    <div key={name} className="flex justify-between border-b py-3 last:border-0"><span className="text-xs font-black uppercase text-stone-500">{name}</span><span className="font-serif text-lg">{total}</span></div>
                ))}
            </div>}
        </div>
    );
};

// Sub-components: OrdersView, HistoryView, PinPad, NavButton remain stable
const OrdersView = ({ staffName, todayKey, suppliers, history, quantities, onSave }) => {
    const [showAll, setShowAll] = useState(false);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    const activeSuppliers = showAll ? suppliers : suppliers.filter(s => s.days?.includes(dayName));
    
    return (
      <div className="space-y-6">
        <button onClick={() => setShowAll(!showAll)} className="w-full p-4 rounded-3xl border-2 border-dashed border-stone-300 text-stone-400 text-[10px] font-black uppercase bg-white/50">{showAll ? 'Show Today Only' : 'Order Non-Scheduled Supplier'}</button>
        {activeSuppliers.map(s => {
          const isCompleted = history[todayKey]?.[s.id];
          return (
            <div key={s.id} className="bg-white rounded-[40px] p-6 shadow-xl border-t-8" style={{ borderColor: isCompleted ? colors.success : colors.primary }}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-serif text-stone-800">{s.name}</h3>
                <button onClick={() => { 
                    const newH = { ...history }; if (!newH[todayKey]) newH[todayKey] = {}; 
                    newH[todayKey][s.id] = isCompleted ? null : { done: true, by: staffName }; 
                    onSave('history', newH); 
                }} className={`p-4 rounded-full ${isCompleted ? 'bg-[#5B8C5A]' : 'bg-stone-100'}`}><CheckCircle2 className={isCompleted ? 'text-white' : 'text-stone-300'} /></button>
              </div>
              <div className="space-y-2">
                {s.items?.map(item => {
                  const qty = quantities[todayKey]?.[s.id]?.[item.id] || '';
                  if (isCompleted && (!qty || qty === '0')) return null;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-stone-50">
                        <span className="font-bold text-xs text-stone-600 uppercase">{item.name}</span>
                        <input type="number" disabled={isCompleted} className="w-16 p-2 rounded-xl text-center font-bold bg-white shadow-inner" value={qty} onChange={(e) => {
                            const newQ = { ...quantities }; if (!newQ[todayKey]) newQ[todayKey] = {}; if (!newQ[todayKey][s.id]) newQ[todayKey][s.id] = {};
                            newQ[todayKey][s.id][item.id] = e.target.value; onSave('quantities', newQ);
                        }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
};

const OpsView = ({ displayDate, todayKey, wastageItems, wastageData, onSaveWastage, onSaveIncident, staffName }) => {
    const [incidentText, setIncidentText] = useState("");
    const [tempWastage, setTempWastage] = useState({});
    const isWastageSaved = !!wastageData?.[todayKey];

    const handleSave = () => {
        const newData = {...wastageData};
        newData[todayKey] = { meta: { by: staffName, time: new Date().toLocaleTimeString() }, items: {} };
        wastageItems.forEach(item => { newData[todayKey].items[item.id] = tempWastage[item.id] || "0"; });
        onSaveWastage(newData);
    };

    return (
        <div className="space-y-6">
            <div className="text-center py-4"><h2 className="text-3xl font-serif">{displayDate}</h2></div>
            <div className="bg-white rounded-[40px] p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-6"><Trash size={20} className="text-[#8E3A3A]"/> <h3 className="font-serif text-xl">Daily Wastage</h3></div>
                <div className="space-y-2 mb-6">
                    {wastageItems?.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-3xl">
                            <span className="text-[10px] font-black uppercase text-stone-500">{item.name}</span>
                            {isWastageSaved ? <span className="font-black">{wastageData[todayKey].items?.[item.id] || '0'}</span> : 
                            <input type="number" className="w-16 p-2 rounded-xl text-center outline-none bg-white shadow-inner" placeholder="0" value={tempWastage[item.id] || ''} onChange={(e) => setTempWastage({...tempWastage, [item.id]: e.target.value})} />}
                        </div>
                    ))}
                </div>
                {isWastageSaved ? (
                    <div className="bg-stone-50 p-4 rounded-3xl flex items-center justify-center gap-2 text-[#5B8C5A] font-black uppercase text-[10px]">
                        <CheckCircle2 size={16}/> Locked by {wastageData[todayKey].meta?.by}
                    </div>
                ) : (
                    <button onClick={handleSave} className="w-full py-4 bg-stone-900 text-white rounded-full font-black uppercase text-[10px] flex justify-center gap-2 items-center"><Save size={16}/> Save & Lock All</button>
                )}
            </div>
            <div className="bg-white rounded-[40px] p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4"><AlertTriangle size={20} className="text-amber-500"/> <h3 className="font-serif text-xl">Incident Report</h3></div>
                <textarea className="w-full p-4 bg-stone-50 rounded-3xl min-h-[100px] outline-none text-sm mb-4" placeholder="Report breakage..." value={incidentText} onChange={e => setIncidentText(e.target.value)} />
                <button onClick={() => { if(!incidentText) return; onSaveIncident({note: incidentText}); setIncidentText(""); }} className="w-full py-4 border-2 border-stone-900 rounded-full font-black uppercase text-[10px] flex justify-center gap-2 items-center"><FileText size={16}/> Send Report</button>
            </div>
        </div>
    );
};

const HistoryView = ({ suppliers, history, quantities }) => {
    const complianceDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() + (i - 3));
        return { key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, label: d.toLocaleDateString('en-US', { weekday: 'short' }), isToday: i === 3 };
    });
    return (
        <div className="space-y-6">
            <div className="rounded-[30px] bg-white p-6 shadow-xl text-center">
                <div className="flex justify-between px-2">
                    {complianceDays.map(d => {
                        const count = Object.values(history[d.key] || {}).filter(v => v?.done).length;
                        return (
                            <div key={d.key} className="flex flex-col items-center gap-2">
                                <div className="w-8 h-16 rounded-full bg-stone-100 relative overflow-hidden">
                                    <div className="absolute bottom-0 w-full bg-[#8E3A3A] transition-all" style={{ height: `${count * 33}%` }}></div>
                                </div>
                                <span className={`text-[9px] font-black uppercase ${d.isToday ? 'text-amber-600' : 'text-stone-400'}`}>{d.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {[...complianceDays].reverse().map(d => {
                const dayData = quantities[d.key]; if(!dayData) return null;
                return (
                    <div key={d.key} className="p-6 bg-white/60 rounded-[30px] border border-stone-200">
                        <p className="text-[10px] font-black uppercase text-stone-400 mb-4">{d.label} Orders</p>
                        {Object.entries(dayData).map(([sId, items]) => (
                            <div key={sId} className="mb-2">
                                <p className="text-[10px] font-black text-[#8E3A3A] uppercase">{suppliers.find(s => s.id === sId)?.name}</p>
                                <div className="flex flex-wrap gap-2 mt-1">{Object.entries(items).map(([id, q]) => q > 0 && (
                                    <span key={id} className="text-[9px] font-bold bg-white px-2 py-1 rounded-full border">{suppliers.find(s => s.id === sId)?.items?.find(i => i.id.toString() === id)?.name}: {q}</span>
                                ))}</div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

const PinPad = ({ pinInput, setPinInput, onAuth }) => {
    const handleDigit = (d) => { const next = pinInput + d; if (next.length <= 4) { setPinInput(next); if (next === ADMIN_PIN) { onAuth(); setPinInput(""); } } };
    return (
        <div className="flex flex-col items-center py-10">
            <div className="flex gap-4 mb-10">{[...Array(4)].map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border-2 ${pinInput.length > i ? 'bg-[#8E3A3A] border-[#8E3A3A]' : 'border-stone-300'}`} />))}</div>
            <div className="grid grid-cols-3 gap-6">{[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map(btn => (
                <button key={btn} onClick={() => { if(btn === "C") setPinInput(""); else if(btn === "⌫") setPinInput(pinInput.slice(0, -1)); else handleDigit(btn); }} className="w-20 h-20 rounded-full bg-white shadow-lg text-xl font-bold">{btn}</button>
            ))}</div>
        </div>
    );
};

const NavButton = ({ icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`p-4 rounded-full transition-all duration-300 ${active ? 'shadow-inner' : ''}`}
            style={{ backgroundColor: active ? '#8E3A3A' : 'transparent', color: active ? '#fff' : '#8E3A3A' }}><Icon size={24} /></button>
);

export default CafeOrderingApp;
