import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendQuoteEmail } from '@/lib/email/sender';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        lineItems: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (!quote.customerEmail) {
      return NextResponse.json({ error: 'No customer email address' }, { status: 400 });
    }

    // Send the quote email
    const result = await sendQuoteEmail({
      to: quote.customerEmail,
      customerName: quote.customerName || 'Valued Customer',
      referenceNumber: quote.referenceNumber,
      lineItems: quote.lineItems.map(item => ({
        materialName: item.materialName,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      subtotal: Number(quote.subtotal || 0),
      deliveryFee: Number(quote.deliveryFee || 0),
      taxAmount: Number(quote.taxAmount || 0),
      total: Number(quote.total || 0),
      expiresAt: quote.expiresAt || new Date(Date.now() + 30 * 86400000),
      deliveryType: quote.deliveryType || 'pickup',
      deliveryAddress: quote.deliveryAddress || undefined,
      siteLocation: quote.siteLocation || undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
    }

    // Update quote status to SENT
    await prisma.quoteRequest.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Record history
    await prisma.quoteHistory.create({
      data: {
        quoteId: id,
        action: 'sent',
        details: {
          sentTo: quote.customerEmail,
          total: Number(quote.total),
        },
      },
    });

    return NextResponse.json({ success: true, sentTo: quote.customerEmail });
  } catch (error) {
    console.error('Failed to send quote:', error);
    return NextResponse.json({ error: 'Failed to send quote' }, { status: 500 });
  }
}
