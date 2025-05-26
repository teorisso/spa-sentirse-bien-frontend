'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                email: user.email || ''
            }));
        } else {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return null;
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_USER}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email
                })
            });

            if (!res.ok) {
                throw new Error('Error al actualizar el perfil');
            }

            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            toast.error('Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_USER}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            if (!res.ok) {
                throw new Error('Error al actualizar la contraseña');
            }

            toast.success('Contraseña actualizada correctamente');
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            toast.error('Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHero
                title="Mi Perfil"
                description="Gestiona tu información personal y contraseña"
            />

            <main className="bg-white font-roboto py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <motion.div 
                        className="grid md:grid-cols-1 gap-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Datos personales */}
                        <motion.div 
                            className="bg-[#F5F9F8] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-accent/20 p-8 backdrop-blur-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-2xl font-lora font-semibold text-primary relative">
                                    <span className="relative z-10">Información Personal</span>
                                    <div className="absolute -bottom-2 left-0 w-20 h-1 bg-accent/30 rounded-full"></div>
                                </h2>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="firstName" className="block text-sm font-medium text-primary/90">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="lastName" className="block text-sm font-medium text-primary/90">
                                        Apellido
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-primary/90">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                                        required
                                    />
                                </div>

                                <div className="pt-4">
                                    <motion.button
                                        type="submit"
                                        className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isLoading ? 'Actualizando...' : 'Actualizar Perfil'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>

                        {/* Cambio de contraseña */}
                        <motion.div 
                            className="bg-[#F5F9F8] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-accent/20 p-8 backdrop-blur-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-2xl font-lora font-semibold text-primary relative">
                                    <span className="relative z-10">Cambiar Contraseña</span>
                                    <div className="absolute -bottom-2 left-0 w-20 h-1 bg-accent/30 rounded-full"></div>
                                </h2>
                            </div>

                            <form onSubmit={handleUpdatePassword} className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-primary/90">
                                        Contraseña Actual
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-primary/90">
                                        Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary/90">
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                                        required
                                    />
                                </div>

                                <div className="pt-4">
                                    <motion.button
                                        type="submit"
                                        className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
                                        disabled={isLoading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </>
    );
}