'use client';

import { useAuth } from '../../context/AuthContext';
import { Bell, User, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AdminHeader() {
  const { user } = useAuth() as { user?: { first_name?: string; last_name?: string; role?: string } };
  const router = useRouter();

  return (
    <motion.div
      className="bg-white shadow-sm border-b border-gray-200"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-8 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#436E6C]">Panel de Administración</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            type="button" 
            title="Ir al inicio" 
            className="p-2 hover:bg-[#F5F9F8] rounded-lg transition-colors text-[#436E6C] flex items-center gap-2"
          >
            <Home size={20} />
            <span>Inicio</span>
          </button>
          <button type="button" title="Notificaciones" className="p-2 hover:bg-[#F5F9F8] rounded-lg transition-colors relative text-[#436E6C]">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#436E6C] flex items-center justify-center text-white">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#436E6C]">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 