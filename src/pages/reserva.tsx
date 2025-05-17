'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import PageHero from '@/components/PageHero';
import { format, addDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { toast } from 'react-hot-toast';
import { IService, ICreateTurnoRequest } from '@/types';
import styles from '@/styles/reserva.module.css';

export default function ReservaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el formulario
  const [selectedService, setSelectedService] = useState<IService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Fecha mínima (48 horas desde ahora)
  const minDate = addDays(new Date(), 2);
  
  // Horarios disponibles
  const availableTimes = [
    '9:00', '10:00', '11:00', '12:00', 
    '14:00', '15:00', '16:00', '17:00'
  ];

  // Verificar autenticación
  useEffect(() => {
    if (!user) {
      toast.error('Debes iniciar sesión para reservar un turno');
      router.push('/login');
    }
  }, [user, router]);

  // Cargar servicios
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`);
        if (!res.ok) throw new Error('Error al cargar servicios');
        
        const data = await res.json();
        setServices(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('No se pudieron cargar los servicios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, []);

  // Verificar disponibilidad de horario (podría implementarse en el futuro)
  const checkAvailability = async (serviceId: string, date: string, time: string) => {
    // Por ahora simplemente devuelve true
    // En el futuro podría consultar al backend para verificar disponibilidad
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !user) {
      setFormError('Por favor complete todos los campos');
      return;
    }

    setFormError(null);
    
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const isAvailable = await checkAvailability(
        selectedService._id, 
        formattedDate,
        selectedTime
      );
      
      if (!isAvailable) {
        setFormError('El horario seleccionado no está disponible');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // Crear objeto de datos según lo que espera el backend
      const turnoData: ICreateTurnoRequest = {
        cliente: user._id,
        servicio: selectedService._id,
        fecha: selectedDate,
        hora: selectedTime,
        estado: 'pendiente'
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(turnoData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el turno');
      }
      
      toast.success('Turno reservado con éxito');
      router.push('/turnos');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al reservar el turno');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  return (
    <>
      <PageHero
        title="Reserva de Turnos"
        description="Seleccioná el servicio y la fecha para tu próxima visita a Sentirse Bien"
      />
      
      <div className="max-w-4xl mx-auto p-6 my-12 bg-white rounded-xl shadow-lg">
        {/* Indicador de pasos */}
        <div className="mb-8">
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

        {/* Paso 1: Selección de servicio */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-lora text-primary">Selecciona un servicio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex justify-end mt-4">
              <button
                className="px-6 py-2 bg-primary text-white rounded-md disabled:opacity-50"
                disabled={!selectedService}
                onClick={() => setStep(2)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Selección de fecha */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-lora text-primary">Selecciona una fecha</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className={styles.dayPickerStyles}>
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                    fromDate={minDate}
                    disabled={[
                      { dayOfWeek: [0] }, // Domingo deshabilitado
                    ]}
                    modifiers={{
                      available: (date) => {
                        return isAfter(date, minDate);
                      }
                    }}
                    classNames={{
                      day_selected: 'rdp-day_selected',
                      day_today: 'rdp-day_today',
                      day: 'rdp-day'
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md"
                onClick={() => setStep(1)}
              >
                Anterior
              </button>
              <button
                className="px-6 py-2 bg-primary text-white rounded-md disabled:opacity-50"
                disabled={!selectedDate}
                onClick={() => setStep(3)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Paso 3: Selección de hora y confirmación */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-lora text-primary">Selecciona la hora</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  className={`py-3 px-4 border rounded-lg text-center transition-all ${
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
            
            {/* Resumen de la reserva */}
            {selectedService && selectedDate && selectedTime && (
              <div className="mt-8 p-4 bg-soft/50 rounded-lg border border-accent/30">
                <h3 className="text-xl font-lora text-primary mb-3">Resumen de reserva</h3>
                <div className="space-y-2">
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
            
            <div className="flex justify-between mt-4">
              <button
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md"
                onClick={() => setStep(2)}
              >
                Anterior
              </button>
              <button
                className="px-6 py-2 bg-primary text-white rounded-md disabled:opacity-50"
                disabled={!selectedTime}
                onClick={handleSubmit}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}