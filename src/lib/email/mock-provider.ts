import type { EmailProvider, IncomingEmail } from './types';

/**
 * Mock email provider — generates realistic aggregate quote request emails for demo.
 * Swap for a real IMAP/Gmail provider in production.
 */
export class MockEmailProvider implements EmailProvider {
  private processedIds = new Set<string>();
  private emailBatch = 0;

  private readonly sampleEmails: Omit<IncomingEmail, 'id' | 'receivedAt'>[] = [
    {
      from: 'john.smith@abccontractors.com',
      to: 'quotes@bermontmaterials.com',
      subject: 'Need fill dirt quote - Palm Ave project',
      body: `Hi there,

I need a quote on approximately 500 tons of fill dirt delivered to our job site at 123 Palm Avenue, Fort Myers, FL 33901.

We're doing site prep for a new commercial building and need to start next Monday (March 17th). Would like to get this from your Alico location if possible.

Can you also quote us on 50 tons of commercial base for the parking area?

Thanks,
John Smith
ABC Contractors LLC
(239) 555-0123
john.smith@abccontractors.com`,
      attachments: [],
    },
    {
      from: 'mike.johnson@suncoastpaving.com',
      to: 'quotes@bermontmaterials.com',
      subject: 'Road base + commercial stone pricing',
      body: `Hello Bermont team,

We need pricing on the following materials for a parking lot project in Cape Coral:

- 200 tons FDOT B02 Road Base
- 150 tons Unwashed Commercial 89 Stone
- 75 tons Commercial Base

We'd like to pick up from the Clarion site. Project kicks off April 1st.

Please send the quote to this email.

Best regards,
Mike Johnson
Suncoast Paving Inc.
941-555-0456`,
      attachments: [],
    },
    {
      from: 'sarah@gulfcoastdev.com',
      to: 'quotes@bermontmaterials.com',
      subject: 'Rip rap for seawall repair - URGENT',
      body: `Hi,

We urgently need 75 tons of 6-12" rip rap delivered to 4500 Harbor Blvd, Port Charlotte, FL 33952. This is for a seawall repair project that's already underway.

Can you deliver this week? We also need about 30 tons of 3-6" rip rap for the same site.

Please call me ASAP with pricing.

Sarah Williams
Gulf Coast Development Group
(863) 555-0789
sarah@gulfcoastdev.com`,
      attachments: [],
    },
    {
      from: 'carlos.diaz@floridasitework.com',
      to: 'quotes@bermontmaterials.com',
      subject: 'Shell and fill for residential development',
      body: `Good morning,

I'm the project manager for a 24-lot residential development off Burnt Store Road in Punta Gorda. We need quotes on:

1. 1,200 tons fill dirt (for lot grading)
2. 300 tons small washed shell (driveways)
3. 200 tons medium washed shell (common areas)
4. 100 tons commercial base (road base)

This is a phased project - first delivery needed by March 24th, with deliveries continuing through June.

Delivery to: 8500 Burnt Store Rd, Punta Gorda, FL 33950

Volume discount available? We'll be a recurring customer.

Carlos Diaz
Florida Sitework Solutions
(941) 555-0234
carlos.diaz@floridasitework.com`,
      attachments: [],
    },
    {
      from: 'receptionist@pelicanbuilders.com',
      to: 'quotes@bermontmaterials.com',
      subject: 'FW: Material needs for Pelican Bay project',
      body: `Hi Bermont,

Forwarding this from our superintendent. He needs:

- 80 tons of perc sand for septic system install
- 50 tons of 131 rock screenings
- Pick up from whichever location has it in stock

Need this quote by end of day if possible. Project is at Pelican Bay, Naples.

Thanks!
Maria Rodriguez
Pelican Builders Inc
(239) 555-0567
Fax: (239) 555-0568`,
      attachments: [],
    },
    {
      from: 'dispatch@allcountypaving.com',
      to: 'quotes@bermontmaterials.com',
      subject: 'Ballast rock and 57 stone quote request',
      body: `Bermont Materials,

Please provide pricing on the following for pickup at Clarion:

Commercial Ballast Rock - 100 tons
Unwashed Commercial 57 Stone - 200 tons

We're doing a railyard access road in Arcadia. Start date is April 15th.

Jim Morrison
All County Paving & Grading
Office: (863) 555-0890
Cell: (863) 555-0891`,
      attachments: [],
    },
  ];

  async fetchNewEmails(): Promise<IncomingEmail[]> {
    const batchSize = 3;
    const startIdx = (this.emailBatch * batchSize) % this.sampleEmails.length;

    const emails: IncomingEmail[] = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = (startIdx + i) % this.sampleEmails.length;
      const template = this.sampleEmails[idx];
      const id = `mock-email-${this.emailBatch}-${i}`;

      if (this.processedIds.has(id)) continue;

      // Generate a mock text attachment for some emails
      const attachments = i === 0
        ? [{
            filename: `quote-request-${id}.txt`,
            contentType: 'text/plain',
            content: this.generateMockAttachment(template),
            size: 0,
          }]
        : [];

      emails.push({
        ...template,
        id,
        receivedAt: new Date(Date.now() - Math.random() * 86400000), // random time in last 24h
        attachments: attachments.map(a => ({ ...a, size: a.content.length })),
      });
    }

    this.emailBatch++;
    return emails;
  }

  async markProcessed(emailId: string): Promise<void> {
    this.processedIds.add(emailId);
  }

  private generateMockAttachment(template: Omit<IncomingEmail, 'id' | 'receivedAt'>): Buffer {
    const content = `QUOTE REQUEST
================

From: ${template.from}
Subject: ${template.subject}

${template.body}
`.trim();

    return Buffer.from(content, 'utf-8');
  }
}
