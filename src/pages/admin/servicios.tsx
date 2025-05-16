'use client'

import React, { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext'
import { IService } from '@/types'
import ServicioModal from '@/components/admin/ServicioModal'
import { useRouter } from 'next/navigation'

export default function ServiciosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [services, setServices] = useState<IService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<IService | undefined>()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchServices()
  }, [user, router])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al cargar los servicios')
      }
      const data = await response.json()
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los servicios')
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar el servicio')
      }
      
      setServices(services.filter(service => service._id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el servicio')
      console.error('Error deleting service:', err)
    }
  }

  const handleEditService = (service: IService) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleCreateService = () => {
    setSelectedService(undefined)
    setIsModalOpen(true)
  }

  const handleSaveService = async (serviceData: Omit<IService, '_id'>) => {
    try {
      const token = localStorage.getItem('token')
      const url = selectedService 
        ? `${process.env.NEXT_PUBLIC_API_SERVICE}/edit/${selectedService._id}`
        : `${process.env.NEXT_PUBLIC_API_SERVICE}/create`
      
      const method = selectedService ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al guardar el servicio')
      }

      const savedService = await response.json()
      
      if (selectedService) {
        setServices(services.map(s => 
          s._id === selectedService._id ? savedService : s
        ))
      } else {
        setServices([...services, savedService])
      }
    } catch (err) {
      console.error('Error saving service:', err)
      throw err
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-primary">Cargando...</div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-red-500">{error}</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-primary">Gestión de Servicios</h1>
        <p className="text-stone">Bienvenido, {user?.first_name} {user?.last_name}</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-dark">Lista de Servicios</h2>
            <button 
              className="bg-primary hover:bg-opacity-90 text-white py-2 px-4 rounded-lg"
              onClick={handleCreateService}
            >
              Nuevo Servicio
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={service.Image} 
                            alt={service.nombre} 
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {service.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.descripcion}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{service.tipo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${service.precio}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditService(service)}
                        className="text-primary hover:text-primary-dark mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteService(service._id)}
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
      </div>

      <ServicioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        servicio={selectedService}
        onSave={handleSaveService}
      />
    </AdminLayout>
  )
}
