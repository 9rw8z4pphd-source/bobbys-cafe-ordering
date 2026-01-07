import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { Package, Plus, Trash2, CheckCircle, Loader2, ClipboardList, Settings, Save, X, Edit2 } from 'lucide-react';

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

const App = () => {
  const [view, setView] = useState('supervisor');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      setSuppliers(data?.suppliers || []);
      setLoading(false);
    });
  }, []);

  const saveToDb = (newList) => set(ref(db, 'cafe_data'), { suppliers: newList });

  const getToday = () => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-amber-50">
      <Loader2 className="animate-spin text-amber-800 w-12 h-12 mb-4" />
      <p className="text-amber-900 font-bold animate-pulse">Syncing with Bobby's Cafe...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
      <nav className="bg-amber-900 text-white p-4 shadow-xl sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-black flex items-center gap-2 tracking-tighter italic">
          <Package className="text-amber-400" /> BOBBY'S CAFE
        </h1>
        <div className="flex bg-amber-950 p-1 rounded-xl shadow-inner">
          <button onClick={() => setView('supervisor')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'supervisor' ? 'bg-amber-500 text-white shadow-lg' : 'text-amber-300'}`}>ORDERS</button>
          <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'admin' ? 'bg-amber-500 text-white shadow-lg' : 'text-amber-300'}`}>ADMIN</button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4">
        {view === 'supervisor' ? (
          <SupervisorView suppliers={suppliers.filter(s => s.days?.includes(getToday()))} />
        ) : (
          <AdminView 
            suppliers={suppliers} 
            onSave={(list) => { saveToDb(list); setShowAddForm(false); }} 
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
          />
        )}
      </main>
    </div>
  );
};

const SupervisorView = ({ suppliers }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
    <div className="flex justify-between items-end border-b-4 border-amber-500 pb-2">
      <h2 className="text-3xl font-black text-stone-800 italic uppercase">Daily Order</h2>
      <span className="text-amber-600 font-bold uppercase text-sm tracking-widest">{new Date().toLocaleDateString('en-GB', { weekday: 'long' })}</span>
    </div>
    {suppliers.length === 0 ? (
      <div className="text-center py-20 bg-white rounded-3xl border-4 border-dashed border-stone-200 text-stone-400">
        <p className="font-bold uppercase tracking-widest">No deliveries scheduled today</p>
      </div>
    ) : (
      suppliers.map(s => (
        <div key={s.id} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-200">
          <div className="bg-amber-100 p-4 border-b border-amber-200 flex justify-between items-center">
            <h3 className="font-black text-amber-900 uppercase italic">{s.name}</h3>
            <span className="bg-amber-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">READY</span>
          </div>
          <div className="p-4 space-y-4">
            {s.items?.map(item => (
              <div key={item.id} className="flex items-center justify-between group">
                <div>
                  <p className="font-bold text-stone-700">{item.name}</p>
                  <p className="text-[10px] text-stone-400 uppercase font-black tracking-tighter">Par Level: {item.par}</p>
                </div>
                <input type="number" placeholder="Qty" className="w-20 p-3 bg-stone-50 border-2 border-stone-100 rounded-xl text-center font-bold focus:border-amber-500 outline-none transition-all" />
              </div>
            ))}
          </div>
        </div>
      ))
    )}
  </div>
);

const AdminView = ({ suppliers, onSave, showAddForm, setShowAddForm }) => {
  const [newSupplier, setNewSupplier] = useState({ name: '', days: [], items: [] });
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const toggleDay = (day) => {
    const days = newSupplier.days.includes(day) ? newSupplier.days.filter(d => d !== day) : [...newSupplier.days, day];
    setNewSupplier({ ...newSupplier, days });
  };

  const addItem = () => {
    const items = [...newSupplier.items, { id: Date.now(), name: '', par: '' }];
    setNewSupplier({ ...newSupplier, items });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-stone-800 italic uppercase">Suppliers</h2>
        <button onClick={() => setShowAddForm(true)} className="bg-amber-600 text-white p-3 rounded-2xl shadow-lg hover:scale-105 transition-all"><Plus /></button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-amber-500 space-y-4 animate-in zoom-in duration-300">
          <input 
            placeholder="Supplier Name" 
            className="w-full text-xl font-black border-b-4 border-stone-100 p-2 outline-none focus:border-amber-500 italic uppercase"
            value={newSupplier.name}
            onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
          />
          <div>
            <p className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest">Order Days</p>
            <div className="flex flex-wrap gap-2">
              {allDays.map(d => (
                <button key={d} onClick={() => toggleDay(d)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${newSupplier.days.includes(d) ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest">Products & Par Levels</p>
            {newSupplier.items.map((item, idx) => (
              <div key={item.id} className="flex gap-2">
                <input placeholder="Item" className="flex-1 p-2 bg-stone-50 rounded-lg text-sm font-bold" value={item.name} onChange={(e) => {
                  const items = [...newSupplier.items]; items[idx].name = e.target.value; setNewSupplier({...newSupplier, items});
                }} />
                <input placeholder="Par" type="number" className="w-16 p-2 bg-stone-50 rounded-lg text-sm font-bold text-center" value={item.par} onChange={(e) => {
                  const items = [...newSupplier.items]; items[idx].par = e.target.value; setNewSupplier({...newSupplier, items});
                }} />
              </div>
            ))}
            <button onClick={addItem} className="text-amber-600 text-xs font-black uppercase">+ Add Product</button>
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={() => onSave([...suppliers, { ...newSupplier, id: Date.now() }])} className="flex-1 bg-amber-900 text-white py-4 rounded-2xl font-black italic uppercase">Save Supplier</button>
            <button onClick={() => setShowAddForm(false)} className="px-6 bg-stone-100 text-stone-400 rounded-2xl font-bold uppercase text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-5 rounded-3xl border border-stone-200 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
            <div>
              <h3 className="font-black text-stone-800 uppercase italic leading-tight">{s.name}</h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">{s.items?.length || 0} items • {s.days?.map(d => d.slice(0,3)).join(', ')}</p>
            </div>
            <button onClick={() => onSave(suppliers.filter(x => x.id !== s.id))} className="text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
