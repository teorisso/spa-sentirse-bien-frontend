import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IService } from '@/types';

interface ServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicio?: IService;
  onSave: (servicio: Omit<IService, '_id'>) => Promise<void>;
}

export default function ServicioModal({ isOpen, onClose, servicio, onSave }: ServicioModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    tipo: '',
    Image: ''
  });

  useEffect(() => {
    if (servicio) {
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || '',
        precio: servicio.precio.toString(),
        tipo: servicio.tipo,
        Image: servicio.Image
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        tipo: '',
        Image: ''
      });
    }
  }, [servicio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        ...formData,
        precio: Number(formData.precio)
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      alert('Error al guardar el servicio');
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
                {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
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
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                  title="Nombre del servicio"
                  placeholder="Ingrese el nombre del servicio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  rows={3}
                  title="Descripción del servicio"
                  placeholder="Ingrese la descripción del servicio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <input
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                  title="Precio del servicio"
                  placeholder="Ingrese el precio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                  title="Tipo del servicio"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Masajes">Masajes</option>
                  <option value="Belleza">Belleza</option>
                  <option value="Tratamientos Faciales">Tratamientos Faciales</option>
                  <option value="Tratamientos Corporales">Tratamientos Corporales</option>
                  <option value="Servicios Grupales">Servicios Grupales</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL de la imagen</label>
                <input
                  type="text"
                  value={formData.Image}
                  onChange={(e) => setFormData({ ...formData, Image: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                  title="URL de la imagen del servicio"
                  placeholder="Ingrese la URL de la imagen"
                />
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
                  {servicio ? 'Guardar cambios' : 'Agregar servicio'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 