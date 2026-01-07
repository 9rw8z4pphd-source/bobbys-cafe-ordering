import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { Package, ClipboardList, Settings, Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App = () => {
  const [view, setView] = useState('supervisor');
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);

  // --- DATA SYNC LOGIC ---
  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || { suppliers: [], orders: {} };
      setSuppliers(data.suppliers || []);
      setOrders(data.orders || {});
      setLoading(false);
    });
  }, []);

  const syncData = (newSuppliers, newOrders) => {
    set(ref(db, 'cafe_data'), {
      suppliers: newSuppliers || suppliers,
      orders: newOrders || orders
    });
  };

  // --- ACTIONS ---
  const handleAddSupplier = (name) => {
    const newSuppliers = [...suppliers, { id: Date.now(), name, items: [], days: ['monday'] }];
    syncData(newSuppliers);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-amber-800" /></div>;

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Navigation */}
      <nav className="bg-amber-900 text-amber-50 p-4 flex justify-between items-center shadow-md">
        <h1 className="font-bold flex items-center gap-2"><Package size={20}/> Bobby's Cafe</h1>
        <div className="flex gap-2 bg-amber-800 p-1 rounded-lg text-sm">
          {['supervisor', 'admin'].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-1 rounded-md transition ${view === v ? 'bg-amber-50 text-amber-900 shadow' : 'hover:bg-amber-700'}`}>
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {view === 'supervisor' ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-amber-900">Today's Checksheet</h2>
            {suppliers.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border-l-8 border-amber-600 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{s.name}</h3>
                  <p className="text-xs text-stone-400">Scheduled for Today</p>
                </div>
                <button className="flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full font-bold text-stone-600 hover:bg-green-100 hover:text-green-700 transition">
                  <CheckCircle size={18}/> Mark Done
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-amber-900">Manage Suppliers</h2>
              <button onClick={() => handleAddSupplier(prompt('Supplier Name?'))} className="bg-amber-600 text-white p-2 rounded-full hover:rotate-90 transition"><Plus/></button>
            </div>
            <div className="grid gap-4">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-xl border border-stone-200 flex justify-between items-center group">
                  <span className="font-semibold">{s.name}</span>
                  <button onClick={() => syncData(suppliers.filter(x => x.id !== s.id))} className="text-stone-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
