import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MAIL_TRANSPORT = (process.env.MAIL_TRANSPORT || 'console').toLowerCase();
const EMAIL_FROM = process.env.EMAIL_FROM || 'Where Is My Books <no-reply@example.com>';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;

  constructor() {
    if (MAIL_TRANSPORT === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendConfirmEmail(to: string, token: string): Promise<void> {
    const link = `${FRONTEND_URL}/confirm-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Подтвердите адрес электронной почты',
      this.layout(`
        <h2 style="margin:0 0 12px;color:#2e7d6b;">Подтвердите почту</h2>
        <p style="margin:0 0 20px;color:#5a6570;">Вы зарегистрировались в «Where Is My Books». Подтвердите, что адрес принадлежит вам:</p>
        <a href="${link}" style="display:inline-block;background:#2e7d6b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Подтвердить адрес</a>
        <p style="margin:20px 0 0;color:#5a6570;">Если кнопка не работает, скопируйте ссылку: <a href="${link}" style="color:#2e7d6b;word-break:break-all;">${link}</a></p>
        <p style="margin:16px 0 0;font-size:12px;color:#98a1aa;">Ссылка действительна 24 часа.</p>
      `),
    );
  }

  async sendResetEmail(to: string, token: string): Promise<void> {
    const link = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Восстановление пароля',
      this.layout(`
        <h2 style="margin:0 0 12px;color:#2e7d6b;">Восстановление пароля</h2>
        <p style="margin:0 0 20px;color:#5a6570;">Мы получили запрос на сброс пароля для вашего аккаунта. Перейдите по ссылке, чтобы задать новый пароль:</p>
        <a href="${link}" style="display:inline-block;background:#2e7d6b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Задать новый пароль</a>
        <p style="margin:20px 0 0;color:#5a6570;">Если кнопка не работает, скопируйте ссылку: <a href="${link}" style="color:#2e7d6b;word-break:break-all;">${link}</a></p>
        <p style="margin:16px 0 0;font-size:12px;color:#98a1aa;">Ссылка действительна 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
      `),
    );
  }

  private layout(body: string): string {
    return `
      <div style="background:#f4f1ea;padding:28px;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e0d2;border-radius:12px;padding:28px;">
          <div style="font-size:15px;color:#3d4550;">
            ${body}
          </div>
          <hr style="border:none;border-top:1px solid #e6e0d2;margin:24px 0 16px;" />
          <div style="font-size:11px;color:#98a1aa;">Where Is My Books · личный каталог книг</div>
        </div>
      </div>`;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      });
      this.logger.log(`Письмо «${subject}» отправлено на ${to}`);
      return;
    }
    const link = /href="([^"]+)"/.exec(html)?.[1] || '';
    this.logger.log(`[console-mail] to=${to} subject="${subject}" link=${link}`);
  }
}