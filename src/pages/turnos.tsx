'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import PageHero from '@/components/PageHero';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ITurno } from '@/types';

export default function TurnosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [turnos, setTurnos] = useState<ITurno[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para filtrado
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  useEffect(() => {
    if (!user) {
      toast.error('Debes iniciar sesión para ver tus turnos');
      router.push('/login');
    } else {
      fetchTurnos();
    }
  }, [user, router]);

  const fetchTurnos = async () => {
    if (!user?._id) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al obtener los turnos');
      }
      
      const data = await res.json();
      setTurnos(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar tus turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTurno = async (turnoId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este turno?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: 'cancelado'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al cancelar el turno');
      }
      
      toast.success('Turno cancelado con éxito');
      // Actualizar la lista de turnos
      fetchTurnos();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cancelar el turno');
    }
  };

  const filteredTurnos = turnos.filter(turno => {
    if (statusFilter === 'todos') return true;
    return turno.estado === statusFilter;
  });

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  return (
    <>
      <PageHero
        title="Mis Turnos"
        description="Gestiona tus reservas en Sentirse Bien"
      />
      
      <div className="max-w-6xl mx-auto p-6 my-12">
        {/* Filtros */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="statusFilter" className="mr-2 text-primary font-medium">Filtrar por estado:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Cancelados</option>
              <option value="realizado">Realizados</option>
            </select>
          </div>
          
          <button
            onClick={() => router.push('/reserva')}
            className="bg-primary text-white px-4 py-2 rounded-md"
          >
            Reservar Nuevo Turno
          </button>
        </div>
        
        {filteredTurnos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No tienes turnos {statusFilter !== 'todos' ? `con estado "${statusFilter}"` : ''}</p>
            <button
              onClick={() => router.push('/reserva')}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-md"
            >
              Reservar Ahora
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTurnos.map((turno) => {
              // Asegúrate de que fecha sea un objeto Date
              const fecha = new Date(turno.fecha);
              
              return (
                <div 
                  key={turno._id}
                  className={`p-5 rounded-lg shadow border-l-4 ${
                    turno.estado === 'pendiente' ? 'border-yellow-400 bg-yellow-50' :
                    turno.estado === 'confirmado' ? 'border-green-400 bg-green-50' :
                    turno.estado === 'cancelado' ? 'border-red-400 bg-red-50' :
                    'border-blue-400 bg-blue-50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-semibold">{turno.servicio.nombre}</h3>
                      <p className="text-gray-600 mt-1">
                        {format(fecha, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })} - {turno.hora}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span 
                        className={`px-3 py-1 rounded-full text-sm ${
                          turno.estado === 'pendiente' ? 'bg-yellow-200 text-yellow-800' :
                          turno.estado === 'confirmado' ? 'bg-green-200 text-green-800' :
                          turno.estado === 'cancelado' ? 'bg-red-200 text-red-800' :
                          'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                      </span>
                      
                      {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                        <button
                          onClick={() => handleCancelTurno(turno._id)}
                          className="px-3 py-1 bg-white border border-red-500 text-red-500 rounded-md text-sm hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <p className="text-gray-600 text-sm">Precio: ${turno.servicio.precio}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}