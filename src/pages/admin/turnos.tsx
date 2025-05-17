'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ITurno } from '@/types';
import { X, Calendar, Clock, User, FileText } from 'lucide-react';

export default function AdminTurnosPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [turnos, setTurnos] = useState<ITurno[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtrado
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  useEffect(() => {
    if (!user || !isAdmin) {
      toast.error('Acceso no autorizado');
      router.push('/login');
    } else {
      fetchTurnos();
    }
  }, [user, isAdmin, router]);

  const fetchTurnos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Error al obtener los turnos');
      
      const data = await res.json();
      setTurnos(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (turnoId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: newStatus
        })
      });
      
      if (!res.ok) throw new Error('Error al actualizar el estado');
      
      toast.success(`Estado actualizado a ${newStatus}`);
      fetchTurnos();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el estado');
    }
  };
  
  const handlePrintTurnos = () => {
    const printContent = document.getElementById('turnos-table');
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime().toString();
    
    if (printContent) {
      const printWindow = window.open(windowUrl, uniqueName);
      
      printWindow?.document.write(`
        <html>
          <head>
            <title>Turnos - Sentirse Bien</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Listado de Turnos - Spa Sentirse Bien</h1>
              <p>Fecha: ${format(new Date(), "dd/MM/yyyy")}</p>
            </div>
            ${printContent.outerHTML}
          </body>
        </html>
      `);
      
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  // Filtrado de turnos
  const filteredTurnos = turnos.filter(turno => {
    // Filtro por estado
    if (statusFilter !== 'todos' && turno.estado !== statusFilter) return false;
    
    // Filtro por fecha
    if (dateFilter) {
      const turnoDate = format(new Date(turno.fecha), 'yyyy-MM-dd');
      if (turnoDate !== dateFilter) return false;
    }
    
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-lora text-primary">Administración de Turnos</h1>
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          <X size={16} />
          <span>Cerrar</span>
        </button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="font-medium">Estado:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmado">Confirmados</option>
            <option value="cancelado">Cancelados</option>
            <option value="realizado">Realizados</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="font-medium">Fecha:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="p-2 border rounded"
            placeholder="Selecciona una fecha"
          />
          {dateFilter && (
            <button 
              type="button"
              title="Limpiar filtro de fecha"
              onClick={() => setDateFilter('')}
              className="text-gray-500 hover:text-red-500"
            >
              <X size={16} />
              <span className="sr-only">Limpiar filtro de fecha</span>
            </button>
          )}
        </div>
        
        <div className="flex-1"></div>
        
        <button
          onClick={handlePrintTurnos}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded"
        >
          <FileText size={16} />
          <span>Imprimir</span>
        </button>
      </div>
      
      {/* Tabla de turnos */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full" id="turnos-table">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTurnos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron turnos con los filtros seleccionados
                </td>
              </tr>
            ) : (
              filteredTurnos.map((turno) => (
                <tr key={turno._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {turno.cliente.first_name} {turno.cliente.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{turno.servicio.nombre}</div>
                    <div className="text-sm text-gray-500">${turno.servicio.precio}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">
                        {format(new Date(turno.fecha), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{turno.hora}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        turno.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        turno.estado === 'confirmado' ? 'bg-green-100 text-green-800' :
                        turno.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={turno.estado}
                      onChange={(e) => handleStatusChange(turno._id, e.target.value)}
                      className="p-1 border rounded text-sm"
                      title="Cambiar estado del turno"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmado">Confirmar</option>
                      <option value="cancelado">Cancelar</option>
                      <option value="realizado">Realizado</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}