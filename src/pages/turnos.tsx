'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import PageHero from '@/components/PageHero';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ITurnoPopulated } from '@/types';
import ReservaModal from '@/components/ReservaModal';
import dynamic from 'next/dynamic';

// Create a client-side only version of the page to avoid hydration errors
const TurnosPage = () => {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();
  const [turnos, setTurnos] = useState<ITurnoPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // For client-side rendering only
  const [isMounted, setIsMounted] = useState(false);

  // Estados para filtrado
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  useEffect(() => {
    // Prevent hydration issues by setting this after the component mounts
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return; // Skip server-side rendering

    console.log("Effect running, auth state:", { 
      user: !!user, 
      isAuthLoaded, 
      token: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false 
    });
    
    // Only proceed when auth is fully loaded
    if (!isAuthLoaded) {
      console.log("Auth still loading, waiting...");
      return;
    }
    
    // Now check if user exists
    if (!user) {
      console.log("No user found after auth loaded, redirecting to login");
      toast.error('Debes iniciar sesión para ver tus turnos');
      router.push('/login');
      return;
    }
    
    fetchTurnos();
  }, [user, isAuthLoaded, isMounted]); // Add isMounted to dependencies

  const fetchTurnos = async (retryCount = 0, maxRetries = 3) => {
    if (!user?._id) {
      console.log('No user ID available, skipping fetch');
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available in localStorage');
        toast.error('No se encontró tu token de autenticación. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        setLoading(false);
        return;
      }
      
      // Use token as URL parameter to avoid CORS issues with Authorization header
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });
      
      console.log('Response status:', res.status);
      
      // Check for HTML response
      const contentType = res.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      // Try to parse response text first to debug
      const responseText = await res.text();
      console.log('Response body preview:', responseText.substring(0, 200));
      
      if (contentType && contentType.includes('text/html')) {
        // Provide more specific error info
        console.error('Server returned HTML instead of JSON. HTML preview:', responseText.substring(0, 300));
        
        // Verificar si es un problema de inicio de Render
        if (responseText.includes('application is starting') || 
            responseText.includes('building')) {
          throw new Error('El servidor está iniciando. Por favor espera unos momentos e intenta nuevamente.');
        }
        
        // Verificar si parece un error de autenticación
        if (responseText.includes('login') || responseText.includes('unauthorized') ||
            responseText.includes('not authorized')) {
          // Limpiar token y datos de usuario localmente
          localStorage.removeItem('token');
          toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          router.push('/login');
          return;
        }
        
        throw new Error('El servidor devolvió HTML en lugar de JSON. Posible problema de autenticación.');
      }
      
      // Now try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('La respuesta del servidor no es un JSON válido');
      }
      
      if (!res.ok) {
        throw new Error(data.message || `Error del servidor: ${res.status}`);
      }
      
      if (Array.isArray(data)) {
        // Filtrar los turnos del usuario en el frontend
        const userTurnos = data.filter(turno => 
          turno.cliente === user._id || 
          turno.cliente?._id === user._id
        );
        setTurnos(userTurnos);
      } else {
      }
      setLoading(false);
    } catch (error) {
      // Combina ambos bloques catch aquí
    
      // Primero maneja los errores de AbortError (anteriormente en el primer catch)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request timed out after ${timeout / 1000} seconds`);
        // Don't throw here, just retry
        if (retryCount < maxRetries) {
          console.log('Timeout occurred, trying again...');
          toast.loading(`El servidor está tardando en responder. Reintentando automáticamente...`);
          
          // Shorter delay for timeout retries
          setTimeout(() => {
            toast.dismiss();
            fetchTurnos(retryCount + 1, maxRetries);
          }, 1000); // Just a short pause before retry
          return;
        }
        error = new Error('La solicitud tomó demasiado tiempo y fue cancelada después de varios intentos');
      }

      // Ahora maneja todos los tipos de errores (lo que estaba en el segundo catch)
      console.error('Full error:', error);
      
      // If this was a network error and we haven't exceeded max retries, try again
      if ((error instanceof TypeError && error.message.includes('Failed to fetch')) && 
          retryCount < maxRetries) {
        
        // Increase max retries to 3 (from 2) for Render's cold start
        // Create a toast ID but don't auto-dismiss it
        toast.loading(`El servidor parece estar iniciando. Reintentando en ${(retryCount + 1) * 5} segundos...`);
        
        // Increase delay for longer server bootup time
        const delay = (retryCount + 1) * 5000; // 5, 10, 15 seconds
        
        // Try again with longer backoff
        setTimeout(() => {
          toast.dismiss();
          fetchTurnos(retryCount + 1, maxRetries);
        }, delay);
        return;
      }
      
      // More specific error messages depending on the error
      let errorMessage = 'No se pudieron cargar tus turnos';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. El servidor puede estar iniciando o inactivo. Por favor, inténtalo de nuevo en unos momentos.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      if (error instanceof TypeError && error.message.includes('blocked by CORS policy')) {
        errorMessage = 'Error de permisos CORS. Contacta al administrador del sistema.';
      }
      
      toast.error(errorMessage);
      setTurnos([]);
      setLoading(false);
    }
  };

  const handleCancelTurno = async (turnoId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este turno?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró tu token de autenticación');
        return;
      }
      
      // Primero obtenemos el turno actual
      const turnoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/${turnoId}?token=${token}`);
      if (!turnoResponse.ok) {
        throw new Error('No se pudo obtener la información del turno');
      }
      
      const turnoActual = await turnoResponse.json();
      
      // Actualizamos solo el estado
      turnoActual.estado = 'cancelado';
      
      // Enviamos el turno completo con el estado actualizado
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(turnoActual)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al cancelar el turno');
      }
      
      toast.success('Turno cancelado con éxito');
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

  // If not mounted yet, return a simple loading state to avoid hydration issues
  if (!isMounted) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="mb-4">Cargando...</p>
        <details className="text-sm text-gray-500 max-w-md p-4 bg-gray-50 rounded">
          <summary className="cursor-pointer">Información de depuración</summary>
          <div className="mt-2 text-xs">
            <p>Usuario ID: {user?._id || 'No disponible'}</p>
            <p>API Endpoint: {process.env.NEXT_PUBLIC_API_TURNO ? 'Configurado' : 'No configurado'}</p>
            <p>Token: {typeof window !== 'undefined' && localStorage.getItem('token') ? 'Presente' : 'No disponible'}</p>
          </div>
        </details>
      </div>
    );
  }

  return (
    <>
      <PageHero
        title="Mis Turnos"
        description="Gestiona tus reservas en Sentirse Bien"
      />
      
      <div className="max-w-6xl mx-auto p-6 my-12">
        {/* Filtros y botón de reserva */}
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
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Reservar Nuevo Turno
          </button>
        </div>
        
        {filteredTurnos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No tienes turnos {statusFilter !== 'todos' ? `con estado "${statusFilter}"` : ''}</p>
            <button
              onClick={() => setIsModalOpen(true)}
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
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">
                        Precio: ${turno.servicio.precio}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Reserva */}
      <ReservaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTurnos}
      />
    </>
  );
};

// Use Next.js dynamic import with SSR disabled to prevent hydration issues
export default dynamic(() => Promise.resolve(TurnosPage), { ssr: false });