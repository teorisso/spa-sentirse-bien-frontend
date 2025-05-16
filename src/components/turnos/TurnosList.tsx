import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ITurno {
    _id: string;
    servicio: {
        _id: string;
        nombre: string;
        precio: number;
        descripcion?: string;
    };
    usuario?: {
        _id: string;
        email: string;
        first_name: string;
        last_name: string;
    };
    fecha: string;
    hora: string;
    estado: 'pendiente' | 'confirmado' | 'cancelado' | 'realizado';
    notas?: string;
}

interface TurnosListProps {
    turnos: ITurno[];
    isAdmin?: boolean;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, data: any) => void;
}

export default function TurnosList({ turnos, isAdmin, onDelete, onEdit }: TurnosListProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'confirmado': return 'bg-green-100 text-green-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            case 'realizado': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (!turnos || turnos.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No hay turnos disponibles</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {turnos.map(turno => (
                <div key={turno._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                {turno.servicio.nombre}
                            </h3>
                            {isAdmin && turno.usuario && (
                                <p className="text-sm text-gray-600">
                                    Cliente: {turno.usuario.first_name} {turno.usuario.last_name}
                                </p>
                            )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(turno.estado)}`}>
                            {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1)}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Fecha</p>
                            <p className="mt-1 text-sm text-gray-900">
                                {format(parseISO(turno.fecha), 'EEEE d MMMM yyyy', { locale: es })}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Hora</p>
                            <p className="mt-1 text-sm text-gray-900">{turno.hora}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Precio</p>
                            <p className="mt-1 text-sm text-gray-900">${turno.servicio.precio}</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => onEdit?.(turno._id, { estado: 'confirmado' })}
                                className="px-3 py-1 bg-blue-500 text-white rounded"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => onDelete?.(turno._id)}
                                className="px-3 py-1 bg-red-500 text-white rounded"
                            >
                                Eliminar
                            </button>
                        </div>
                    )}

                    {!isAdmin && turno.estado === 'pendiente' && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => onEdit?.(turno._id, { estado: 'cancelado' })}
                                disabled={loading}
                                className={`px-4 py-2 rounded-md text-sm font-medium
                                    ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                            >
                                {loading ? 'Cancelando...' : 'Cancelar Turno'}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}