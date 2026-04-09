import './globals.css';

export const metadata = {
  title: 'ממשק ניהול | שילובים בטבע',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
