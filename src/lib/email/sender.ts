import nodemailer from 'nodemailer';

/**
 * Email sender for outgoing quotes.
 * Uses Nodemailer with SMTP configuration.
 * For demo: configure with a real SMTP service (Gmail, SendGrid, etc.)
 */

interface QuoteEmailData {
  to: string;
  customerName: string;
  referenceNumber: string;
  lineItems: {
    materialName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  expiresAt: Date;
  deliveryType: string;
  deliveryAddress?: string;
  siteLocation?: string;
  pdfBuffer?: Buffer;
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function generateQuoteHtml(data: QuoteEmailData): string {
  const itemRows = data.lineItems.map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee;">${item.materialName}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity} ${item.unit}s</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #F57C20, #E06B10); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">BERMONT MATERIALS</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px;">Superior Aggregate Supplier in Southwest Florida</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border: 1px solid #e5e5e5; border-top: none;">
      <h2 style="color: #2D2D2D; margin: 0 0 8px;">Quote ${data.referenceNumber}</h2>
      <p style="color: #666; margin: 0 0 24px; font-size: 14px;">
        Prepared for: <strong>${data.customerName}</strong>
      </p>

      <!-- Materials Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <thead>
          <tr style="background: #f9f9f9;">
            <th style="padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #eee;">Material</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #eee;">Quantity</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #eee;">Unit Price</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 2px solid #eee;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="border-top: 2px solid #2D2D2D; padding-top: 16px; margin-top: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #666;">Subtotal</td>
            <td style="padding: 4px 0; text-align: right;">$${data.subtotal.toFixed(2)}</td>
          </tr>
          ${data.deliveryFee > 0 ? `
          <tr>
            <td style="padding: 4px 0; color: #666;">Delivery Fee</td>
            <td style="padding: 4px 0; text-align: right;">$${data.deliveryFee.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 4px 0; color: #666;">Tax (7%)</td>
            <td style="padding: 4px 0; text-align: right;">$${data.taxAmount.toFixed(2)}</td>
          </tr>
          <tr style="font-size: 18px; font-weight: 700;">
            <td style="padding: 12px 0 0; color: #2D2D2D; border-top: 1px solid #eee;">Total</td>
            <td style="padding: 12px 0 0; text-align: right; color: #F57C20; border-top: 1px solid #eee;">$${data.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Details -->
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>${data.deliveryType === 'delivery' ? '🚛 Delivery' : '🏗️ Pickup'}</strong></p>
        ${data.deliveryAddress ? `<p style="margin: 0 0 4px; font-size: 14px; color: #666;">Address: ${data.deliveryAddress}</p>` : ''}
        ${data.siteLocation ? `<p style="margin: 0 0 4px; font-size: 14px; color: #666;">Location: ${data.siteLocation === 'clarion' ? 'Clarion Site — 37390 Bermont Rd, Punta Gorda' : 'Alico Site — 14210 Alico Rd, Fort Myers'}</p>` : ''}
        <p style="margin: 8px 0 0; font-size: 13px; color: #999;">⏰ This quote is valid until ${data.expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 24px 32px; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0 0 4px;"><strong>Bermont Materials</strong></p>
      <p style="margin: 0 0 4px;">37390 Bermont Rd, Punta Gorda, FL 33982</p>
      <p style="margin: 0 0 4px;">(866) 367-9557 · info@bermontmaterials.com</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendQuoteEmail(data: QuoteEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    const html = generateQuoteHtml(data);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Bermont Materials" <${process.env.SMTP_USER || 'quotes@bermontmaterials.com'}>`,
      to: data.to,
      subject: `Quote ${data.referenceNumber} — Bermont Materials`,
      html,
      attachments: data.pdfBuffer ? [
        {
          filename: `Quote-${data.referenceNumber}.pdf`,
          content: data.pdfBuffer,
          contentType: 'application/pdf',
        },
      ] : [],
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send quote email:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export { generateQuoteHtml };
