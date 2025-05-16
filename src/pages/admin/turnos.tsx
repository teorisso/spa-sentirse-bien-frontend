'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { ITurno, IService } from '@/types';
import TurnoModal from '@/components/TurnoModal';
import { useRouter } from 'next/navigation';

export default function TurnosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<ITurno[]>([]);
  const [servicios, setServicios] = useState<IService[]>([]);
  const [clientes, setClientes] = useState<Array<{ _id: string; first_name: string; last_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<ITurno | undefined>();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchTurnos();
    fetchServicios();
    fetchClientes();
  }, [user, router]);

  const fetchTurnos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar los turnos');
      const data = await response.json();
      setTurnos(data);
    } catch (error) {
      setError('Error al cargar los turnos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar los servicios');
      const data = await response.json();
      setServicios(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_USER}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al cargar los clientes');
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTurno = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este turno?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar el turno');

      setTurnos(turnos.filter(turno => turno._id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el turno');
    }
  };

  const handleEditTurno = (turno: ITurno) => {
    setSelectedTurno(turno);
    setIsModalOpen(true);
  };

  const handleCreateTurno = () => {
    setSelectedTurno(undefined);
    setIsModalOpen(true);
  };

  const handleSaveTurno = async (turnoData: Omit<ITurno, '_id'>) => {
    try {
      const token = localStorage.getItem('token');
      const url = selectedTurno
        ? `${process.env.NEXT_PUBLIC_API_TURNO}/edit/${selectedTurno._id}`
        : `${process.env.NEXT_PUBLIC_API_TURNO}/create`;

      const response = await fetch(url, {
        method: selectedTurno ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(turnoData),
      });

      if (!response.ok) throw new Error('Error al guardar el turno');

      await fetchTurnos();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  if (!user) {
    return null;
  }

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Turnos</h1>
          <button
            onClick={handleCreateTurno}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Nuevo Turno
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {turnos.map((turno) => (
                <tr key={turno._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {turno.cliente.first_name} {turno.cliente.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {turno.servicio.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(turno.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {turno.hora}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${turno.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${turno.estado === 'confirmado' ? 'bg-green-100 text-green-800' : ''}
                      ${turno.estado === 'cancelado' ? 'bg-red-100 text-red-800' : ''}
                      ${turno.estado === 'realizado' ? 'bg-blue-100 text-blue-800' : ''}
                    `}>
                      {turno.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditTurno(turno)}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteTurno(turno._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TurnoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        turno={selectedTurno}
        onSave={handleSaveTurno}
        servicios={servicios}
        clientes={clientes}
      />
    </AdminLayout>
  );
} 