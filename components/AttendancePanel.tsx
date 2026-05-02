import React, { useState } from 'react';
import { Employee } from '../types';
import { Clock, AlertTriangle } from 'lucide-react';
import { getFunctions, httpsCallable, FunctionsError } from 'firebase/functions';
import { getApp } from 'firebase/app';

interface AttendancePanelProps {
  employees: Employee[];
  onClockIn: (id: string, type: 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END', lat?: number, lng?: number) => void;
  currentUser: Employee;
  onUpdateSchedule: (id: string, start: string, end: string) => void;
}

// SECURITY: PIN verification runs server-side via the verifyEmployeePin
// Cloud Function. The previous version compared `emp.pin === pin` client-side,
// which exposed every employee's PIN to anyone able to open the admin panel
// (PINs were transmitted as part of the Employee object). The function:
//   - reads the pinHash + pinSalt from Firestore (or legacy plain `pin` field)
//   - rate-limits to 10 attempts per IP+employee per 15 min
//   - never tells the client which side was wrong
async function verifyPinOnServer(employeeId: string, pin: string): Promise<boolean> {
  const fns = getFunctions(getApp());
  const verify = httpsCallable<{ employeeId: string; pin: string }, { success: boolean }>(
    fns,
    'verifyEmployeePin',
  );
  try {
    const res = await verify({ employeeId, pin });
    return res.data.success === true;
  } catch (err) {
    // FunctionsError code is prefixed with "functions/" e.g. "functions/permission-denied"
    const code = (err as FunctionsError)?.code;
    if (code === 'functions/permission-denied') return false;
    if (code === 'functions/resource-exhausted') {
      alert('Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.');
      return false;
    }
    console.error('verifyEmployeePin failed', err);
    alert('No se pudo verificar el PIN. Comprueba tu conexión.');
    return false;
  }
}

const AttendancePanel: React.FC<AttendancePanelProps> = ({ employees, onClockIn, currentUser }) => {
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleAction = async (type: 'IN' | 'OUT' | 'BREAK_START' | 'BREAK_END') => {
    if (!selectedEmp) return;
    const emp = employees.find(e => e.id === selectedEmp);
    if (!emp) return;
    if (verifying) return;

    setVerifying(true);
    const ok = await verifyPinOnServer(selectedEmp, pin);
    setVerifying(false);
    if (!ok) {
      alert('PIN Incorrecto');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onClockIn(selectedEmp, type, pos.coords.latitude, pos.coords.longitude);
        setPin('');
        alert('Fichaje registrado con éxito');
      },
      (err) => {
        alert('Error de ubicación: ' + err.message);
        // Fallback location only for dev/HTTP
        onClockIn(selectedEmp, type, 42.1611, -8.6133);
        setPin('');
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center shadow-xl">
         <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-700">
           <Clock size={48} className="text-blue-500" />
         </div>
         <h2 className="text-3xl font-bold text-white mb-2">{new Date().toLocaleTimeString()}</h2>
         <p className="text-slate-400 mb-8">{new Date().toLocaleDateString()}</p>

         <div className="max-w-md mx-auto space-y-4">
           <select 
             className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
             value={selectedEmp}
             onChange={e => setSelectedEmp(e.target.value)}
           >
             <option value="">Selecciona tu nombre...</option>
             {employees.filter(e => e.store === currentUser.store || currentUser.role === 'admin').map(e => (
               <option key={e.id} value={e.id}>{e.name}</option>
             ))}
           </select>

           {selectedEmp && (
             <input 
               type="password"
               placeholder="PIN de 4 dígitos"
               className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-center tracking-widest outline-none"
               value={pin}
               onChange={e => setPin(e.target.value)}
               maxLength={4}
             />
           )}

           <div className="grid grid-cols-2 gap-4 pt-4">
             <button 
               onClick={() => handleAction('IN')}
               className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-transform"
             >
               ENTRADA
             </button>
             <button 
               onClick={() => handleAction('OUT')}
               className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-95 transition-transform"
             >
               SALIDA
             </button>
             <button 
               onClick={() => handleAction('BREAK_START')}
               className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl text-sm"
             >
               PAUSA (Café/Comida)
             </button>
             <button 
               onClick={() => handleAction('BREAK_END')}
               className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-xl text-sm"
             >
               VOLVER
             </button>
           </div>
         </div>
      </div>
      
      {currentUser.role === 'admin' && (
        <div className="mt-8 bg-slate-900 rounded-2xl border border-slate-800 p-6">
           <h3 className="text-xl font-bold text-white mb-4">Registro de Hoy</h3>
           <div className="space-y-2">
             {employees.filter(e => e.attendanceHistory.length > 0).map(e => {
               const today = e.attendanceHistory.find(r => r.date === new Date().toISOString().split('T')[0]);
               if (!today) return null;
               return (
                 <div key={e.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg">
                    <span className="text-white font-medium">{e.name}</span>
                    <div className="text-sm text-slate-400">
                      IN: {today.clockIn ? new Date(today.clockIn).toLocaleTimeString() : '--'} | 
                      OUT: {today.clockOut ? new Date(today.clockOut).toLocaleTimeString() : '--'}
                      {today.isLate && <span className="ml-2 text-red-400 font-bold text-xs flex items-center inline-flex gap-1"><AlertTriangle size={10}/> LATE ({today.latenessMinutes}m)</span>}
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePanel;
