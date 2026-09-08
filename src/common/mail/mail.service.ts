import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
      secure: Number(this.config.get<string>('SMTP_PORT') ?? 587) === 465,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const from = this.config.getOrThrow<string>('EMAIL_FROM');
    const link = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Reset your password',
      text: `Use this link to reset your password: ${link}`,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const from = this.config.getOrThrow<string>('EMAIL_FROM');
    const link = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

    await this.transporter.sendMail({
      from,
      to,
      subject: 'Verify your email address',
      text: `Use this link to verify your email address: ${link}`,
    });
  }
}
