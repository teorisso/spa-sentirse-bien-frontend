'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

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
        <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Mi Perfil</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Actualiza tu información personal
                    </p>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div>
                                <label htmlFor="firstName" className="label">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="input mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="lastName" className="label">
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="input mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="label">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="input mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Actualizando...' : 'Actualizar Perfil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-gray-900">Cambiar Contraseña</h3>
                        <form onSubmit={handleUpdatePassword} className="mt-6 space-y-6">
                            <div>
                                <label htmlFor="currentPassword" className="label">
                                    Contraseña Actual
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    className="input mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="label">
                                    Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                                    className="input mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="label">
                                    Confirmar Nueva Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="input mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
} 