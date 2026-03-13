import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';

  const where: Record<string, unknown> = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerCompany: { contains: search, mode: 'insensitive' } },
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { email: { subject: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const orderBy: Record<string, string> = {};
  const sortField = ['createdAt', 'total', 'customerName', 'referenceNumber', 'status'].includes(sort) ? sort : 'createdAt';
  orderBy[sortField] = order === 'asc' ? 'asc' : 'desc';

  try {
    const [quotes, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy,
        include: {
          email: { select: { subject: true, fromEmail: true, receivedAt: true } },
          lineItems: { select: { materialName: true, quantity: true, unit: true } },
          _count: { select: { lineItems: true } },
        },
      }),
      prisma.quoteRequest.count({ where }),
    ]);

    return NextResponse.json({ quotes, total });
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}
