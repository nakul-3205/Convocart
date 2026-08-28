import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.GMAIL_USER_NAME, pass: env.GMAIL_APP_PASSWORD },
});

interface OrderItemForEmail {
  name: string;
  qty: number;
  unitPrice: number; // paise
}

interface ConfirmationEmailData {
  customerName: string;
  orderId: string;
  items: OrderItemForEmail[];
  subtotal: number; // paise
  deliveryFee: number; // paise
  total: number; // paise
  trackingUrl: string;
}

function rupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function buildConfirmationEmailHtml(data: ConfirmationEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333; font-family: Arial, Helvetica, sans-serif;">
        ${item.name}<br/><span style="color: #888888; font-size: 12px;">Qty: ${item.qty}</span>
      </td>
      <td align="right" style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333; font-family: Arial, Helvetica, sans-serif; white-space: nowrap;">
        ${rupees(item.unitPrice * item.qty)}
      </td>
    </tr>`,
    )
    .join('');

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 32px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; font-family: Arial, Helvetica, sans-serif;">

        <tr>
          <td style="background-color: #1565c0; padding: 24px 32px;">
            <span style="color: #ffffff; font-size: 20px; font-weight: bold;">Convocart</span>
          </td>
        </tr>

        <tr>
          <td style="padding: 32px;">
            <p style="font-size: 18px; color: #1a1a1a; margin: 0 0 4px; font-weight: bold;">Order confirmed</p>
            <p style="font-size: 14px; color: #666666; margin: 0 0 24px;">Hi ${data.customerName}, thanks for shopping with us, here's your order summary.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
              <tr>
                <td style="padding: 12px 0 4px; font-size: 13px; color: #666666;">Subtotal</td>
                <td align="right" style="padding: 12px 0 4px; font-size: 13px; color: #666666;">${rupees(data.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 0 0 12px; font-size: 13px; color: #666666;">Delivery</td>
                <td align="right" style="padding: 0 0 12px; font-size: 13px; color: #666666;">${rupees(data.deliveryFee)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0; border-top: 2px solid #1a1a1a; font-size: 16px; color: #1a1a1a; font-weight: bold;">Total</td>
                <td align="right" style="padding: 12px 0 0; border-top: 2px solid #1a1a1a; font-size: 16px; color: #1a1a1a; font-weight: bold;">${rupees(data.total)}</td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0 8px;">
              <tr>
                <td align="center" style="background-color: #1565c0; border-radius: 6px;">
                  <a href="${data.trackingUrl}" style="display: inline-block; padding: 12px 28px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: bold;">Track your order</a>
                </td>
              </tr>
            </table>

            <p style="font-size: 12px; color: #999999; margin: 24px 0 0;">Order ID: ${data.orderId}</p>
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
            <p style="font-size: 12px; color: #999999; margin: 0;">This is an automated confirmation from Convocart. If you didn't place this order, you can ignore this email.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>`;
}

export async function sendOrderConfirmation(to: string, data: ConfirmationEmailData) {
  try {
    await transporter.sendMail({
      from: `Convocart <${env.GMAIL_USER_NAME}>`,
      to,
      subject: `Your Convocart order is confirmed — ${rupees(data.total)}`,
      html: buildConfirmationEmailHtml(data),
    });
  } catch (err) {
    logger.error({ err, orderId: data.orderId }, 'Failed to send confirmation email');
  }
}