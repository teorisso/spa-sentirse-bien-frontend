'use client';

import { useState, useEffect } from 'react';
import PageHero from '../components/PageHero';
import Servicios from '../components/Servicios';
import ServicioModal from '../components/admin/ServicioModal';
import { IService } from '../types';
import { useAuth } from '@/context/AuthContext';

export default function ServiciosPage() {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<IService | null>(null);

  const handleEditService = (service: IService) => {
    if (!isAdmin) return;
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleDeleteService = async (id: string) => {
    if (!isAdmin || !confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Error al eliminar el servicio');
      
      // Actualizar la lista de servicios sin el eliminado
      setServices(services.filter(s => s._id !== id));
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el servicio');
    }
  };

  const handleSaveService = async (serviceData: Omit<IService, '_id'>) => {
    try {
      const url = selectedService 
        ? `${process.env.NEXT_PUBLIC_API_SERVICE}/edit/${selectedService._id}`
        : `${process.env.NEXT_PUBLIC_API_SERVICE}/create`;
      
      const response = await fetch(url, {
        method: selectedService ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceData)
      });
      
      if (!response.ok) throw new Error('Error al guardar el servicio');
      
      // Actualizar la lista de servicios
      const savedService = await response.json();
      if (selectedService) {
        setServices(services.map(s => s._id === selectedService._id ? savedService : s));
      } else {
        setServices([...services, savedService]);
      }
      
      setIsModalOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el servicio');
    }
  };

  useEffect(() => {
    console.log('Comenzando fetch de servicios');
    fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`)
      .then(res => {
        console.log('Respuesta API:', res.status);
        if (!res.ok) throw new Error('Error al obtener servicios');
        return res.json();
      })
      .then((data) => {
        console.log('Datos recibidos de la API:', data);
        setServices(data);
        setRawData(data);
        setError(null);
      })
      .catch((e) => {
        console.error('Error cargando servicios:', e);
        setError('No se pudieron cargar los servicios. Intenta más tarde.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <PageHero
        title="Nuestros Servicios"
        description="Descubrí todos los tratamientos que Sentirse Bien tiene para vos."
      />
      
      {isAdmin && (
        <div className="max-w-6xl mx-auto px-4 my-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md"
          >
            Nuevo Servicio +
          </button>
        </div>
      )}
      
      {loading && (
        <p className="text-center mt-8 text-gray-500">Cargando servicios...</p>
      )}
      {error && (
        <p className="text-center mt-8 text-red-500">{error}</p>
      )}
      {!loading && !error && services.length > 0 && (
        <Servicios 
          services={services} 
          isAdmin={isAdmin}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
        />
      )}
      {!loading && !error && services.length === 0 && (
        <div className="text-center mt-10 p-4">
          <p className="text-amber-600">No hay servicios disponibles actualmente.</p>
          <details className="mt-4 text-left max-w-2xl mx-auto p-4 bg-gray-50 rounded">
            <summary className="cursor-pointer text-sm text-gray-500">Información de depuración</summary>
            <pre className="text-xs mt-2 overflow-auto p-2 bg-gray-100">{JSON.stringify(rawData, null, 2)}</pre>
          </details>
        </div>
      )}
      
      {isAdmin && (
        <ServicioModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedService(null);
          }}
          servicio={selectedService || undefined}
          onSave={handleSaveService}
        />
      )}
    </>
  );
}