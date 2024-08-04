import './index.css';

import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'afk community portal',
  description: 'afk community portal',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
