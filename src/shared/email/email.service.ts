import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import logger from '@/shared/logger/logger';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface NotificationEmailData {
  to: string;
  userName: string;
  tenantName: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = env.EMAIL_FROM || 'noreply@membrosflix.com';
    this.fromName = env.EMAIL_FROM_NAME || 'MembrosFlix';
    
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: parseInt(env.EMAIL_PORT || '587'),
      secure: env.EMAIL_SECURE === 'true',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed', error as Error);
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${this.fromName} <${emailData.from || this.fromEmail}>`,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.htmlToText(emailData.html),
        replyTo: emailData.replyTo,
        attachments: emailData.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: emailData.to,
        subject: emailData.subject,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: emailData.to,
        subject: emailData.subject,
      });
      return false;
    }
  }

  async sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
    const template = this.getNotificationTemplate(data.notificationType);
    
    const emailData: EmailData = {
      to: data.to,
      subject: template.subject.replace('{{title}}', data.title),
      html: this.renderNotificationTemplate(template, data),
      text: this.renderNotificationTemplateText(template, data),
    };

    return await this.sendEmail(emailData);
  }

  async sendBulkEmails(emails: EmailData[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    logger.info('Bulk email sending completed', { sent, failed, total: emails.length });
    return { sent, failed };
  }

  private getNotificationTemplate(notificationType: string): EmailTemplate {
    const templates: Record<string, EmailTemplate> = {
      'NOVA_AULA': {
        subject: 'Nova aula disponível: {{title}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nova aula disponível!</h2>
            <p>Olá {{userName}},</p>
            <p>Uma nova aula foi adicionada ao curso: <strong>{{title}}</strong></p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{actionUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                {{actionText}}
              </a>
            </div>
            {{/if}}
            <p>Obrigado por usar o MembrosFlix!</p>
          </div>
        `,
        text: 'Nova aula disponível: {{title}}\n\nOlá {{userName}},\n\nUma nova aula foi adicionada ao curso: {{title}}\n\n{{message}}\n\n{{#if actionUrl}}{{actionText}}: {{actionUrl}}{{/if}}\n\nObrigado por usar o MembrosFlix!',
      },
      'CURSO_NOVO': {
        subject: 'Novo curso disponível: {{title}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Novo curso disponível!</h2>
            <p>Olá {{userName}},</p>
            <p>Um novo curso foi publicado: <strong>{{title}}</strong></p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{actionUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                {{actionText}}
              </a>
            </div>
            {{/if}}
            <p>Obrigado por usar o MembrosFlix!</p>
          </div>
        `,
        text: 'Novo curso disponível: {{title}}\n\nOlá {{userName}},\n\nUm novo curso foi publicado: {{title}}\n\n{{message}}\n\n{{#if actionUrl}}{{actionText}}: {{actionUrl}}{{/if}}\n\nObrigado por usar o MembrosFlix!',
      },
      'BOAS_VINDAS': {
        subject: 'Bem-vindo ao MembrosFlix!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Bem-vindo ao MembrosFlix!</h2>
            <p>Olá {{userName}},</p>
            <p>Seja bem-vindo à plataforma MembrosFlix!</p>
            <p>{{message}}</p>
            {{#if actionUrl}}
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{actionUrl}}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                {{actionText}}
              </a>
            </div>
            {{/if}}
            <p>Obrigado por escolher o MembrosFlix!</p>
          </div>
        `,
        text: 'Bem-vindo ao MembrosFlix!\n\nOlá {{userName}},\n\nSeja bem-vindo à plataforma MembrosFlix!\n\n{{message}}\n\n{{#if actionUrl}}{{actionText}}: {{actionUrl}}{{/if}}\n\nObrigado por escolher o MembrosFlix!',
      },
    };

    return templates[notificationType] || templates['NOVA_AULA']!;
  }

  private renderNotificationTemplate(template: EmailTemplate, data: NotificationEmailData): string {
    let html = template.html;
    
    // Replace placeholders
    html = html.replace(/\{\{userName\}\}/g, data.userName);
    html = html.replace(/\{\{title\}\}/g, data.title);
    html = html.replace(/\{\{message\}\}/g, data.message);
    html = html.replace(/\{\{actionUrl\}\}/g, data.actionUrl || '');
    html = html.replace(/\{\{actionText\}\}/g, data.actionText || '');
    
    // Handle conditional blocks
    if (data.actionUrl) {
      html = html.replace(/\{\{#if actionUrl\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
    } else {
      html = html.replace(/\{\{#if actionUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }
    
    return html;
  }

  private renderNotificationTemplateText(template: EmailTemplate, data: NotificationEmailData): string {
    let text = template.text;
    
    // Replace placeholders
    text = text.replace(/\{\{userName\}\}/g, data.userName);
    text = text.replace(/\{\{title\}\}/g, data.title);
    text = text.replace(/\{\{message\}\}/g, data.message);
    text = text.replace(/\{\{actionUrl\}\}/g, data.actionUrl || '');
    text = text.replace(/\{\{actionText\}\}/g, data.actionText || '');
    
    // Handle conditional blocks
    if (data.actionUrl) {
      text = text.replace(/\{\{#if actionUrl\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
    } else {
      text = text.replace(/\{\{#if actionUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
    }
    
    return text;
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  async sendWelcomeEmail(userEmail: string, userName: string, tenantName: string): Promise<boolean> {
    return await this.sendNotificationEmail({
      to: userEmail,
      userName,
      tenantName,
      notificationType: 'BOAS_VINDAS',
      title: 'Bem-vindo ao MembrosFlix!',
      message: `Bem-vindo à plataforma ${tenantName}! Estamos felizes em tê-lo conosco.`,
      actionUrl: `${env.FRONTEND_URL}/dashboard`,
      actionText: 'Acessar Dashboard',
    });
  }

  async sendLessonNotificationEmail(
    userEmail: string,
    userName: string,
    tenantName: string,
    lessonName: string,
    courseTitle: string,
    instructorName: string
  ): Promise<boolean> {
    return await this.sendNotificationEmail({
      to: userEmail,
      userName,
      tenantName,
      notificationType: 'NOVA_AULA',
      title: lessonName,
      message: `Uma nova aula "${lessonName}" foi adicionada ao curso "${courseTitle}" pelo instrutor ${instructorName}.`,
      actionUrl: `${env.FRONTEND_URL}/courses/${courseTitle}/lessons`,
      actionText: 'Ver Aula',
      data: {
        lessonName,
        courseTitle,
        instructorName,
      },
    });
  }

  async sendCourseNotificationEmail(
    userEmail: string,
    userName: string,
    tenantName: string,
    courseTitle: string,
    instructorName: string
  ): Promise<boolean> {
    return await this.sendNotificationEmail({
      to: userEmail,
      userName,
      tenantName,
      notificationType: 'CURSO_NOVO',
      title: courseTitle,
      message: `Um novo curso "${courseTitle}" foi publicado pelo instrutor ${instructorName}.`,
      actionUrl: `${env.FRONTEND_URL}/courses/${courseTitle}`,
      actionText: 'Ver Curso',
      data: {
        courseTitle,
        instructorName,
      },
    });
  }
}

export const emailService = new EmailService();
