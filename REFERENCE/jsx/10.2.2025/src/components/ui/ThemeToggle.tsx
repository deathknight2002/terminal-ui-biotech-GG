"use client";
import React from 'react';

export const ThemeToggle: React.FC = () => {
  const [dark, setDark] = React.useState<boolean>(false);
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  }
  return (
    <button onClick={toggle} className="text-[10px] uppercase tracking-wide px-2 py-1 rounded glass hover:bg-white/5">
      {dark ? 'Light' : 'Dark'}
    </button>
  );
};