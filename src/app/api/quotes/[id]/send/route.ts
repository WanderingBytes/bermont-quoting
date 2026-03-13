import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
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
          note: 'PDF generated and downloaded by user',
          total: Number(quote.total || 0),
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Quote marked as sent' });
  } catch (error) {
    console.error('Failed to mark quote as sent:', error);
    return NextResponse.json({ error: 'Failed to update quote status' }, { status: 500 });
  }
}
