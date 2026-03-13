import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        email: true,
        attachments: true,
        lineItems: {
          include: { material: true },
        },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    const {
      customerName,
      customerCompany,
      customerEmail,
      customerPhone,
      deliveryType,
      deliveryAddress,
      siteLocation,
      projectPurpose,
      startDate,
      deliveryFee,
      taxRate,
      internalNotes,
      status,
      lineItems,
    } = body;

    // Calculate totals from line items
    let subtotal = 0;
    if (lineItems && Array.isArray(lineItems)) {
      // Delete existing line items and recreate
      await prisma.quoteLineItem.deleteMany({ where: { quoteId: id } });

      for (const item of lineItems) {
        const total = (item.quantity || 0) * (item.unitPrice || 0);
        subtotal += total;

        await prisma.quoteLineItem.create({
          data: {
            quoteId: id,
            materialId: item.materialId || null,
            materialName: item.materialName,
            quantity: item.quantity || 0,
            unit: item.unit || 'ton',
            unitPrice: item.unitPrice || 0,
            total,
          },
        });
      }
    }

    const effectiveTaxRate = taxRate ?? 0.07;
    const effectiveDeliveryFee = deliveryFee ?? 0;
    const taxAmount = subtotal * effectiveTaxRate;
    const total = subtotal + effectiveDeliveryFee + taxAmount;

    const updateData: Record<string, unknown> = {
      subtotal,
      taxRate: effectiveTaxRate,
      taxAmount,
      deliveryFee: effectiveDeliveryFee,
      total,
    };

    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerCompany !== undefined) updateData.customerCompany = customerCompany;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (deliveryType !== undefined) updateData.deliveryType = deliveryType;
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
    if (siteLocation !== undefined) updateData.siteLocation = siteLocation;
    if (projectPurpose !== undefined) updateData.projectPurpose = projectPurpose;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (status !== undefined) updateData.status = status;

    if (status === 'PRICED') {
      updateData.status = 'PRICED';
    }

    const quote = await prisma.quoteRequest.update({
      where: { id },
      data: updateData,
      include: {
        lineItems: { include: { material: true } },
        email: true,
      },
    });

    // Record history
    await prisma.quoteHistory.create({
      data: {
        quoteId: id,
        action: 'updated',
        details: { fieldsUpdated: Object.keys(updateData) },
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Failed to update quote:', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}
