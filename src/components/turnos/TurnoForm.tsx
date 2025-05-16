'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { IService, ITurnoBase } from '../../types';

interface TurnoFormProps {
  services: IService[];
}

export default function TurnoForm({ services }: TurnoFormProps) {
  const [formData, setFormData] = useState({
    servicio: '',
    fecha: '',
    hora: '',
    notas: ''
  });
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ _id: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Obtener el usuario actual
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_USER}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener usuario');
        }

        const data = await response.json();
        setCurrentUser(data);
      } catch (error) {
        console.error('Error:', error);
        router.push('/login');
      }
    };

    fetchCurrentUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'fecha') {
      actualizarHorariosDisponibles(value);
    }
  };

  const actualizarHorariosDisponibles = async (fecha: string) => {
    if (!fecha) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/disponibles?date=${fecha}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setHorariosDisponibles(data.map((slot: any) => slot.startTime));
    } catch (error) {
      console.error('Error al obtener horarios disponibles:', error);
      toast.error('Error al cargar los horarios disponibles');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Debes iniciar sesión para reservar un turno');
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      const turnoData: ITurnoBase = {
        cliente: currentUser._id,
        servicio: formData.servicio,
        fecha: new Date(formData.fecha),
        hora: formData.hora,
        estado: 'pendiente'
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(turnoData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al reservar el turno');
      }

      toast.success('Turno reservado exitosamente');
      router.push('/turnos');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al reservar el turno');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <div>Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="servicio" className="block text-sm font-medium text-gray-700 mb-1">
          Servicio
        </label>
        <select
          id="servicio"
          name="servicio"
          value={formData.servicio}
          onChange={handleChange}
          className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
          required
        >
          <option value="">Selecciona un servicio</option>
          {services.map((service) => (
            <option key={service._id} value={service._id}>
              {service.nombre} - ${service.precio}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
          Fecha
        </label>
        <input
          type="date"
          id="fecha"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
          className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
          required
        />
      </div>

      <div>
        <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
          Hora
        </label>
        <select
          id="hora"
          name="hora"
          value={formData.hora}
          onChange={handleChange}
          className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
          required
          disabled={!formData.fecha}
        >
          <option value="">Selecciona una hora</option>
          {formData.fecha ? (
            horariosDisponibles.length > 0 ? (
              horariosDisponibles.map((hora) => (
                <option key={hora} value={hora}>
                  {hora}
                </option>
              ))
            ) : (
              <option value="" disabled>No hay horarios disponibles</option>
            )
          ) : (
            <option value="" disabled>Selecciona una fecha</option>
          )}
        </select>
      </div>

      <div>
        <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
          Notas adicionales (opcional)
        </label>
        <textarea
          id="notas"
          name="notas"
          value={formData.notas}
          onChange={handleChange}
          rows={4}
          className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
          placeholder="Escribe aquí cualquier información adicional que quieras compartir..."
        />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-[#436E6C] hover:bg-[#5A9A98] text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Reservando...' : 'Confirmar Reserva'}
        </button>
      </div>
    </form>
  );
}