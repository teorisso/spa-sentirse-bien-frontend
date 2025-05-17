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

// Tipo base que enviamos al backend al crear/editar turnos
export interface ITurnoBase {
    cliente: string; // ObjectId como string en el frontend
    servicio: string; // ObjectId como string en el frontend
    fecha: Date | string; // Flexible para permitir ambos formatos
    hora: string;
    estado: TurnoStatus;
}

// Tipo expandido que recibimos del backend con los objetos populados
export interface ITurno {
    _id: string;
    cliente: {
        _id: string;
        first_name: string;
        last_name: string;
        email?: string;
        // Otros campos posibles que devuelve el backend
    };
    servicio: {
        _id: string;
        nombre: string;
        precio: number;
        descripcion?: string;
        Image?: string;
        tipo?: string;
    };
    fecha: string | Date; // Podría venir como string o Date
    hora: string;
    estado: TurnoStatus;
    // Otros campos posibles
}

// Tipo para la creación de turnos desde el frontend
export interface ICreateTurnoRequest {
    cliente: string;
    servicio: string;
    fecha: string | Date;
    hora: string;
    estado: TurnoStatus;
}