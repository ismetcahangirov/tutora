import type { Metadata } from 'next';
import { APP_NAME } from '@shared/constants';

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Find trusted tutors by budget, district, subject, and format.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
