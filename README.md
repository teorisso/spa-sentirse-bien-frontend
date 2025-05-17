Requerimientos

1. Interfaz Gráfica
Diseño coherente con la imagen corporativa; atractivo y funcional.
Organización clara de contenidos (espacios, títulos, menús).
Navegación consistente con enlaces bien etiquetados.
Tipografía legible y uniforme.
Paleta de 3–4 colores (fondo claro, color principal, acentos).
Imágenes de alta calidad; videos nítidos.
Diseño responsive para móviles.

2. Lenguaje y Redacción
Ortografía impecable.
Cohesión y fluidez; uso adecuado de conectores.
Coherencia lógica, sin repeticiones.

3. Contenido General
Misión, visión y propósito claros.
Datos de la empresa (origen, objetivos, servicios).
Descripción detallada de cada servicio.
Formas de pago: efectivo, tarjeta de crédito y débito.
Enlaces a recursos externos confiables.
Información de contacto y formulario (nombre, email, teléfono, descripción).
Enlaces a redes sociales.
Material de apoyo (imágenes/videos).
Integración de Google Maps.
Créditos del equipo de desarrollo.

4. Gestión de Usuarios y Autenticación
Registro de cliente con datos personales y contraseña.
Login obligatorio para acceder a la reserva de servicios.

5. Gestión de Servicios (Modal Admin)
Modal habilitado solo para el rol de Administrador (Dra. Ana Felicidad) en el frontend.
Crear, editar o eliminar servicios (imagen, nombre, descripción, precio).

6. Agenda de Turnos (por implementar)
Roles:
Administrador: define servicios y crea/modifica turnos.
Profesional: consulta e imprime turnos.
Cliente: solicita turnos.
Flujo de reserva:
Cliente selecciona servicio, fecha y hora, y profesional.
Validación de antelación mínima (48 horas).
Aplicación de descuento del 15% si el pago con débito ocurre antes de 48h.
Permite agrupar varios servicios en la misma fecha y hora con un solo pago.
Almacenamiento de la reserva en la base de datos.
Notificaciones automáticas por email a cliente y administrador.
Consulta e impresión:
Profesionales y administradores visualizan turnos del siguiente día y pueden imprimir el listado.

7. Informes y Reportes (por implementar)
Totales pagados por servicio en un periodo.
Totales pagados por profesional en un periodo.