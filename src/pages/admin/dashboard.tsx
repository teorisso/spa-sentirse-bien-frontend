'use client';

// pages/admin/dashboard.tsx
import React, { useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-primary">Panel de Administración</h1>
        <p className="text-stone">Bienvenido, {user?.first_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card para Gestión de Servicios */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/admin/servicios')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-dark mb-2">Gestión de Servicios</h2>
              <p className="text-gray-600">
                Administra los servicios disponibles, sus precios y detalles
              </p>
            </div>
            <div className="text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card para Gestión de Turnos */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push('/admin/turnos')}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-dark mb-2">Gestión de Turnos</h2>
              <p className="text-gray-600">
                Administra los turnos, estados y programación de citas
              </p>
            </div>
            <div className="text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}