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
  History
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

const CafeOrderingApp = () => {
  const [view, setView] = useState('orders'); // orders, history, admin
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [loading, setLoading] = useState(true);

  // Sync Data
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
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="mt-4 text-slate-500 font-semibold">Loading System...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-24">
      {/* HEADER */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg border-b-4 border-blue-600">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">BOBBY'S CAFE</h1>
          </div>
          <div className="text-xs font-medium text-slate-400">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
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
    className={`flex flex-col items-center justify-center p-2 min-w-[4rem] rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
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
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <CalendarDays className="w-16 h-16 mb-4 opacity-20" />
      <h2 className="text-xl font-bold text-slate-500">No Orders Today</h2>
      <p className="text-sm">Enjoy the quiet day!</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {todaysSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];
        
        return (
          <div key={s.id} className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all ${isCompleted ? 'border-emerald-500' : 'border-slate-200'}`}>
            {/* Supplier Header */}
            <div className={`p-4 flex justify-between items-center ${isCompleted ? 'bg-emerald-50' : 'bg-white'}`}>
              <div>
                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">{s.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase">{s.items?.length || 0} Items</p>
              </div>
              <button 
                onClick={() => toggleStatus(s.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm uppercase transition-all active:scale-95 ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                {isCompleted ? 'Done' : 'Mark Done'}
              </button>
            </div>

            {/* Product List */}
            <div className="divide-y divide-slate-100">
              {s.items?.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-slate-700">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">Par: {item.par}</span>
                    </div>
                  </div>
                  <div className="w-24">
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-full h-12 text-center bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg focus:border-blue-500 focus:bg-white outline-none transition-all"
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
  // Generate last 7 days
  const days = Array.from({length: 5}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i); // Today backwards
    return {
      key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h2 className="font-bold text-slate-700 uppercase tracking-wide text-sm">Order Compliance (Last 5 Days)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-4 text-left font-bold text-slate-400 uppercase text-xs">Supplier</th>
              {days.map(d => (
                <th key={d.key} className="p-4 text-center font-bold text-slate-600 min-w-[80px]">{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-800">{s.name}</td>
                {days.map(d => {
                  const shouldOrder = s.days?.includes(d.dayName);
                  const isDone = history[d.key]?.[s.id];
                  
                  if (!shouldOrder) return <td key={d.key} className="text-center text-slate-200">-</td>;
                  
                  return (
                    <td key={d.key} className="text-center">
                      {isDone ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 text-rose-300">
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
  const [mode, setMode] = useState('list'); // 'list' or 'form'
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
          // If editing existing, replace it. If new, add it.
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
        <h2 className="font-bold text-slate-700">Suppliers ({suppliers.length})</h2>
        <button 
          onClick={() => startEdit(null)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add New</span>
        </button>
      </div>

      <div className="grid gap-3">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center group hover:border-blue-400 transition-colors">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">
                {s.days?.length || 0} Days • {s.items?.length || 0} Products
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(s)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
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
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-700">{initialData.name ? 'Edit Supplier' : 'New Supplier'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Supplier Name</label>
          <input 
            className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-lg focus:border-blue-500 outline-none"
            placeholder="e.g. Dairy Brothers"
            value={data.name}
            onChange={e => setData({...data, name: e.target.value})}
          />
        </div>

        {/* Days Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Delivery Days</label>
          <div className="flex flex-wrap gap-2">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
              <button 
                key={day} 
                onClick={() => toggleDay(day)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${data.days?.includes(day) ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {day.slice(0,3)}
              </button>
            ))}
          </div>
        </div>

        {/* Products List */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-slate-400 uppercase">Products</label>
            <button onClick={addItem} className="text-xs font-bold text-blue-600 uppercase hover:underline">+ Add Item</button>
          </div>
          <div className="space-y-3">
            {(data.items || []).map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-blue-500 outline-none"
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) => updateItem(idx, 'name', e.target.value)}
                />
                <input 
                  type="number"
                  className="w-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-center focus:border-blue-500 outline-none"
                  placeholder="Par"
                  value={item.par}
                  onChange={(e) => updateItem(idx, 'par', e.target.value)}
                />
                <button onClick={() => removeItem(idx)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {(data.items || []).length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
                No items yet. Click "+ Add Item" to start.
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(data)} className="flex-1 py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-black shadow-xl transition-all active:scale-95">
            <Save className="w-5 h-5 inline mr-2" />
            Save Supplier
          </button>
        </div>
      </div>
    </div>
  );
};

export default CafeOrderingApp;
