import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IService } from '@/types';
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
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Date constraints - Usar días completos en lugar de horas exactas
  const today = new Date();
  const minDate = addDays(startOfDay(today), 2); // 2 días completos desde hoy
  
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

  // Validate 48-hour rule for selected date and time - MEJORADO
  const validateTurnoTime = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(':').map(Number);
    const turnoDateTime = new Date(date);
    turnoDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const minimumTime = addHours(now, 48);
    
    // Agregar un pequeño margen de tolerancia (1 hora)
    return turnoDateTime.getTime() > minimumTime.getTime();
  };

  // Filter available times based on selected date - MEJORADO
  const getAvailableTimes = (): string[] => {
    if (!selectedDate) return availableTimes;
    
    // Si la fecha seleccionada es hoy o mañana, filtrar horarios
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);
    
    const selectedDay = startOfDay(selectedDate);
    
    // Si es pasado mañana o posterior, todos los horarios están disponibles
    if (selectedDay >= dayAfterTomorrow) {
      return availableTimes;
    }
    
    // Si es hoy o mañana, filtrar por horarios que cumplan las 48h
    return availableTimes.filter(time => {
      return validateTurnoTime(selectedDate, time);
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
      const timeout = 15000; // 15 seconds
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Send request to API - use token as URL param instead of Authorization header
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
        console.error('Server returned HTML instead of JSON');
        
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
        console.error('Error parsing JSON:', parseError);
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
        <div className="space-y-6">
          <h2 className="text-xl font-lora text-primary">Selecciona un servicio</h2>
          <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto">
            {services.map((service) => (
              <div 
                key={service._id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
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
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-lora text-primary">Selecciona una fecha</h2>
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ Los turnos deben reservarse con al menos 48 horas de anticipación
            </p>
          </div>
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                fromDate={today} // Cambiar a today en lugar de minDate
                disabled={[
                  { dayOfWeek: [0] }, // Domingo deshabilitado
                  { before: today } // Solo deshabilitar fechas pasadas
                ]}
                modifiers={{
                  available: (date) => {
                    return date >= today;
                  }
                }}
                classNames={{
                  day_selected: 'bg-primary text-white',
                  day_today: 'font-bold text-accent',
                  day: 'hover:bg-accent/20 transition-colors'
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    
    // Step 3: Time selection and confirmation
    if (step === 3) {
      const availableTimesForDate = getAvailableTimes();
      
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-lora text-primary">Selecciona la hora</h2>
          
          {availableTimesForDate.length === 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                No hay horarios disponibles para esta fecha que cumplan con la restricción de 48 horas.
                Por favor, selecciona otra fecha.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableTimesForDate.map((time) => (
                  <button
                    key={time}
                    className={`py-2 px-3 border rounded-lg text-center transition-all ${
                      selectedTime === time 
                        ? 'bg-primary text-white border-primary' 
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
              
              {/* Show unavailable times grayed out SOLO si hay algunos disponibles */}
              {availableTimes.length > availableTimesForDate.length && availableTimesForDate.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Horarios no disponibles (menos de 48hs):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableTimes.filter(time => !availableTimesForDate.includes(time)).map((time) => (
                      <div
                        key={time}
                        className="py-2 px-3 border border-gray-200 rounded-lg text-center text-gray-400 bg-gray-50"
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Booking summary */}
          {selectedService && selectedDate && selectedTime && (
            <div className="mt-4 p-4 bg-soft/50 rounded-lg border border-accent/30">
              <h3 className="text-lg font-lora text-primary mb-2">Resumen de reserva</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Servicio:</span> {selectedService.nombre}</p>
                <p><span className="font-medium">Fecha:</span> {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: es })}</p>
                <p><span className="font-medium">Hora:</span> {selectedTime}</p>
                <p><span className="font-medium">Precio:</span> ${selectedService.precio}</p>
              </div>
            </div>
          )}
          
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
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
    const availableTimesForDate = selectedDate ? getAvailableTimes() : [];
    const canProceedToStep3 = step === 2 && selectedDate && availableTimesForDate.length > 0;
    
    return (
      <div className="flex justify-between mt-6">
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
                setFormError('La fecha seleccionada no tiene horarios disponibles');
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
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
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
            <div className="mb-6">
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

            {/* Step content */}
            <div className="min-h-[300px]">
              {renderStepContent()}
            </div>
            
            {/* Navigation */}
            {renderNavigation()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}