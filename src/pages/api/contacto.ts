import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

interface ContactRequestBody {
  nombre: string;
  email: string;
  mensaje: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre, email, mensaje } = req.body as Partial<ContactRequestBody>;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  }

  try {
    // Instanciar Resend con la API Key almacenada en variables de entorno
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Construir el contenido HTML del correo
    const html = `
      <h2>Consulta desde la página de contacto</h2>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje.replace(/\n/g, '<br/>')}</p>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Spa Sentirse Bien <no-reply@resend.dev>',
      to: ['teorisso@gmail.com'],
      subject: 'Nueva consulta en Spa Sentirse Bien',
      html,
      reply_to: email,
    });

    return res.status(200).json({ message: 'Consulta enviada correctamente' });
  } catch (error) {
    console.error('Error enviando correo de consulta:', error);
    return res
      .status(500)
      .json({ message: 'Error interno al enviar la consulta' });
  }
} 