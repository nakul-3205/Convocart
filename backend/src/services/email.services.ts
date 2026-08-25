import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.GMAIL_USER_NAME, pass: env.GMAIL_APP_PASSWORD },
});

export async function sendOrderConfirmation(to: string, orderId: string, trackingToken: string, total: number) {
  const trackingUrl = `${process.env.FRONTEND_URL}/track/${orderId}?token=${trackingToken}`;
  try {
    await transporter.sendMail({
      from: env.GMAIL_USER_NAME,
      to,
      subject: 'Your Convocart order is confirmed',
      html: `<p>Order confirmed — total ₹${total / 100}.</p><p><a href="${trackingUrl}">Track your order</a></p>`,
    });
  } catch (err) {
    // Email failing should never fail the whole webhook job — log it, don't throw
    logger.error({ err, orderId }, 'Failed to send confirmation email');
  }
}