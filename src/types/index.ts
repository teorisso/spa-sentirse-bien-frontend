export type UserRole = 'admin' | 'cliente';

// Tipo base que coincide con el backend
export interface IUserBase {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: UserRole;
    is_admin: boolean;
}

// Tipo extendido para el frontend que incluye _id
export interface IUser extends IUserBase {
    _id: string;
}

export interface AuthResponse {
    token: string;
    user: IUser;
}

// Tipo base que coincide con el backend
export interface IServiceBase {
    nombre: string;
    Image: string;
    tipo: string;
    precio: number;
    descripcion: string;
}

// Tipo extendido para el frontend que incluye _id
export interface IService extends IServiceBase {
    _id: string;
}

export type TurnoStatus = 'pendiente' | 'confirmado' | 'cancelado' | 'realizado';

// Tipo base que coincide con el backend
export interface ITurnoBase {
    cliente: string; // ObjectId en el backend
    servicio: string; // ObjectId en el backend
    fecha: Date;
    hora: string;
    estado: TurnoStatus;
}

// Tipo extendido para el frontend que incluye _id y objetos expandidos
export interface ITurno {
    _id: string;
    cliente: {
        _id: string;
        first_name: string;
        last_name: string;
    };
    servicio: {
        _id: string;
        nombre: string;
        precio: number;
    };
    fecha: Date;
    hora: string;
    estado: TurnoStatus;
} 