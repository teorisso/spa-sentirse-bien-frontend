import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, addDays, addHours, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  IService,
  ITurnoPopulated,
  IUser,
} from '@/types';

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const availableTimes = [
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export default function ReservaModal({ isOpen, onClose, onSuccess }: ReservaModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<IService[]>([]);
  const [professionals, setProfessionals] = useState<IUser[]>([]);
  const [existingTurnos, setExistingTurnos] = useState<ITurnoPopulated[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);

  // selections
  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<IUser | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // fechas
  const today = new Date();
  const minDate = addDays(startOfDay(today), 2);

  /* efecto inicial */
  useEffect(() => {
    if (!isOpen) return;
    // reset
    setStep(1);
    setSelectedService(null);
    setSelectedProfessional(null);
    setSelectedDate(undefined);
    setSelectedTime('');
    setFormError(null);
    fetchServices();
    fetchProfessionals();
    fetchExistingTurnos();
  }, [isOpen]);

  /* fetch servicios */
  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`);
      if (!res.ok) throw new Error('Error al cargar servicios');
      const data = await res.json();
      setServices(data);
    } catch (err) {
      toast.error('No se pudieron cargar los servicios');
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  /* fetch profesionales */
  const fetchProfessionals = async () => {
    try {
      setLoadingProfessionals(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_USER}`);
      if (!res.ok) throw new Error('Error al cargar profesionales');
      const data: IUser[] = await res.json();
      setProfessionals(data.filter(u => u.role === 'profesional'));
    } catch (err) {
      toast.error('No se pudieron cargar los profesionales');
      console.error(err);
    } finally {
      setLoadingProfessionals(false);
    }
  };

  /* fetch turnos actuales */
  const fetchExistingTurnos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`);
      if (!res.ok) return;
      const txt = await res.text();
      try {
        const data = JSON.parse(txt);
        setExistingTurnos(data.filter((t: ITurnoPopulated) => t.estado !== 'cancelado'));
      } catch {/* ignore */}
    } catch (err) {
      console.error('Error cargando turnos existentes', err);
    }
  };

  /* utilidades */
  const validateTurnoTime = (date: Date, time: string): boolean => {
    const [h, m] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setHours(h, m, 0, 0);
    return dt.getTime() > addHours(new Date(), 48).getTime();
  };

  const isTimeSlotOccupied = (date: Date, time: string, serviceId: string, professionalId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return existingTurnos.some(t => {
      let tDate = typeof t.fecha === 'string' ? (t.fecha.includes('T') ? t.fecha.split('T')[0] : t.fecha) : format(new Date(t.fecha), 'yyyy-MM-dd');
      const tService = typeof t.servicio === 'string' ? t.servicio : t.servicio._id;
      const tProf = (t as any).profesional ? (typeof (t as any).profesional === 'string' ? (t as any).profesional : (t as any).profesional._id) : undefined;
      return tDate === dateStr && t.hora === time && tService === serviceId && tProf === professionalId;
    });
  };

  const getAvailableTimes = () => {
    if (!selectedDate || !selectedService || !selectedProfessional) return availableTimes;
    return availableTimes.filter(time => validateTurnoTime(selectedDate, time) && !isTimeSlotOccupied(selectedDate, time, selectedService._id, selectedProfessional._id));
  };

  const getTimesBlockedBy48h = () => !selectedDate ? [] : availableTimes.filter(time => !validateTurnoTime(selectedDate, time));
  const getOccupiedTimes = () => {
    if (!selectedDate || !selectedService || !selectedProfessional) return [];
    return availableTimes.filter(time => validateTurnoTime(selectedDate, time) && isTimeSlotOccupied(selectedDate, time, selectedService._id, selectedProfessional._id));
  };

  /* submit */
  const handleSubmit = async () => {
    if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime || !user) {
      setFormError('Por favor completa todos los campos');
      return;
    }
    if (!validateTurnoTime(selectedDate, selectedTime)) {
      setFormError('El turno debe reservarse con al menos 48 horas de anticipación.');
      return;
    }
    if (isTimeSlotOccupied(selectedDate, selectedTime, selectedService._id, selectedProfessional._id)) {
      setFormError('Este horario ya no está disponible. Por favor, selecciona otro.');
      return;
    }

    try {
      let clienteId = user._id || JSON.parse(localStorage.getItem('user') || '{}')._id;
      if (!clienteId) throw new Error('No se encontró ID de usuario');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No se encontró token');

      const turnoData = { cliente: clienteId, servicio: selectedService._id, profesional: selectedProfessional._id, fecha: selectedDate.toISOString(), hora: selectedTime };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/create?token=${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(turnoData), signal: controller.signal });
      clearTimeout(timeout);
      const txt = await res.text();
      if (res.headers.get('content-type')?.includes('text/html')) throw new Error('Respuesta inválida del servidor');
      const data = txt ? JSON.parse(txt) : {};
      if (!res.ok) throw new Error(data.message || 'Error del servidor');
      toast.success('Turno reservado con éxito');
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.name === 'AbortError') setFormError('La solicitud tomó demasiado tiempo');
      else setFormError(err.message || 'Error al reservar el turno');
      console.error(err);
    }
  };

  /* render helpers */
  const renderStepContent = () => {
    if (step === 1) {
      if (loadingServices) return <p>Cargando servicios...</p>;
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-lora text-primary">Selecciona un servicio</h2>
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {services.map(s => (
              <div key={s._id} className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedService?._id === s._id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`} onClick={() => setSelectedService(s)}>
                <h3 className="text-lg font-medium">{s.nombre}</h3>
                <p className="text-gray-500 text-sm">{s.descripcion}</p>
                <p className="mt-2 text-primary font-semibold">${s.precio}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (step === 2) {
      if (loadingProfessionals) return <p>Cargando profesionales...</p>;
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-lora text-primary">Selecciona un profesional</h2>
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {professionals.map(p => (
              <div key={p._id} className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedProfessional?._id === p._id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'}`} onClick={() => setSelectedProfessional(p)}>
                <h3 className="text-lg font-medium">{p.first_name} {p.last_name}</h3>
                <p className="text-gray-500 text-sm">{p.email}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (step === 3) {
      const available = getAvailableTimes();
      const blocked = getTimesBlockedBy48h();
      const occupied = getOccupiedTimes();
      const limited = available.length < availableTimes.length;
      const none = available.length === 0;
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-lora text-primary">Selecciona una fecha</h2>
          {none && <div className="p-2 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700 text-sm">❌ Sin horarios disponibles para esta fecha</p></div>}
          {!none && limited && <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg"><p className="text-yellow-800 text-sm">⚠️ Horarios limitados para esta fecha</p></div>}
          <div className="flex justify-center"><DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} fromDate={minDate} disabled={[{ dayOfWeek: [0] }]} classNames={{ day_selected: 'rdp-day_selected', day_today: 'font-bold text-accent', day: 'hover:bg-accent/20 transition-colors' }} /></div>
        </div>
      );
    }
    if (step === 4) {
      const available = getAvailableTimes();
      const blocked = getTimesBlockedBy48h();
      const occupied = getOccupiedTimes();
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-lora text-primary">Selecciona la hora</h2>
          {available.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{available.map(t => <button key={t} className={`py-2 px-3 border rounded-lg text-center transition-all text-sm ${selectedTime === t ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary hover:bg-primary/5'}`} onClick={() => setSelectedTime(t)}>{t}</button>)}</div>
              {(blocked.length > 0 || occupied.length > 0) && <div><p className="text-xs text-gray-500 mb-2">No disponibles:</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{blocked.map(t => <div key={t} className="py-2 px-3 border border-gray-200 rounded-lg text-center text-gray-400 bg-gray-50 text-sm"><span className="line-through">{t}</span><div className="text-xs">48h</div></div>)}{occupied.map(t => <div key={t} className="py-2 px-3 border border-red-200 rounded-lg text-center text-red-400 bg-red-50 text-sm"><span className="line-through">{t}</span><div className="text-xs">Ocupado</div></div>)}</div></div>}</>
          )}
          {/* resumen */}
          {selectedService && selectedProfessional && selectedDate && selectedTime && <div className="p-3 bg-soft/50 rounded-lg border border-accent/30"><h3 className="text-lg font-lora text-primary mb-2">Resumen</h3><div className="space-y-1 text-sm"><p><span className="font-medium">Servicio:</span> {selectedService.nombre}</p><p><span className="font-medium">Profesional:</span> {selectedProfessional.first_name} {selectedProfessional.last_name}</p><p><span className="font-medium">Fecha:</span> {format(selectedDate, 'dd/MM/yyyy')}</p><p><span className="font-medium">Hora:</span> {selectedTime}</p><p><span className="font-medium">Precio:</span> ${selectedService.precio}</p></div></div>}
          {formError && <div className="p-2 bg-red-50 text-red-700 rounded-md text-sm">{formError}</div>}
        </div>
      );
    }
    return null;
  };

  const renderNavigation = () => {
    const can2 = !!selectedService;
    const can3 = !!selectedProfessional;
    const can4 = !!selectedDate && getAvailableTimes().length > 0;
    return (
      <div className="flex justify-between">
        {step > 1 && <button type="button" className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" onClick={() => { setStep(step - 1); setFormError(null); }}>Anterior</button>}
        <div className="flex-1" />
        {step < 4 ? <button type="button" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors" onClick={() => { if (step === 1 && !can2) { setFormError('Selecciona un servicio'); return; } if (step === 2 && !can3) { setFormError('Selecciona un profesional'); return; } if (step === 3 && !can4) { setFormError('Seleccione una fecha válida'); return; } setFormError(null); setStep(step + 1); }}>Siguiente</button> : <button type="button" disabled={!selectedService || !selectedProfessional || !selectedDate || !selectedTime} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors" onClick={handleSubmit}>Confirmar Reserva</button>}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-semibold text-primary">Reservar Turno</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-700" title="Cerrar modal">✕</button></div>
              <div><div className="flex justify-between items-center">{[1,2,3,4].map(n => <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= n ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{n}</div>)}</div><div className="relative mt-2"><div className="absolute w-full h-1 bg-gray-200"></div><div className={`absolute h-1 bg-primary transition-all duration-300 ${step===1?'w-0':step===2?'w-1/3':step===3?'w-2/3':'w-full'}`}></div></div></div>
            </div>
            {/* content */}
            <div className="flex-1 overflow-y-auto p-6">{renderStepContent()}</div>
            {/* navigation */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">{renderNavigation()}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}