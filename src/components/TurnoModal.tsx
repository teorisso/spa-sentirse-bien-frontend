import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ITurno, IService, TurnoStatus } from '@/types';

interface TurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  turno?: ITurno;
  onSave: (turno: Omit<ITurno, '_id'>) => Promise<void>;
  servicios: IService[];
  clientes: Array<{ _id: string; first_name: string; last_name: string }>;
}

export default function TurnoModal({ 
  isOpen, 
  onClose, 
  turno, 
  onSave, 
  servicios,
  clientes 
}: TurnoModalProps) {
  const [formData, setFormData] = useState({
    cliente: '',
    servicio: '',
    fecha: '',
    hora: '',
    estado: 'pendiente' as TurnoStatus
  });

  useEffect(() => {
    if (turno) {
      setFormData({
        cliente: turno.cliente._id,
        servicio: turno.servicio._id,
        fecha: new Date(turno.fecha).toISOString().split('T')[0],
        hora: turno.hora,
        estado: turno.estado
      });
    } else {
      setFormData({
        cliente: '',
        servicio: '',
        fecha: '',
        hora: '',
        estado: 'pendiente'
      });
    }
  }, [turno]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        cliente: {
          _id: formData.cliente,
          first_name: clientes.find(c => c._id === formData.cliente)?.first_name || '',
          last_name: clientes.find(c => c._id === formData.cliente)?.last_name || ''
        },
        servicio: {
          _id: formData.servicio,
          nombre: servicios.find(s => s._id === formData.servicio)?.nombre || '',
          precio: servicios.find(s => s._id === formData.servicio)?.precio || 0
        },
        fecha: new Date(formData.fecha),
        hora: formData.hora,
        estado: formData.estado
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar turno:', error);
      alert('Error al guardar el turno');
    }
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-primary">
                {turno ? 'Editar Turno' : 'Nuevo Turno'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                title="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <select
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente._id} value={cliente._id}>
                      {cliente.first_name} {cliente.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Servicio</label>
                <select
                  value={formData.servicio}
                  onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map(servicio => (
                    <option key={servicio._id} value={servicio._id}>
                      {servicio.nombre} - ${servicio.precio}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hora</label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as TurnoStatus })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="realizado">Realizado</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  {turno ? 'Guardar cambios' : 'Agregar turno'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 