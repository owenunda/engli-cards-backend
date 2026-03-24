import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const resendKey = process.env.RESEND_KEY;
    if (!resendKey) {
      this.logger.error('RESEND_KEY not found in environment variables');
      return;
    }
    this.resend = new Resend(resendKey);
  }

  async sendOtpEmail(email: string, otp: string) {
    const fromEmail = process.env.EMAIL_RESEND;
    const logoUrl = 'https://res.cloudinary.com/davrzlvfq/image/upload/v1774342355/logo_pzbfas.png';

    try {
      const { data, error } = await this.resend.emails.send({
        from: `EngliCards <${fromEmail}>`,
        to: email,
        subject: 'Recuperación de contraseña - EngliCards',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${logoUrl}" alt="EngliCards Logo" style="width: 150px;" />
            </div>
            <h2 style="color: #333; text-align: center;">Recuperación de Contraseña</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Hola, hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente código para continuar con el proceso:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; background-color: #f4f4f4; padding: 10px 20px; border-radius: 5px; color: #008080;">
                ${otp}
              </span>
            </div>
            <p style="color: #999; font-size: 14px; text-align: center;">
              Este código es válido por <strong>5 minutos</strong> y tiene un máximo de 3 intentos. Si no solicitaste este cambio, puedes ignorar este correo.
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #bbb; font-size: 12px; text-align: center;">
              &copy; 2024 EngliCards. Todos los derechos reservados.
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error('Error sending email via Resend:', error);
        throw new Error('Could not send email');
      }

      this.logger.log(`Email sent successfully to ${email}. ID: ${data?.id}`);
      return data;
    } catch (err) {
      this.logger.error('Unexpected error sending email:', err);
      throw err;
    }
  }
}
