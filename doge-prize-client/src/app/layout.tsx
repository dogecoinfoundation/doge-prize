import type { Metadata } from "next";
import "./globals.css";
import { getServerConfig } from '../config/server';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getServerConfig();
  
  return {
    title: config.pageTitle,
    description: config.pageDescription,
    icons: [
      { rel: 'icon', url: '/favicon.ico' },
      { rel: 'shortcut icon', url: '/favicon.ico' },
    ],
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
