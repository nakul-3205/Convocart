import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';

import { logger } from './logger';

interface MailConfig {
  user: string;
  appPassword: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: SendMailOptions['attachments'];
}

const config: MailConfig = {
  user: process.env.GMAIL_USER ?? '',
  appPassword: process.env.GMAIL_APP_PASSWORD ?? '',
};

if (!config.user || !config.appPassword) {
  logger.error('Gmail configuration is missing. GMAIL_USER and GMAIL_APP_PASSWORD are required.');

  throw new Error('Gmail configuration is missing');
}

const transporter: Transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.user,
    pass: config.appPassword,
  },
});

logger.info('Gmail mail transporter initialized');

export async function sendEmail({
  to,
  subject,
  text,
  html,
  cc,
  bcc,
  attachments,
}: SendEmailOptions): Promise<void> {
  try {
    const mailOptions: SendMailOptions = {
      from: config.user,
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      {
        messageId: info.messageId,
        to,
        subject,
      },
      'Email sent successfully',
    );
  } catch (error) {
    logger.error(
      {
        error,
        to,
        subject,
      },
      'Failed to send email',
    );

    throw error;
  }
}
