'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TurnosList from '@/components/turnos/TurnosList';  // En lugar de '@/components/TurnosList'
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function TurnosPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [turnos, setTurnos] = useState([]);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        } else {
            fetchTurnos();
        }
    }, [user, router]);

    const fetchTurnos = async () => {
        try {
            const url = isAdmin
                ? `${process.env.NEXT_PUBLIC_API_TURNO}`
                : `${process.env.NEXT_PUBLIC_API_TURNO}/user/${user._id}`;
                
            const response = await fetch(url);
            const data = await response.json();
            setTurnos(data);
        } catch (error) {
            console.error('Error fetching turnos:', error);
        }
    };

    const handleDeleteTurno = async (turnoId) => {
        if (!confirm('¿Estás seguro de eliminar este turno?')) return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/delete/${turnoId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                setTurnos(turnos.filter(turno => turno._id !== turnoId));
            }
        } catch (error) {
            console.error('Error eliminando turno:', error);
        }
    };

    const handleEditTurno = async (turnoId, turnoData) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_TURNO}/edit/${turnoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(turnoData)
            });
            
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