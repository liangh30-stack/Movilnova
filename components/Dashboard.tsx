import React, { useState, useEffect } from 'react';
import {
  Package, Wrench, Clock, BarChart3,
  LogOut, Plus, Search, RefreshCw, CheckCircle2,
  TrendingUp, AlertCircle, X, ShoppingBag, CreditCard, Printer,
  Sparkles, DownloadCloud, Smartphone, Send, Bell, ArrowRight,
  Building2, ChevronDown, Check, Truck, History, Filter,
  DollarSign, Users, Calendar, PieChart, Activity
} from 'lucide-react';
import { InventoryItem, RepairJob, Language, Employee, StockTransfer, Order, StoreConfig, TransferNotification } from '../types';
import KanbanBoard from './KanbanBoard';
import AttendancePanel from './AttendancePanel';
import SyncSettings from './SyncSettings';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// Store configurations
const STORES: StoreConfig[] = [
  { id: 'porrino', name: 'Galaxia Phone Porriño', address: 'Rúa Ramón González, 54', isHQ: true, manager: 'Carlos' },
  { id: 'vigo', name: 'TechNova Vigo', address: 'Gran Vía 45', isHQ: false, manager: 'María' },
  { id: 'ourense', name: 'TechNova Ourense', address: 'Rúa do Paseo 78', isHQ: false, manager: 'Pedro' },
];

interface DashboardProps {
  lang: Language;
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  repairs: RepairJob[];
  setRepairs: React.Dispatch<React.SetStateAction<RepairJob[]>>;
  commonProblems: string[];
  setCommonProblems: (problems: string[]) => void;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  currentUser: Employee;
  onLogout: () => void;
  onDeleteRepair: (id: string) => void;
  onClockIn: (id: string, type: 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END', lat?: number, lng?: number) => void;
  onUpdateSchedule: (id: string, start: string, end: string) => void;
  transfers: StockTransfer[];
  onInitiateTransfer: (item: InventoryItem, from: string, to: string, qty: number) => void;
  onConfirmTransfer: (id: string) => void;
  showAttendance: boolean;
  setShowAttendance: (show: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  lang, inventory, setInventory, repairs, setRepairs,
  commonProblems, setCommonProblems, employees, setEmployees,
  currentUser, onLogout, onDeleteRepair, onClockIn, onUpdateSchedule,
  transfers: propTransfers, onInitiateTransfer, onConfirmTransfer,
  showAttendance, setShowAttendance
}) => {
  const [activeTab, setActiveTab] = useState('kanban');
  const [selectedCustomImage, setSelectedCustomImage] = useState<string | null>(null);

  // Transfer system state
  const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem('stock_transfers');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<TransferNotification[]>(() => {
    const saved = localStorage.getItem('transfer_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transferQty, setTransferQty] = useState(1);
  const [transferTo, setTransferTo] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [transferHistory, setTransferHistory] = useState(false);

  // Shop Orders State
  const [shopOrders, setShopOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('shop_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const isManager = currentUser.role === 'Manager' || currentUser.role === 'admin';
  const currentStoreId = currentUser.store.toLowerCase();

  // Pending notifications for current store
  const pendingNotifications = notifications.filter(
    n => n.toStore === currentStoreId && !n.read
  );

  // Pending transfers for current store
  const pendingTransfers = transfers.filter(
    t => t.toStore === currentStoreId && t.status === 'pending'
  );

  // Save transfers to localStorage
  useEffect(() => {
    localStorage.setItem('stock_transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('transfer_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('shop_orders');
      if (saved) setShopOrders(JSON.parse(saved));
      const savedTransfers = localStorage.getItem('stock_transfers');
      if (savedTransfers) setTransfers(JSON.parse(savedTransfers));
      const savedNotifs = localStorage.getItem('transfer_notifications');
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Handle sending transfer
  const handleSendTransfer = () => {
    if (!selectedItem || !transferTo || transferQty < 1) return;

    const currentStock = selectedItem.stores[currentStoreId] || 0;
    if (transferQty > currentStock) {
      alert('No hay suficiente stock disponible');
      return;
    }

    const newTransfer: StockTransfer = {
      id: `TR-${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      fromStore: currentStoreId,
      toStore: transferTo,
      quantity: transferQty,
      status: 'pending',
      date: new Date().toISOString(),
      sentBy: currentUser.name,
    };

    // Create notification
    const newNotification: TransferNotification = {
      id: `NTF-${Date.now()}`,
      transferId: newTransfer.id,
      toStore: transferTo,
      message: `${currentUser.name} envía ${transferQty}x ${selectedItem.name} desde ${STORES.find(s => s.id === currentStoreId)?.name}`,
      read: false,
      timestamp: new Date().toISOString(),
    };

    // Deduct from sender's inventory immediately
    const updatedInventory = inventory.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          stores: {
            ...item.stores,
            [currentStoreId]: (item.stores[currentStoreId] || 0) - transferQty
          }
        };
      }
      return item;
    });

    setInventory(updatedInventory);
    setTransfers([...transfers, newTransfer]);
    setNotifications([...notifications, newNotification]);
    setShowTransferModal(false);
    setSelectedItem(null);
    setTransferQty(1);
    setTransferTo('');
  };

  // Handle accepting transfer
  const handleAcceptTransfer = (transfer: StockTransfer) => {
    // Update inventory - add to receiving store
    const updatedInventory = inventory.map(item => {
      if (item.id === transfer.itemId) {
        return {
          ...item,
          stores: {
            ...item.stores,
            [transfer.toStore]: (item.stores[transfer.toStore] || 0) + transfer.quantity
          }
        };
      }
      return item;
    });

    // Update transfer status
    const updatedTransfers = transfers.map(t =>
      t.id === transfer.id
        ? { ...t, status: 'completed' as const, receivedBy: currentUser.name, receivedDate: new Date().toISOString() }
        : t
    );

    // Mark notification as read
    const updatedNotifications = notifications.map(n =>
      n.transferId === transfer.id ? { ...n, read: true } : n
    );

    setInventory(updatedInventory);
    setTransfers(updatedTransfers);
    setNotifications(updatedNotifications);
  };

  // Handle rejecting transfer
  const handleRejectTransfer = (transfer: StockTransfer) => {
    // Return items to sender
    const updatedInventory = inventory.map(item => {
      if (item.id === transfer.itemId) {
        return {
          ...item,
          stores: {
            ...item.stores,
            [transfer.fromStore]: (item.stores[transfer.fromStore] || 0) + transfer.quantity
          }
        };
      }
      return item;
    });

    const updatedTransfers = transfers.map(t =>
      t.id === transfer.id ? { ...t, status: 'rejected' as const } : t
    );

    const updatedNotifications = notifications.map(n =>
      n.transferId === transfer.id ? { ...n, read: true } : n
    );

    setInventory(updatedInventory);
    setTransfers(updatedTransfers);
    setNotifications(updatedNotifications);
  };

  const handlePrintOrder = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const itemsHtml = order.items.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.name}
            ${item.isCustom ? '<br/><span style="color:#6366f1; font-weight:bold; font-size:10px;">CUSTOM</span>' : ''}
            ${item.selectedModel ? `<br/><span style="font-size:10px;">Modelo: ${item.selectedModel}</span>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">€${item.price.toFixed(2)}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
          <head><title>Recibo - ${order.id}</title>
            <style>body{font-family:sans-serif;color:#1D3557;padding:40px;}.header{text-align:center;margin-bottom:40px;}.logo{font-size:32px;font-weight:bold;color:#E63946;}table{width:100%;border-collapse:collapse;}.total{font-size:24px;font-weight:bold;text-align:right;margin-top:20px;color:#E63946;}</style>
          </head>
          <body>
            <div class="header"><div class="logo">TechNova</div><div>ID: ${order.id}</div></div>
            <div style="margin-bottom:20px;"><strong>${order.customerName}</strong><br/>${order.phone}</div>
            <table><thead><tr style="background:#f1f1f1;"><th style="padding:10px;text-align:left;">Producto</th><th style="padding:10px;text-align:right;">Precio</th></tr></thead><tbody>${itemsHtml}</tbody></table>
            <div class="total">Total: €${order.total.toFixed(2)}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadImage = (base64: string, name: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = `PRODUCCION-${name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'kanban', label: 'Taller', icon: Wrench },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'attendance', label: 'Fichaje', icon: Clock },
  ];

  if (isManager) {
    tabs.splice(1, 0, { id: 'sales', label: 'Ventas', icon: ShoppingBag });
    tabs.push({ id: 'reports', label: 'Reportes', icon: BarChart3 });
    tabs.push({ id: 'sync', label: 'Sync', icon: RefreshCw });
  }

  // Reports data
  const repairsByStatus = [
    { name: 'Recibido', value: repairs.filter(r => r.status === 'Received').length, color: '#64748b' },
    { name: 'Diagnóstico', value: repairs.filter(r => r.status === 'Diagnosing').length, color: '#3b82f6' },
    { name: 'Esperando', value: repairs.filter(r => r.status === 'Waiting for Parts').length, color: '#eab308' },
    { name: 'Reparado', value: repairs.filter(r => r.status === 'Repaired').length, color: '#22c55e' },
    { name: 'Listo', value: repairs.filter(r => r.status === 'Ready for Pickup').length, color: '#10b981' },
    { name: 'Finalizado', value: repairs.filter(r => r.status === 'Finished' || r.status === 'Picked Up').length, color: '#6366f1' },
  ];

  const revenueData = [
    { name: 'Lun', ventas: 420, reparaciones: 280 },
    { name: 'Mar', ventas: 380, reparaciones: 320 },
    { name: 'Mié', ventas: 510, reparaciones: 290 },
    { name: 'Jue', ventas: 470, reparaciones: 350 },
    { name: 'Vie', ventas: 620, reparaciones: 410 },
    { name: 'Sáb', ventas: 780, reparaciones: 380 },
    { name: 'Dom', ventas: 340, reparaciones: 150 },
  ];

  const totalRepairRevenue = repairs.filter(r => r.status === 'Finished' || r.status === 'Picked Up').reduce((a, b) => a + (b.price || 0), 0);
  const totalSalesRevenue = shopOrders.reduce((a, b) => a + b.total, 0);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-16 lg:w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{currentUser.name}</div>
              <div className="text-slate-500 text-xs">{currentUser.store}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <tab.icon size={20} />
              <span className="hidden lg:block text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800">
          <button onClick={onLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2.5 rounded-xl flex items-center justify-center gap-2">
            <LogOut size={18} />
            <span className="hidden lg:inline text-xs font-medium">Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 bg-slate-950 overflow-y-auto relative">
        {/* Notification Bell */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Bell size={20} className="text-slate-400" />
            {pendingNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                {pendingNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-14 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-white">Transferencias Entrantes</h3>
                <button onClick={() => setShowNotifications(false)}>
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pendingTransfers.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay transferencias pendientes</p>
                  </div>
                ) : (
                  pendingTransfers.map(transfer => (
                    <div key={transfer.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-medium text-sm">{transfer.itemName}</div>
                          <div className="text-xs text-slate-500">
                            {transfer.quantity} unidades desde {STORES.find(s => s.id === transfer.fromStore)?.name}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            Por: {transfer.sentBy} · {new Date(transfer.date).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptTransfer(transfer)}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Check size={14} /> Aceptar
                        </button>
                        <button
                          onClick={() => handleRejectTransfer(transfer)}
                          className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <X size={14} /> Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'kanban' && (
            <KanbanBoard repairs={repairs} setRepairs={setRepairs} employees={employees} currentUser={currentUser} inventory={inventory} setInventory={setInventory} onDeleteRepair={onDeleteRepair} lang={lang} />
          )}

          {activeTab === 'attendance' && (
            <AttendancePanel employees={employees} onClockIn={onClockIn} currentUser={currentUser} onUpdateSchedule={onUpdateSchedule} />
          )}

          {activeTab === 'sales' && isManager && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="text-brand-pink" /> Pedidos Online
                </h2>
                <div className="bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-2">
                  <DollarSign size={16} className="text-green-400" />
                  <span className="text-white font-bold">€{totalSalesRevenue.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shopOrders.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-slate-900 rounded-2xl border border-slate-800">
                    <ShoppingBag size={40} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-slate-500">Sin pedidos todavía</p>
                  </div>
                ) : (
                  shopOrders.map(order => (
                    <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-mono text-slate-600">{order.id}</span>
                          <h3 className="text-white font-semibold">{order.customerName || 'Cliente'}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-slate-400 truncate max-w-[150px]">{item.name}</span>
                            <span className="text-white font-medium">€{item.price.toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-slate-500">+{order.items.length - 2} más</div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                        <span className="text-lg font-bold text-white">€{order.total.toFixed(2)}</span>
                        <button onClick={() => handlePrintOrder(order)} className="bg-brand-pink text-white p-2 rounded-lg hover:bg-brand-pink/80">
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {selectedCustomImage && (
            <>
              <div className="fixed inset-0 bg-black/90 z-[100]" onClick={() => setSelectedCustomImage(null)} />
              <div className="fixed inset-12 z-[110] flex items-center justify-center">
                <img src={selectedCustomImage} className="max-w-full max-h-full object-contain rounded-2xl" alt="HD" />
                <button onClick={() => setSelectedCustomImage(null)} className="absolute top-4 right-4 bg-white/10 text-white p-3 rounded-full"><X size={24}/></button>
              </div>
            </>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Package className="text-blue-400" /> Inventario
                  </h2>
                  <p className="text-slate-500 text-sm">{STORES.find(s => s.id === currentStoreId)?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransferHistory(!transferHistory)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                      transferHistory ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <History size={16} /> Historial
                  </button>
                </div>
              </div>

              {/* Transfer History */}
              {transferHistory && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800">
                    <h3 className="font-semibold text-white">Historial de Transferencias</h3>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
                    {transfers.filter(t => t.fromStore === currentStoreId || t.toStore === currentStoreId).length === 0 ? (
                      <div className="p-6 text-center text-slate-500">Sin transferencias</div>
                    ) : (
                      transfers.filter(t => t.fromStore === currentStoreId || t.toStore === currentStoreId).reverse().slice(0, 10).map(t => (
                        <div key={t.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              t.fromStore === currentStoreId ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {t.fromStore === currentStoreId ? <Send size={14} /> : <Package size={14} />}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{t.itemName}</div>
                              <div className="text-xs text-slate-500">
                                {t.fromStore === currentStoreId ? `→ ${STORES.find(s => s.id === t.toStore)?.name}` : `← ${STORES.find(s => s.id === t.fromStore)?.name}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{t.fromStore === currentStoreId ? '-' : '+'}{t.quantity}</div>
                            <div className={`text-xs ${
                              t.status === 'completed' ? 'text-green-400' : t.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {t.status === 'completed' ? 'Completado' : t.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Inventory Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Pieza</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4 text-center">Stock</th>
                      {isManager && <th className="p-4 text-center">Todas las Tiendas</th>}
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {inventory.map(item => {
                      const localStock = item.stores[currentStoreId] || 0;
                      const totalStock = Object.values(item.stores).reduce((a: number, b: number) => a + b, 0);
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="text-white font-medium">{item.name}</div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-mono text-slate-500">{item.sku}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              localStock > 5 ? 'bg-green-500/20 text-green-400' :
                              localStock > 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {localStock}
                            </span>
                          </td>
                          {isManager && (
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                {STORES.map(store => (
                                  <div key={store.id} className="text-center">
                                    <div className="text-xs text-slate-600">{store.name.split(' ')[1]}</div>
                                    <div className={`text-sm font-medium ${
                                      (item.stores[store.id] || 0) > 0 ? 'text-white' : 'text-slate-600'
                                    }`}>
                                      {item.stores[store.id] || 0}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          )}
                          <td className="p-4 text-right">
                            {localStock > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowTransferModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ml-auto"
                              >
                                <Send size={12} /> Enviar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && isManager && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-indigo-400" /> Panel de Reportes
              </h2>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-400 mb-2">
                    <DollarSign size={18} />
                    <span className="text-xs font-medium uppercase">Ingresos Totales</span>
                  </div>
                  <div className="text-2xl font-bold text-white">€{(totalSalesRevenue + totalRepairRevenue).toFixed(0)}</div>
                  <div className="text-xs text-green-400 mt-1">+12% vs semana anterior</div>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Wrench size={18} />
                    <span className="text-xs font-medium uppercase">Reparaciones</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{repairs.length}</div>
                  <div className="text-xs text-blue-400 mt-1">{repairs.filter(r => r.status === 'Finished').length} completadas</div>
                </div>

                <div className="bg-gradient-to-br from-pink-600/20 to-rose-600/10 border border-pink-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-pink-400 mb-2">
                    <ShoppingBag size={18} />
                    <span className="text-xs font-medium uppercase">Ventas Online</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{shopOrders.length}</div>
                  <div className="text-xs text-pink-400 mt-1">€{totalSalesRevenue.toFixed(0)} total</div>
                </div>

                <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-400 mb-2">
                    <TrendingUp size={18} />
                    <span className="text-xs font-medium uppercase">Ticket Medio</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    €{shopOrders.length > 0 ? (totalSalesRevenue / shopOrders.length).toFixed(0) : 0}
                  </div>
                  <div className="text-xs text-purple-400 mt-1">Por pedido</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-4">Ingresos Semanales</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorReparaciones" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="ventas" stroke="#ec4899" fillOpacity={1} fill="url(#colorVentas)" name="Ventas" />
                        <Area type="monotone" dataKey="reparaciones" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReparaciones)" name="Reparaciones" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Repairs by Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-4">Estado de Reparaciones</h3>
                  <div className="h-64 flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePie>
                        <Pie
                          data={repairsByStatus.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {repairsByStatus.filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        />
                      </RePie>
                    </ResponsiveContainer>
                    <div className="space-y-2 min-w-[120px]">
                      {repairsByStatus.filter(d => d.value > 0).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-400">{item.name}</span>
                          <span className="text-white font-medium ml-auto">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Repairs Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-white font-semibold">Reparaciones Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 text-xs text-slate-400 uppercase">
                      <tr>
                        <th className="p-3 text-left">ID</th>
                        <th className="p-3 text-left">Cliente</th>
                        <th className="p-3 text-left">Dispositivo</th>
                        <th className="p-3 text-left">Problema</th>
                        <th className="p-3 text-center">Estado</th>
                        <th className="p-3 text-right">Precio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {repairs.slice(0, 5).map(repair => (
                        <tr key={repair.id} className="hover:bg-slate-800/30">
                          <td className="p-3 text-xs font-mono text-slate-500">{repair.id}</td>
                          <td className="p-3 text-white text-sm">{repair.customerName}</td>
                          <td className="p-3 text-slate-400 text-sm">{repair.device}</td>
                          <td className="p-3 text-slate-400 text-sm truncate max-w-[150px]">{repair.issue}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              repair.status === 'Finished' ? 'bg-green-500/20 text-green-400' :
                              repair.status === 'Ready for Pickup' ? 'bg-emerald-500/20 text-emerald-400' :
                              repair.status === 'Repaired' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {repair.status}
                            </span>
                          </td>
                          <td className="p-3 text-right text-white font-medium">
                            {repair.price ? `€${repair.price}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sync' && isManager && (
            <SyncSettings onSync={async (url) => { console.log("Sync:", url); return true; }} />
          )}
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && selectedItem && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[100]" onClick={() => setShowTransferModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl z-[110] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send size={20} className="text-blue-400" /> Enviar Stock
              </h3>
              <button onClick={() => setShowTransferModal(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="text-sm text-slate-400 mb-1">Pieza seleccionada</div>
                <div className="text-white font-semibold">{selectedItem.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Stock disponible: {selectedItem.stores[currentStoreId] || 0} unidades
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Cantidad a enviar</label>
                <input
                  type="number"
                  min={1}
                  max={selectedItem.stores[currentStoreId] || 1}
                  value={transferQty}
                  onChange={e => setTransferQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 block mb-2">Enviar a tienda</label>
                <select
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Seleccionar tienda...</option>
                  {STORES.filter(s => s.id !== currentStoreId).map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSendTransfer}
                disabled={!transferTo || transferQty < 1}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Truck size={18} /> Confirmar Envío
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
