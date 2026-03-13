/**
 * OCR Parser — extracts quote request fields from email text.
 * Adapted from feld-ap-system for aggregate materials industry.
 * Uses regex pattern matching with confidence scoring.
 */

export interface ExtractedQuoteFields {
  customerName: string | null;
  customerCompany: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  deliveryType: 'pickup' | 'delivery' | null;
  siteLocation: 'clarion' | 'alico' | null;
  projectPurpose: string | null;
  startDate: string | null;
  materials: ExtractedMaterial[];
  confidence: Record<string, number>;
}

export interface ExtractedMaterial {
  name: string;
  quantity: number | null;
  unit: string;
  matchedSlug: string | null;
}

// Known material catalog for matching
const MATERIAL_PATTERNS: { pattern: RegExp; name: string; slug: string }[] = [
  { pattern: /fill\s*dirt/i, name: 'Fill Dirt', slug: 'fill-dirt' },
  { pattern: /(?:fdot\s*)?b02\s*road\s*base/i, name: 'FDOT B02 Road Base', slug: 'fdot-b02-road-base' },
  { pattern: /commercial\s*base/i, name: 'Commercial Base', slug: 'commercial-base' },
  { pattern: /perc(?:\s*\/?\s*septic)?(?:\s*\/?\s*asphalt)?\s*sand/i, name: 'Perc / Septic / Asphalt Sand', slug: 'perc-septic-asphalt-sand' },
  { pattern: /250\s*paver|washed\s*shell\s*screen/i, name: '250 Paver / Washed Shell Screening', slug: '250-paver-washed-shell-screening' },
  { pattern: /131\s*rock\s*screen/i, name: '131 Rock Screenings', slug: '131-rock-screenings' },
  { pattern: /small\s*washed\s*shell/i, name: 'Small Washed Shell', slug: 'small-washed-shell' },
  { pattern: /medium\s*washed\s*shell/i, name: 'Medium Washed Shell', slug: 'medium-washed-shell' },
  { pattern: /(?:unwashed\s*)?commercial\s*89\s*stone/i, name: 'Unwashed Commercial 89 Stone', slug: 'commercial-89-stone' },
  { pattern: /(?:unwashed\s*)?commercial\s*57\s*stone/i, name: 'Unwashed Commercial 57 Stone', slug: 'commercial-57-stone' },
  { pattern: /(?:commercial\s*)?ballast\s*rock/i, name: 'Commercial Ballast Rock', slug: 'commercial-ballast-rock' },
  { pattern: /rip\s*rap\s*(?:6[\s-]*12|6["″]?\s*(?:to|-)\s*12["″]?)/i, name: 'Rip Rap 6-12"', slug: 'rip-rap-6-12' },
  { pattern: /rip\s*rap\s*(?:3[\s-]*6|3["″]?\s*(?:to|-)\s*6["″]?)/i, name: 'Rip Rap 3-6"', slug: 'rip-rap-3-6' },
  { pattern: /rip\s*rap/i, name: 'Rip Rap', slug: 'rip-rap-3-6' }, // default to 3-6 if no size
  { pattern: /road\s*base/i, name: 'FDOT B02 Road Base', slug: 'fdot-b02-road-base' },
  { pattern: /(?:washed\s*)?shell/i, name: 'Small Washed Shell', slug: 'small-washed-shell' },
];

/**
 * Parse structured quote data from email text using pattern matching.
 */
export function parseQuoteRequestFromText(text: string, fromEmail?: string): ExtractedQuoteFields {
  const fields: ExtractedQuoteFields = {
    customerName: null,
    customerCompany: null,
    customerEmail: fromEmail || null,
    customerPhone: null,
    deliveryAddress: null,
    deliveryType: null,
    siteLocation: null,
    projectPurpose: null,
    startDate: null,
    materials: [],
    confidence: {},
  };

  // Phone number patterns
  const phonePatterns = [
    /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/,
    /\d{3}[\s.-]\d{3}[\s.-]\d{4}/,
  ];
  for (const pat of phonePatterns) {
    const match = text.match(pat);
    if (match) {
      fields.customerPhone = match[0].trim();
      fields.confidence.customerPhone = 0.90;
      break;
    }
  }

  // Email in body (different from sender)
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (emailMatch && emailMatch[0] !== fromEmail) {
    fields.confidence.customerEmail = 0.95;
  }

  // Company name patterns (look for common suffixes)
  const companyPatterns = [
    /^([A-Z][A-Za-z\s&.']+(?:LLC|Inc\.?|Corp\.?|Co\.?|Group|Solutions|Contractors|Paving|Builders|Development|Construction|Excavat(?:ing|ors?)))\s*$/m,
    /(?:company|firm|business):\s*(.+)/i,
  ];
  for (const pat of companyPatterns) {
    const match = text.match(pat);
    if (match) {
      fields.customerCompany = match[1].trim();
      fields.confidence.customerCompany = 0.75;
      break;
    }
  }

  // Customer name — look for sign-offs
  const namePatterns = [
    /(?:thanks|regards|sincerely|cheers|best),?\s*\n\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)\s*$/m, // Standalone name on its own line
  ];
  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match) {
      // Verify it's not a company name
      const candidate = match[1].trim();
      if (!candidate.match(/LLC|Inc|Corp|Paving|Builder|Group/i)) {
        fields.customerName = candidate;
        fields.confidence.customerName = 0.70;
        break;
      }
    }
  }

  // Delivery address
  const addressPatterns = [
    /deliver(?:y|ed)?\s+to:?\s*(.+(?:FL|Florida)\s*\d{5})/i,
    /(?:at|to)\s+(\d+\s+[A-Za-z\s]+(?:Ave|Blvd|St|Rd|Dr|Ln|Way|Ct|Pl)[.,]?\s*[A-Za-z\s]+(?:FL|Florida)\s*\d{5})/i,
    /delivery\s+(?:address|location):?\s*(.+)/i,
    /(?:deliver|delivered|delivery)\s+to\s+(.+)/i,
    /(?:site|job\s*site|project)\s+(?:at|location):?\s*(.+)/i,
  ];
  for (const pat of addressPatterns) {
    const match = text.match(pat);
    if (match) {
      fields.deliveryAddress = match[1].trim().replace(/[.,]$/, '');
      fields.confidence.deliveryAddress = 0.65;
      break;
    }
  }

  // Delivery type
  if (/\bdeliver(?:y|ed)?\b/i.test(text)) {
    fields.deliveryType = 'delivery';
    fields.confidence.deliveryType = 0.80;
  } else if (/\bpick\s*up\b/i.test(text)) {
    fields.deliveryType = 'pickup';
    fields.confidence.deliveryType = 0.85;
  }

  // Site location (Clarion vs Alico)
  if (/\bclarion\b/i.test(text)) {
    fields.siteLocation = 'clarion';
    fields.confidence.siteLocation = 0.95;
  } else if (/\balico\b/i.test(text)) {
    fields.siteLocation = 'alico';
    fields.confidence.siteLocation = 0.95;
  }

  // Project purpose
  const purposePatterns: { pattern: RegExp; purpose: string }[] = [
    { pattern: /seawall/i, purpose: 'Seawall repair' },
    { pattern: /driveway/i, purpose: 'Driveway' },
    { pattern: /parking\s*(?:lot|area)/i, purpose: 'Parking lot' },
    { pattern: /foundation/i, purpose: 'Foundation' },
    { pattern: /drainage/i, purpose: 'Drainage' },
    { pattern: /landscap/i, purpose: 'Landscaping' },
    { pattern: /road\b/i, purpose: 'Road construction' },
    { pattern: /residential\s*develop/i, purpose: 'Residential development' },
    { pattern: /commercial\s*build/i, purpose: 'Commercial building' },
    { pattern: /site\s*prep/i, purpose: 'Site preparation' },
    { pattern: /septic/i, purpose: 'Septic system' },
    { pattern: /railyard|rail\s*yard/i, purpose: 'Railyard access' },
    { pattern: /lot\s*grad/i, purpose: 'Lot grading' },
  ];
  for (const { pattern, purpose } of purposePatterns) {
    if (pattern.test(text)) {
      fields.projectPurpose = purpose;
      fields.confidence.projectPurpose = 0.70;
      break;
    }
  }

  // Start date
  const datePatterns = [
    /(?:start|begin|need\s+by|needed\s+by|delivery\s+by)\s+(?:on\s+)?(?:next\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?)/i,
    /(?:start|begin)\s+(?:date|on):?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(?:march|april|may|june|july|august|september|october|november|december|january|february)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?/i,
  ];
  for (const pat of datePatterns) {
    const match = text.match(pat);
    if (match) {
      fields.startDate = match[1]?.trim() || match[0].trim();
      fields.confidence.startDate = 0.60;
      break;
    }
  }

  // Materials extraction — find quantity + material name combos
  const quantityMaterialPattern = /(\d[\d,]*(?:\.\d+)?)\s*(?:tons?|cubic\s*yards?|cy|loads?)\s+(?:of\s+)?(.+)/gi;
  let qmMatch;
  const alreadyMatched = new Set<string>();

  while ((qmMatch = quantityMaterialPattern.exec(text)) !== null) {
    const qty = parseFloat(qmMatch[1].replace(/,/g, ''));
    const materialText = qmMatch[2].trim();

    for (const mp of MATERIAL_PATTERNS) {
      if (mp.pattern.test(materialText) && !alreadyMatched.has(mp.slug + qty)) {
        alreadyMatched.add(mp.slug + qty);
        fields.materials.push({
          name: mp.name,
          quantity: qty,
          unit: 'ton',
          matchedSlug: mp.slug,
        });
        break;
      }
    }
  }

  // Also look for "- <quantity> <material>" patterns (bulleted lists)
  const bulletPattern = /[-•]\s*(\d[\d,]*(?:\.\d+)?)\s*(?:tons?|cubic\s*yards?|cy|loads?)?\s+(.+)/gi;
  let bulletMatch;
  while ((bulletMatch = bulletPattern.exec(text)) !== null) {
    const qty = parseFloat(bulletMatch[1].replace(/,/g, ''));
    const materialText = bulletMatch[2].trim();

    for (const mp of MATERIAL_PATTERNS) {
      if (mp.pattern.test(materialText) && !alreadyMatched.has(mp.slug + qty)) {
        alreadyMatched.add(mp.slug + qty);
        fields.materials.push({
          name: mp.name,
          quantity: qty,
          unit: 'ton',
          matchedSlug: mp.slug,
        });
        break;
      }
    }
  }

  if (fields.materials.length > 0) {
    fields.confidence.materials = 0.75;
  }

  // Overall confidence
  const confidenceValues = Object.values(fields.confidence);
  const overall = confidenceValues.length > 0
    ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
    : 0;
  fields.confidence._overall = overall;

  return fields;
}

/**
 * Process a document (text or buffer) through parsing
 */
export async function processDocument(content: Buffer, contentType: string): Promise<{
  rawText: string;
  extractedFields: ExtractedQuoteFields;
}> {
  let rawText = '';

  if (contentType === 'text/plain' || contentType === 'application/pdf') {
    rawText = content.toString('utf-8');
  }

  const extractedFields = parseQuoteRequestFromText(rawText);

  return { rawText, extractedFields };
}
