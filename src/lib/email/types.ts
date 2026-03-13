/**
 * Email provider types — shared between mock and real providers
 */

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
  size: number;
}

export interface IncomingEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: Date;
  attachments: EmailAttachment[];
}

export interface EmailProvider {
  /** Fetch new unprocessed emails from the inbox */
  fetchNewEmails(): Promise<IncomingEmail[]>;
  /** Mark an email as processed so it's not fetched again */
  markProcessed(emailId: string): Promise<void>;
}
