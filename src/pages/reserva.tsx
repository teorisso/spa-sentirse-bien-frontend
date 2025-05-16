// src/pages/reserva.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TurnosLayout from '../components/turnos/TurnosLayout';
import TurnoForm from '../components/turnos/TurnoForm';
import { toast } from 'react-hot-toast';
import { IService } from '../types';

export default function ReservaPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [services, setServices] = useState<IService[]>([]);

    useEffect(() => {
        // Obtener servicios al cargar la página
        const fetchServices = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`);
                if (!res.ok) {
                    throw new Error('Error al cargar servicios');
                }
                const data = await res.json();
                setServices(data);
            } catch (error) {
                toast.error('Error al cargar servicios');
                setError('Error al cargar servicios');
            }
        };

        fetchServices();
    }, []);

    return (
        <TurnosLayout
            title="Reservar un turno"
            description="Elige servicio y fecha"
        >
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            <TurnoForm
                services={services}
            />
        </TurnosLayout>
    );
}