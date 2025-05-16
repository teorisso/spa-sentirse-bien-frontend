'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome,
  FiSettings,
  FiCalendar,
  FiUsers,
  FiBarChart2,
  FiLogOut,
  FiMenu
} from 'react-icons/fi';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/admin' },
    { icon: FiSettings, label: 'Servicios', path: '/servicios' }, // Ruta pública adaptativa
    { icon: FiCalendar, label: 'Turnos', path: '/turnos' }, // Ruta pública adaptativa
    { icon: FiUsers, label: 'Empleados', path: '/admin/empleados' },
    { icon: FiBarChart2, label: 'Reportes', path: '/admin/reportes' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#F5F9F8]">
      <motion.aside
        initial={{ width: 0 }}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-gradient-to-b from-[#436E6C] to-[#2C4A48] text-white shadow-xl z-40"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full border-2 border-white/20"
            />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-xl font-semibold"
                >
                  Admin Panel
                </motion.h1>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <FiMenu size={20} />
          </button>
        </div>

        <nav className="px-4 py-4">
          {menuItems.map((item) => (
            <motion.button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="w-full flex items-center px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg transition-all mb-2 group"
              whileHover={{ x: 5 }}
            >
              <span className="w-6 h-6 group-hover:text-white">
                <item.icon size={20} />
              </span>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="ml-4"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        <motion.button
          onClick={handleLogout}
          className="absolute bottom-6 left-4 right-4 flex items-center px-4 py-3 text-white/90 hover:bg-white/10 rounded-lg transition-all group"
          whileHover={{ x: 5 }}
        >
          <span className="w-6 h-6 group-hover:text-white">
            <FiLogOut size={20} />
          </span>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="ml-4"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.aside>

      <main className="flex-1 ml-[280px]">
        <AdminHeader />
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}