'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import TurnosList from '@/components/TurnosList';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function TurnosPage() {
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    // Show loading state while checking authentication
    if (!user) {
        return null;
    }

    return (
        <>
            <PageHero 
                title="Mis Turnos"
                description="Gestiona tus turnos y reservas de manera fácil y rápida."
            />

            <main className="bg-white font-roboto py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <TurnosList />
                    </motion.div>
                </div>
            </main>
        </>
    );
} 