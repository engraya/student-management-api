import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: 'Reset your password',
      html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to,
      subject: 'Verify your email',
      html: `<p>Click <a href="${url}">here</a> to verify your email. This link expires in 30 minutes.</p>`,
    });
  }
}
