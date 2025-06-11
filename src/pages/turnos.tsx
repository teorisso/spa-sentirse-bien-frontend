'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import PageHero from '@/components/PageHero';
import { format, addHours, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ITurnoPopulated } from '@/types';
import ReservaModal from '@/components/ReservaModal';
import dynamic from 'next/dynamic';
import { FileText } from 'lucide-react';

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
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    console.log("Effect running, auth state:", { 
      user: !!user, 
      isAuthLoaded, 
      token: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false 
    });
    
    if (!isAuthLoaded) {
      console.log("Auth still loading, waiting...");
      return;
    }
    
    if (!user) {
      console.log("No user found after auth loaded, redirecting to login");
      toast.error('Debes iniciar sesión para ver tus turnos');
      router.push('/login');
      return;
    }
    
    fetchTurnos();
  }, [user, isAuthLoaded, isMounted, router]);

  const fetchTurnos = async (retryCount = 0, maxRetries = 3) => {
    if (!user?._id) {
      console.log('No user ID available, skipping fetch');
      setLoading(false);
      return;
    }
    
    const timeout = 15000;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available in localStorage');
        toast.error('No se encontró tu token de autenticación. Por favor, inicia sesión nuevamente.');
        router.push('/login');
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}?token=${token}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });
      
      console.log('Response status:', res.status);
      
      const contentType = res.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      const responseText = await res.text();
      console.log('Response body preview:', responseText.substring(0, 200));
      
      if (contentType && contentType.includes('text/html')) {
        console.error('Server returned HTML instead of JSON. HTML preview:', responseText.substring(0, 300));
        
        if (responseText.includes('application is starting') || 
            responseText.includes('building')) {
          throw new Error('El servidor está iniciando. Por favor espera unos momentos e intenta nuevamente.');
        }
        
        if (responseText.includes('login') || responseText.includes('unauthorized') ||
            responseText.includes('not authorized')) {
          localStorage.removeItem('token');
          toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          router.push('/login');
          return;
        }
        
        throw new Error('El servidor devolvió HTML en lugar de JSON. Posible problema de autenticación.');
      }
      
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
        const userTurnos = data.filter(turno => 
          turno.cliente === user._id || 
          turno.cliente?._id === user._id
        );

        // Enriquecer con profesionales si vienen sin poblar
        const profesIdsFaltantes = userTurnos
          .filter(t => typeof t.profesional === 'string')
          .map(t => t.profesional as string);
        const uniqueIds = Array.from(new Set(profesIdsFaltantes));

        if (uniqueIds.length) {
          try {
            const resProfs = await fetch(`${process.env.NEXT_PUBLIC_API_USER}`);
            if (resProfs.ok) {
              const allUsers = await resProfs.json();
              const profMap: Record<string, any> = {};
              allUsers.forEach((u: any) => {
                profMap[u._id] = u;
              });
              userTurnos.forEach(t => {
                if (typeof t.profesional === 'string' && profMap[t.profesional]) {
                  (t as any).profesional = profMap[t.profesional];
                }
                if (typeof t.profesional === 'string') {
                  (t as any).profesional = null;
                }
              });
            }
          } catch {}
        }
        setTurnos(userTurnos);
      } else {
        setTurnos([]);
      }
      setLoading(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Request timed out after ${timeout / 1000} seconds`);
        if (retryCount < maxRetries) {
          console.log('Timeout occurred, trying again...');
          toast.loading(`El servidor está tardando en responder. Reintentando automáticamente...`);
          
          setTimeout(() => {
            toast.dismiss();
            fetchTurnos(retryCount + 1, maxRetries);
          }, 1000);
          return;
        }
        error = new Error('La solicitud tomó demasiado tiempo y fue cancelada después de varios intentos');
      }

      console.error('Full error:', error);
      
      if ((error instanceof TypeError && error.message.includes('Failed to fetch')) && 
          retryCount < maxRetries) {
        
        toast.loading(`El servidor parece estar iniciando. Reintentando en ${(retryCount + 1) * 5} segundos...`);
        
        const delay = (retryCount + 1) * 5000;
        
        setTimeout(() => {
          toast.dismiss();
          fetchTurnos(retryCount + 1, maxRetries);
        }, delay);
        return;
      }
      
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
      
      // Buscar el turno en el estado actual para obtener toda la información
      const turnoACancelar = turnos.find(t => t._id === turnoId);
      if (!turnoACancelar) {
        toast.error('No se encontró el turno a cancelar');
        return;
      }
      
      // Preparar el objeto del turno con el estado actualizado
      const turnoActualizado = {
        cliente: typeof turnoACancelar.cliente === 'string' 
          ? turnoACancelar.cliente 
          : turnoACancelar.cliente._id,
        servicio: typeof turnoACancelar.servicio === 'string' 
          ? turnoACancelar.servicio 
          : turnoACancelar.servicio._id,
        fecha: typeof turnoACancelar.fecha === 'string' 
          ? turnoACancelar.fecha 
          : turnoACancelar.fecha.toISOString(),
        hora: turnoACancelar.hora,
        estado: 'cancelado'
      };
      
      console.log('Enviando datos de cancelación:', turnoActualizado);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}?token=${token}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(turnoActualizado)
      });
      
      console.log('Status de respuesta de cancelación:', res.status);
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        const responseText = await res.text();
        
        console.error('Error en cancelación:', responseText);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || 'Error al cancelar el turno');
          } catch (parseError) {
            throw new Error('Error al cancelar el turno');
          }
        } else {
          throw new Error(`Error del servidor: ${res.status}`);
        }
      }
      
      // Verificar que la respuesta sea JSON válido
      const responseText = await res.text();
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          console.log('Respuesta exitosa de cancelación:', responseData);
        } catch (parseError) {
          console.warn('Respuesta no es JSON válido, pero la operación fue exitosa');
        }
      }
      
      toast.success('Turno cancelado con éxito');
      
      // Actualizar el estado local inmediatamente para mejor UX
      setTurnos(prevTurnos => 
        prevTurnos.map(turno => 
          turno._id === turnoId 
            ? { ...turno, estado: 'cancelado' as const }
            : turno
        )
      );
      
      // Recargar todos los turnos para asegurar consistencia
      setTimeout(() => {
        fetchTurnos();
      }, 500);
      
    } catch (error) {
      console.error('Error completo al cancelar turno:', error);
      
      let errorMessage = 'Error al cancelar el turno';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Mensajes específicos para ciertos tipos de error
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          localStorage.removeItem('token');
          router.push('/login');
          return;
        } else if (error.message.includes('48 horas')) {
          errorMessage = 'Este turno ya no se puede cancelar porque faltan menos de 48 horas.';
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handlePrintTurno = (turno: ITurnoPopulated) => {
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime().toString();
    const printWindow = window.open(windowUrl, uniqueName);
    
    if (printWindow) {
      // CORREGIDO: Manejo consistente de fechas
      const fechaString = typeof turno.fecha === 'string' ? turno.fecha : turno.fecha.toISOString();
      const fecha = parseISO(fechaString.split('T')[0]);
      const fechaFormateada = format(fecha, "dd 'de' MMMM 'de' yyyy", { locale: es });
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Turno - Spa Sentirse Bien</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 20px;
              }
              .header h1 {
                color: #7D8C88;
                margin-bottom: 5px;
              }
              .turno-details {
                margin-bottom: 30px;
              }
              .turno-details h2 {
                color: #7D8C88;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
              }
              .detail-row {
                display: flex;
                margin-bottom: 15px;
              }
              .detail-label {
                font-weight: bold;
                width: 150px;
              }
              .status {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 15px;
                font-weight: bold;
                font-size: 14px;
                text-transform: uppercase;
              }
              .status-pendiente {
                color: #92400E;
              }
              .status-confirmado {
                color: #065F46;
              }
              .status-cancelado {
                color: #B91C1C;
              }
              .status-realizado {
                color: #1E40AF;
              }
              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 14px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
              .price {
                font-size: 24px;
                font-weight: bold;
                color: #7D8C88;
              }
              @media print {
                body {
                  padding: 0;
                  margin: 15mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Spa Sentirse Bien</h1>
              <p>Comprobante de Turno</p>
            </div>
            
            <div class="turno-details">
              <h2>Datos del Turno</h2>
              
              <div class="detail-row">
                <div class="detail-label">Cliente:</div>
                <div>${user?.first_name} ${user?.last_name}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div>${user?.email}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Servicio:</div>
                <div>${turno.servicio.nombre}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Profesional:</div>
                <div>${turno.profesional ? `${turno.profesional.first_name} ${turno.profesional.last_name}` : 'Falta asignar profesional'}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Descripción:</div>
                <div>${turno.servicio.descripcion}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Fecha:</div>
                <div>${fechaFormateada}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Hora:</div>
                <div>${turno.hora}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Estado:</div>
                <div>
                  <span class="status status-${turno.estado}">
                    ${turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                  </span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Precio:</div>
                <div class="price">$${turno.servicio.precio}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>Gracias por confiar en Spa Sentirse Bien</p>
              <p>Este comprobante fue generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
              <p>Para cualquier consulta, comunícate con nosotros al teléfono: (011) 4444-5555</p>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const canCancelTurno = (turno: ITurnoPopulated): boolean => {
    // CORREGIDO: Manejo consistente de fechas
    const fechaString = typeof turno.fecha === 'string' ? turno.fecha : turno.fecha.toISOString();
    const fecha = parseISO(fechaString.split('T')[0]);
    const [hours, minutes] = turno.hora.split(':').map(Number);
    fecha.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const cancelLimit = addHours(now, 48);
    
    return fecha > cancelLimit;
  };

  const filteredTurnos = turnos.filter(turno => {
    if (statusFilter === 'todos') return true;
    return turno.estado === statusFilter;
  });

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
              // CORREGIDO: Manejo consistente de fechas
              const fechaString = typeof turno.fecha === 'string' ? turno.fecha : turno.fecha.toISOString();
              const fecha = parseISO(fechaString.split('T')[0]);
              const canCancel = canCancelTurno(turno);
              
              return (
                <div 
                  key={turno._id}
                  className="p-5 rounded-lg shadow border-l-4 border-primary bg-white hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-lg font-semibold">{turno.servicio.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Profesional: {turno.profesional ? `${turno.profesional.first_name} ${turno.profesional.last_name}` : 'Falta asignar profesional'}</p>
                      <p className="text-gray-600 mt-1">
                        {format(fecha, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })} - {turno.hora}
                      </p>
                      {!canCancel && (turno.estado === 'pendiente' || turno.estado === 'confirmado') && (
                        <p className="text-amber-600 text-sm mt-1">
                          ⚠️ Este turno ya no se puede cancelar (menos de 48hs)
                        </p>
                      )}
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
                      
                      {(turno.estado === 'pendiente' || turno.estado === 'confirmado') && canCancel && (
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
                    
                    <button
                      onClick={() => handlePrintTurno(turno)}
                      className="px-2 py-1 bg-gray-100 text-primary rounded hover:bg-gray-200 text-xs flex items-center gap-1 transition"
                      title="Imprimir comprobante"
                    >
                      <FileText size={12} />
                      <span>Imprimir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReservaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTurnos}
      />
    </>
  );
};

export default dynamic(() => Promise.resolve(TurnosPage), { ssr: false });