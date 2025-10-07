import './globals.css';
import '../styles/global.css';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { NavBar } from '@/components/ui/NavBar';
import React from 'react';

export const metadata = { title: 'Aurora Mega Learning', description: 'Unified advanced learning & AI environment' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen relative">
        <AuroraBackground />
        {/* Theme toggle script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {try {const m = localStorage.getItem('theme'); if(m){document.documentElement.classList.toggle('dark', m==='dark');} else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`
          }} />
        {/* NavBar is server component */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <NavBar />
          {children}
        </div>
      </body>
    </html>
  );
}
