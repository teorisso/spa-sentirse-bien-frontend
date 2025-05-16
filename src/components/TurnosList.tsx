import React from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const TurnosList: React.FC = () => {
  const { data: session } = useSession();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mis Turnos</h2>
          <Link 
            href="/turnos/reservar"
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Reservar Turno
          </Link>
        </div>
        
        {/* Placeholder para cuando no hay turnos */}
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            No tienes turnos programados en este momento.
          </p>
          <Link 
            href="/turnos/reservar"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Reservar mi primer turno
          </Link>
        </div>

        {/* Aquí irá la lista de turnos cuando se implemente */}
        {/* <div className="space-y-4">
          {turnos.map((turno) => (
            <div key={turno.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{turno.servicio}</h3>
              <p className="text-gray-600">{turno.fecha}</p>
              <p className="text-gray-600">{turno.hora}</p>
            </div>
          ))}
        </div> */}
      </div>
    </motion.div>
  );
};

export default TurnosList; 