import { JSX } from "react";

export interface IService {
    _id: string;
    nombre: string;
    Image: string;
    tipo: string;
    precio: number;
    descripcion: string;
}

export interface IUser {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    is_admin: boolean;
    role: 'cliente' | 'admin';
}

export interface ITurno {
    map(arg0: (turno: ITurno, index: number) => JSX.Element): import("react").ReactNode;
    _id: string;
    cliente: string;
    servicio: string;
    fecha: Date;
    hora: string;
    estado: 'pendiente' | 'confirmado' | 'cancelado' | 'realizado';
}