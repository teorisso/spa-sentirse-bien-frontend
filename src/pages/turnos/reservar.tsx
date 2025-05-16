'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import TurnoForm from '@/components/turnos/TurnoForm';
import { IService } from '@/types';

export default function ReservarTurnoPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [services, setServices] = useState<IService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check authentication
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchServices = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`);
                if (!response.ok) {
                    throw new Error('Error al cargar los servicios');
                }
                const data = await response.json();
                setServices(data);
                setError(null);
            } catch (err) {
                setError('No se pudieron cargar los servicios. Intenta más tarde.');
                console.error('Error cargando servicios:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, [user, router]);

    // Show loading state while checking authentication
    if (!user) {
        return null;
    }

    return (
        <>
            <PageHero 
                title="Reservar Turno"
                description="Selecciona el servicio y la fecha que mejor te convenga."
            />

            <main className="bg-white font-roboto py-16">
                <div className="max-w-4xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-lg shadow-lg p-6"
                    >
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                                <p className="mt-2">Cargando servicios...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-4 text-red-600">
                                {error}
                            </div>
                        ) : (
                            <TurnoForm services={services} />
                        )}
                    </motion.div>
                </div>
            </main>
        </>
    );
} 