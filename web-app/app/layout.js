import './globals.css';

export const metadata = {
  title: 'Bricx Content Engine — know what to post, and why',
  description: 'Weekly content intelligence: paste X posts, analyze why they worked, generate an on-brand brief.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
