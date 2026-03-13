import { createEmailProvider } from '@/lib/email';
import type { IncomingEmail } from '@/lib/email';
import { parseQuoteRequestFromText } from '@/lib/ocr';
import prisma from '@/lib/prisma';

export interface IntakeResult {
  processed: number;
  skipped: number;
  errors: string[];
  quoteIds: string[];
}

/**
 * Generate a reference number like BM-2026-0001
 */
async function generateReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quoteRequest.count({
    where: {
      referenceNumber: { startsWith: `BM-${year}` },
    },
  });
  const num = String(count + 1).padStart(4, '0');
  return `BM-${year}-${num}`;
}

/**
 * Intake processor — orchestrates the email-to-quote pipeline:
 * 1. Fetch new emails from provider
 * 2. Run OCR/parsing on email body + attachments
 * 3. Create QuoteRequest records with extracted data
 */
export async function processQuoteIntake(): Promise<IntakeResult> {
  const provider = createEmailProvider();

  const result: IntakeResult = {
    processed: 0,
    skipped: 0,
    errors: [],
    quoteIds: [],
  };

  try {
    const emails = await provider.fetchNewEmails();
    console.log(`📧 Fetched ${emails.length} new emails`);

    for (const email of emails) {
      try {
        const quoteId = await processEmail(email);

        if (quoteId) {
          result.processed++;
          result.quoteIds.push(quoteId);
        } else {
          result.skipped++;
        }

        await provider.markProcessed(email.id);
      } catch (error) {
        const msg = `Error processing email ${email.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(msg);
        result.errors.push(msg);
      }
    }
  } catch (error) {
    const msg = `Error fetching emails: ${error instanceof Error ? error.message : String(error)}`;
    console.error(msg);
    result.errors.push(msg);
  }

  return result;
}

/**
 * Process a single email into a QuoteRequest record
 */
async function processEmail(email: IncomingEmail): Promise<string | null> {
  console.log(`  📨 Processing: "${email.subject}" from ${email.from}`);

  // Parse the email body for structured data
  const bodyFields = parseQuoteRequestFromText(email.body, email.from);

  // Also parse any text attachments
  for (const attachment of email.attachments) {
    if (attachment.contentType === 'text/plain') {
      const attachmentFields = parseQuoteRequestFromText(
        attachment.content.toString('utf-8'),
        email.from
      );
      // Merge fields from attachments (body fields take priority)
      if (!bodyFields.customerName && attachmentFields.customerName) {
        bodyFields.customerName = attachmentFields.customerName;
      }
      if (!bodyFields.customerCompany && attachmentFields.customerCompany) {
        bodyFields.customerCompany = attachmentFields.customerCompany;
      }
      if (attachmentFields.materials.length > 0 && bodyFields.materials.length === 0) {
        bodyFields.materials = attachmentFields.materials;
      }
    }
  }

  // Generate reference number
  const referenceNumber = await generateReferenceNumber();

  // Look up material prices from catalog
  const materialPrices = new Map<string, { id: string; price: number }>();
  if (bodyFields.materials.length > 0) {
    const slugs = bodyFields.materials
      .map(m => m.matchedSlug)
      .filter((s): s is string => s !== null);

    const materials = await prisma.material.findMany({
      where: { slug: { in: slugs }, isActive: true },
    });

    for (const mat of materials) {
      materialPrices.set(mat.slug, { id: mat.id, price: Number(mat.pricePerTon) });
    }
  }

  // Calculate subtotal
  let subtotal = 0;
  const lineItemsData = bodyFields.materials.map(m => {
    const catalogMatch = m.matchedSlug ? materialPrices.get(m.matchedSlug) : null;
    const unitPrice = catalogMatch?.price ?? 0;
    const qty = m.quantity ?? 0;
    const total = unitPrice * qty;
    subtotal += total;

    return {
      materialId: catalogMatch?.id ?? null,
      materialName: m.name,
      quantity: qty,
      unit: m.unit,
      unitPrice,
      total,
    };
  });

  const taxRate = 0.07; // FL sales tax
  const taxAmount = subtotal * taxRate;
  const grandTotal = subtotal + taxAmount;

  // Create the quote request
  const quote = await prisma.quoteRequest.create({
    data: {
      referenceNumber,
      status: 'NEW',
      customerName: bodyFields.customerName,
      customerCompany: bodyFields.customerCompany,
      customerEmail: bodyFields.customerEmail || email.from,
      customerPhone: bodyFields.customerPhone,
      deliveryType: bodyFields.deliveryType,
      deliveryAddress: bodyFields.deliveryAddress,
      siteLocation: bodyFields.siteLocation,
      projectPurpose: bodyFields.projectPurpose,
      startDate: bodyFields.startDate ? tryParseDate(bodyFields.startDate) : null,
      subtotal,
      taxRate: 0.07,
      taxAmount,
      total: grandTotal,
      ocrData: bodyFields as object,
      ocrConfidence: bodyFields.confidence._overall ?? 0,
      expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days
    },
  });

  // Create line items
  for (const item of lineItemsData) {
    await prisma.quoteLineItem.create({
      data: {
        quoteId: quote.id,
        materialId: item.materialId,
        materialName: item.materialName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
      },
    });
  }

  // Create email record
  await prisma.quoteEmail.create({
    data: {
      quoteId: quote.id,
      subject: email.subject,
      fromEmail: email.from,
      toEmail: email.to,
      body: email.body,
      receivedAt: email.receivedAt,
      rawEmailId: email.id,
    },
  });

  // Create attachment records
  for (const att of email.attachments) {
    await prisma.quoteAttachment.create({
      data: {
        quoteId: quote.id,
        fileName: att.filename,
        fileType: att.contentType,
        fileUrl: `/uploads/${quote.id}/${att.filename}`,
        fileSize: att.size,
        ocrText: att.content.toString('utf-8'),
      },
    });
  }

  // Create history entry
  await prisma.quoteHistory.create({
    data: {
      quoteId: quote.id,
      action: 'created',
      details: {
        source: 'email_intake',
        ocrConfidence: bodyFields.confidence._overall,
        materialsDetected: bodyFields.materials.length,
      },
    },
  });

  console.log(`    ✅ Created quote ${referenceNumber} | Customer: ${bodyFields.customerName || 'Unknown'} | Materials: ${bodyFields.materials.length} | Total: $${grandTotal.toFixed(2)}`);

  return quote.id;
}

function tryParseDate(dateStr: string): Date | null {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
