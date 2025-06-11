import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, User, Mail, Lock, Shield, Save } from 'lucide-react';
import { IUser, IUserBase } from '@/types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: IUser; // Now required since we only edit
  onSave: () => void;
}

export default function UsuarioModal({ isOpen, onClose, usuario, onSave }: UsuarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IUserBase & { _id?: string }>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'cliente',
    is_admin: false
  });
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when modal opens/closes or usuario changes
  useEffect(() => {
    if (isOpen && usuario) {
      // Only editing existing user now
      setFormData({
        _id: usuario._id,
        first_name: usuario.first_name,
        last_name: usuario.last_name,
        email: usuario.email,
        role: usuario.role,
        is_admin: usuario.is_admin,
        password: '' // Don't pre-fill password for security
      });
    }
  }, [isOpen, usuario]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.first_name.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (!formData.last_name.trim()) {
      toast.error('El apellido es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El email es requerido');
      return false;
    }
    if (!formData.email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      toast.error('Ingresa un email válido');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autenticación');
        return;
      }

      // Prepare data to send
      const dataToSend: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        is_admin: formData.is_admin
      };

      // Only include password if it's provided
      if (formData.password) {
        dataToSend.password = formData.password;
      }

      // Only editing existing user now
      const url = `${process.env.NEXT_PUBLIC_API_USER}/${usuario._id}?token=${token}`;
      const method = 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = 'Error al procesar la solicitud';
        
        try {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.message || errorMessage;
        } catch {
          if (errorData.includes('duplicate key error') || errorData.includes('email')) {
            errorMessage = 'Este email ya está registrado';
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      toast.success('Usuario actualizado exitosamente');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-lora font-semibold text-primary">
                Editar Usuario
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar modal"
              title="Cerrar modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Ingresa el nombre"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Ingresa el apellido"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="usuario@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña (opcional)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Dejar vacío para mantener actual"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent appearance-none"
                  required
                  aria-label="Seleccionar rol de usuario"
                  title="Seleccionar rol de usuario"
                >
                  <option value="cliente">Cliente</option>
                  <option value="profesional">Profesional</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            {/* Is Admin Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_admin"
                name="is_admin"
                checked={formData.is_admin}
                onChange={handleInputChange}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                Privilegios de administrador
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Actualizar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}