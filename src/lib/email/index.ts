import type { EmailProvider } from './types';
import { MockEmailProvider } from './mock-provider';

export type { EmailProvider, IncomingEmail, EmailAttachment } from './types';

/**
 * Factory for creating the appropriate email provider.
 * Currently returns MockEmailProvider for development/demo.
 */
export function createEmailProvider(): EmailProvider {
  // TODO: When real email credentials are available:
  // if (process.env.EMAIL_IMAP_HOST) {
  //   return new ImapEmailProvider({ ... });
  // }

  return new MockEmailProvider();
}
