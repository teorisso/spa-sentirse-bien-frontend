'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TurnosList from '@/components/turnos/TurnosList';  // En lugar de '@/components/TurnosList'
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ITurno, TurnoStatus } from '@/types';

export default function TurnosPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [turnos, setTurnos] = useState([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        } else {
            fetchTurnos();
        }
    }, [user, router]);

    const fetchTurnos = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!user) return;
            
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                router.push('/login');
                return;
            }
            
            const url = isAdmin
                ? `${process.env.NEXT_PUBLIC_API_TURNO}`
                : `${process.env.NEXT_PUBLIC_API_TURNO}/user/${user._id}`;
                
            console.log('API URL:', process.env.NEXT_PUBLIC_API_TURNO);
            console.log('User ID:', user?._id);
            console.log('Full URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            setTurnos(data);
        } catch (error) {
            console.error('Error fetching turnos:', error);
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                setError('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet o contacta al administrador.');
            } else if (error instanceof Error) {
                setError(`Error: ${error.message}`);
            } else {
                setError('Ocurrió un error desconocido. Por favor, intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTurno = async (turnoId: string): Promise<void> => {
    if (!confirm('¿Estás seguro de eliminar este turno?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/delete/${turnoId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            setTurnos(turnos.filter((turno: ITurno) => turno._id !== turnoId));
        }
    } catch (error) {
        console.error('Error eliminando turno:', error);
    }
};

    // Interface for turno update data
    interface TurnoUpdateData {
        // Properties that can be updated in a turno
        [key: string]: any; // Using index signature for flexibility
    }

        const handleEditTurno = async (turnoId: string, turnoData: TurnoUpdateData): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(turnoData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            if (response.ok) {
                fetchTurnos(); // Recargar turnos después de editar
            }
        } catch (error) {
            console.error('Error editando turno:', error);
        }
    };

    if (!user) return null;

    return (
        <>
            <PageHero 
                title={isAdmin ? "Gestión de Turnos" : "Mis Turnos"}
                description={isAdmin 
                    ? "Administra todos los turnos del sistema" 
                    : "Gestiona tus turnos y reservas de manera fácil y rápida."}
            />

            <main className="bg-white font-roboto py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {isLoading && (
                            <div className="flex justify-center my-8">
                                <div className="loader">Cargando...</div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4" role="alert">
                                <p>{error}</p>
                            </div>
                        )}

                        {!isLoading && !error && turnos.length === 0 && (
                            <div className="text-center py-8">
                                <p>No tienes turnos programados.</p>
                                <button 
                                    onClick={() => router.push('/reservar')}
                                    className="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition"
                                >
                                    Reservar un turno
                                </button>
                            </div>
                        )}

                        <TurnosList 
                            turnos={turnos}
                            isAdmin={isAdmin}
                            onDelete={isAdmin ? handleDeleteTurno : undefined}
                            onEdit={isAdmin ? handleEditTurno : undefined}
                        />
                    </motion.div>
                </div>
            </main>
        </>
    );
}