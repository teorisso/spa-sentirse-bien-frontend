import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IService, ITurnoPopulated } from '@/types';
import { DayPicker } from 'react-day-picker';
import { format, addDays, isAfter, addHours, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import 'react-day-picker/dist/style.css';

interface ReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservaModal({ isOpen, onClose, onSuccess }: ReservaModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<IService[]>([]);
  const [existingTurnos, setExistingTurnos] = useState<ITurnoPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Date constraints
  const today = new Date();
  const minDate = addDays(startOfDay(today), 2);
  
  // Available time slots
  const availableTimes = [
    '9:00', '10:00', '11:00', '12:00', 
    '14:00', '15:00', '16:00', '17:00'
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedTime('');
      setFormError(null);
      fetchServices();
      fetchExistingTurnos();
    }
  }, [isOpen]);

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`);
      
      if (!res.ok) throw new Error('Error al cargar servicios');
      
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      setFormError('No se pudieron cargar los servicios. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch existing turnos to check availability
  const fetchExistingTurnos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`);
      
      if (!res.ok) return;
      
      const responseText = await res.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        return;
      }
      
      // Filtrar solo turnos activos (no cancelados)
      const activeTurnos = data.filter((turno: ITurnoPopulated) => 
        turno.estado !== 'cancelado'
      );
      
      setExistingTurnos(activeTurnos);
    } catch (error) {
      console.error('Error fetching existing turnos:', error);
    }
  };

  // Validate 48-hour rule for selected date and time
  const validateTurnoTime = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const turnoDateTime = new Date(date);
    turnoDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const minimumTime = addHours(now, 48);
    
    return turnoDateTime.getTime() > minimumTime.getTime();
  };

  // Check if a specific time slot is occupied for a given date and service
  const isTimeSlotOccupied = (date: Date, time: string, serviceId: string): boolean => {
    if (!existingTurnos.length) return false;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    return existingTurnos.some(turno => {
      // Convertir la fecha del turno correctamente desde UTC
      let turnoDate: string;
      
      if (typeof turno.fecha === 'string') {
        // Si es string ISO, extraer solo la parte de fecha
        if (turno.fecha.includes('T')) {
          turnoDate = turno.fecha.split('T')[0];
        } else {
          turnoDate = turno.fecha;
        }
      } else {
        // Si es Date object
        turnoDate = format(new Date(turno.fecha), 'yyyy-MM-dd');
      }
      
      const turnoServiceId = typeof turno.servicio === 'string' ? turno.servicio : turno.servicio?._id;
      
      return turnoDate === dateString && 
             turno.hora === time && 
             turnoServiceId === serviceId;
    });
  };

  // Filter available times based on selected date and service
  const getAvailableTimes = (): string[] => {
    if (!selectedDate || !selectedService) return availableTimes;
    
    // Filtrar por regla de 48 horas
    const times48h = availableTimes.filter(time => {
      return validateTurnoTime(selectedDate, time);
    });
    
    // Filtrar por horarios ya ocupados
    const timesNotOccupied = times48h.filter(time => {
      return !isTimeSlotOccupied(selectedDate, time, selectedService._id);
    });
    
    return timesNotOccupied;
  };

  // Get times that are blocked by 48h rule (for display)
  const getTimesBlockedBy48h = (): string[] => {
    if (!selectedDate) return [];
    
    return availableTimes.filter(time => {
      return !validateTurnoTime(selectedDate, time);
    });
  };

  // Get times that are occupied by other reservations (for display)
  const getOccupiedTimes = (): string[] => {
    if (!selectedDate || !selectedService) return [];
    
    // Solo horarios que pasan la regla de 48h pero están ocupados
    const times48h = availableTimes.filter(time => {
      return validateTurnoTime(selectedDate, time);
    });
    
    return times48h.filter(time => {
      return isTimeSlotOccupied(selectedDate, time, selectedService._id);
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !user) {
      setFormError('Por favor complete todos los campos');
      return;
    }

    // Final validation before submission
    if (!validateTurnoTime(selectedDate, selectedTime)) {
      setFormError('El turno debe reservarse con al menos 48 horas de anticipación.');
      return;
    }

    // Check if time slot is still available
    if (isTimeSlotOccupied(selectedDate, selectedTime, selectedService._id)) {
      setFormError('Este horario ya no está disponible. Por favor, selecciona otro.');
      return;
    }

    setFormError(null);
    
    try {
      // Get user ID from context or localStorage
      let clienteId = user._id;
      
      // Fallback to localStorage if user ID is not in context
      if (!clienteId) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          clienteId = parsedUser._id;
        }
      }
      
      if (!clienteId) {
        throw new Error('No se pudo obtener el ID de usuario. Por favor, inicia sesión nuevamente.');
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró tu token de autenticación. Por favor, inicia sesión nuevamente.');
      }
      
      // Create turno data object
      const turnoData = {
        cliente: clienteId,
        servicio: selectedService._id,
        fecha: format(selectedDate, 'yyyy-MM-dd'),
        hora: selectedTime
      };
      
      // Add timeout handling
      const controller = new AbortController();
      const timeout = 15000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Send request to API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/create?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(turnoData),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check for HTML response first
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      if (contentType && contentType.includes('text/html')) {
        if (responseText.includes('application is starting') || 
            responseText.includes('building')) {
          throw new Error('El servidor está iniciando. Por favor espera unos momentos e intenta nuevamente.');
        }
        
        throw new Error('El servidor respondió con HTML en lugar de JSON. Intenta de nuevo más tarde.');
      }
      
      // Try to parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('La respuesta del servidor no es un JSON válido');
      }
      
      if (!response.ok) {
        throw new Error(data.message || `Error del servidor: ${response.status}`);
      }
      
      toast.success('Turno reservado con éxito');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al crear turno:', error);
      
      // More specific error messages
      let errorMessage = 'Error al reservar el turno';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'La solicitud tomó demasiado tiempo. Por favor, inténtalo de nuevo.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'No se pudo conectar con el servidor. El servidor puede estar iniciando o inactivo.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setFormError(errorMessage);
    }
  };

  // Modal content based on current step
  const renderStepContent = () => {
    // Loading state
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <p>Cargando servicios...</p>
        </div>
      );
    }
    
    // Error state
    if (formError && !selectedService && !selectedDate && !selectedTime) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>{formError}</p>
        </div>
      );
    }

    // Step 1: Service selection
    if (step === 1) {
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-lora text-primary">Selecciona un servicio</h2>
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
            {services.map((service) => (
              <div 
                key={service._id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedService?._id === service._id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setSelectedService(service)}
              >
                <h3 className="text-lg font-medium">{service.nombre}</h3>
                <p className="text-gray-500 text-sm">{service.descripcion}</p>
                <p className="mt-2 text-primary font-semibold">${service.precio}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Step 2: Date selection
    if (step === 2) {
      const availableTimesForDate = getAvailableTimes();
      const blockedBy48h = getTimesBlockedBy48h();
      const occupiedTimes = getOccupiedTimes();
      
      const hasLimitedTimes = availableTimesForDate.length < availableTimes.length;
      const hasNoAvailableTimes = availableTimesForDate.length === 0;
      
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-lora text-primary">Selecciona una fecha</h2>
          
          {/* Información general */}
          {!selectedDate && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 Selecciona el día que prefieras para tu cita
              </p>
            </div>
          )}
          
          {/* Advertencia específica */}
          {selectedDate && hasLimitedTimes && !hasNoAvailableTimes && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Esta fecha tiene horarios limitados
                {blockedBy48h.length > 0 && ` (${blockedBy48h.length} por 48h)`}
                {occupiedTimes.length > 0 && ` (${occupiedTimes.length} ocupados)`}
              </p>
            </div>
          )}
          
          {/* Error - cuando no hay horarios disponibles */}
          {selectedDate && hasNoAvailableTimes && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                ❌ Esta fecha no tiene horarios disponibles para este servicio
              </p>
            </div>
          )}
          
          <div className="flex justify-center">
            <div className="p-2 bg-white rounded-lg shadow-sm calendar-container">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                fromDate={minDate}
                disabled={[
                  { dayOfWeek: [0] }, // Domingo deshabilitado
                ]}
                classNames={{
                  day_selected: 'rdp-day_selected',
                  day_today: 'font-bold text-accent',
                  day: 'hover:bg-accent/20 transition-colors'
                }}
              />
            </div>
          </div>
          
          {/* Leyenda explicativa */}
          <div className="text-xs text-gray-600 grid grid-cols-2 gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded"></div>
              <span>Seleccionada</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-200 rounded"></div>
              <span>Cerrado</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Step 3: Time selection and confirmation
    if (step === 3) {
      const availableTimesForDate = getAvailableTimes();
      const blockedBy48h = getTimesBlockedBy48h();
      const occupiedTimes = getOccupiedTimes();
      
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-lora text-primary">Selecciona la hora</h2>
          
          {availableTimesForDate.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableTimesForDate.map((time) => (
                  <button
                    key={time}
                    className={`py-2 px-3 border rounded-lg text-center transition-all text-sm ${
                      selectedTime === time 
                        ? 'bg-primary text-white border-primary' 
                        : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    }`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              
              {/* Show unavailable times */}
              {(blockedBy48h.length > 0 || occupiedTimes.length > 0) && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">No disponibles:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Times blocked by 48h rule */}
                    {blockedBy48h.map((time) => (
                      <div
                        key={time}
                        className="py-2 px-3 border border-gray-200 rounded-lg text-center text-gray-400 bg-gray-50 text-sm"
                        title="No disponible - menos de 48 horas"
                      >
                        <span className="line-through">{time}</span>
                        <div className="text-xs">48h</div>
                      </div>
                    ))}
                    {/* Times occupied by other reservations */}
                    {occupiedTimes.map((time) => (
                      <div
                        key={time}
                        className="py-2 px-3 border border-red-200 rounded-lg text-center text-red-400 bg-red-50 text-sm"
                        title="Horario ocupado por otra reserva"
                      >
                        <span className="line-through">{time}</span>
                        <div className="text-xs">Ocupado</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Booking summary */}
          {selectedService && selectedDate && selectedTime && (
            <div className="p-3 bg-soft/50 rounded-lg border border-accent/30">
              <h3 className="text-lg font-lora text-primary mb-2">Resumen</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Servicio:</span> {selectedService.nombre}</p>
                <p><span className="font-medium">Fecha:</span> {format(selectedDate, 'dd/MM/yyyy')}</p>
                <p><span className="font-medium">Hora:</span> {selectedTime}</p>
                <p><span className="font-medium">Precio:</span> ${selectedService.precio}</p>
              </div>
            </div>
          )}
          
          {formError && (
            <div className="p-2 bg-red-50 text-red-700 rounded-md text-sm">
              {formError}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Navigation buttons based on current step
  const renderNavigation = () => {
    const availableTimesForDate = selectedDate && selectedService ? getAvailableTimes() : [];
    const canProceedToStep3 = step === 2 && selectedDate && availableTimesForDate.length > 0;
    
    return (
      <div className="flex justify-between">
        {step > 1 && (
          <button
            type="button"
            onClick={() => {
              setStep(step - 1);
              setFormError(null);
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Anterior
          </button>
        )}
        
        <div className="flex-1"></div>
        
        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !selectedService) {
                setFormError('Por favor, selecciona un servicio');
                return;
              }
              if (step === 2 && !selectedDate) {
                setFormError('Por favor, selecciona una fecha');
                return;
              }
              if (step === 2 && !canProceedToStep3) {
                setFormError('La fecha seleccionada no tiene horarios disponibles para este servicio');
                return;
              }
              setFormError(null);
              setStep(step + 1);
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            disabled={(step === 1 && !selectedService) || (step === 2 && !canProceedToStep3)}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            disabled={!selectedService || !selectedDate || !selectedTime}
          >
            Confirmar Reserva
          </button>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col"
          >
            {/* Header fijo */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-primary">
                  Reservar Turno
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                  title="Cerrar modal"
                >
                  ✕
                </button>
              </div>
              
              {/* Progress steps indicator */}
              <div>
                <div className="flex justify-between items-center">
                  {[1, 2, 3].map((stepNumber) => (
                    <div 
                      key={stepNumber}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step >= stepNumber ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {stepNumber}
                    </div>
                  ))}
                </div>
                <div className="relative mt-2">
                  <div className="absolute w-full h-1 bg-gray-200"></div>
                  <div 
                    className={`absolute h-1 bg-primary transition-all duration-300 ${
                      step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'
                    }`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderStepContent()}
            </div>
            
            {/* Navigation fijo en la parte inferior */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              {renderNavigation()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}