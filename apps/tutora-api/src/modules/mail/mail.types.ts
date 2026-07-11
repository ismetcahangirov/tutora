/** A fully composed, ready-to-send email. */
export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

/** Minimal projection of a user needed to send the localized welcome email. */
export interface WelcomeRecipient {
  email: string;
  name: string | null;
  locale: string | null;
}
