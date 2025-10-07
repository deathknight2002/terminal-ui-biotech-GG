import React from 'react';
import { notFound } from 'next/navigation';

// Temporary inline module registry (replace w/ dynamic loader)
const CONTENT: Record<string, { title: string; body: string }> = {
  'foundations': { title: 'Foundations', body: 'Foundational knowledge placeholder. Extend this module.' },
  'aurora-science': { title: 'Aurora Science Demo', body: 'Port legacy aurora_science_tab_react_demo.jsx here. Maintain structure + interactive elements.' }
};

export function generateStaticParams() {
  return Object.keys(CONTENT).map(slug => ({ slug }));
}

export default function LearnModulePage({ params }: { params: { slug: string } }) {
  const mod = CONTENT[params.slug];
  if (!mod) return notFound();
  return (
    <main className="prose prose-invert max-w-none">
      <h1 className="gradient-text text-4xl font-bold mb-4">{mod.title}</h1>
      <p className="text-sm leading-relaxed text-white/70 whitespace-pre-line">{mod.body}</p>
      <div className="mt-10 p-6 glass">
        <p className="text-xs text-white/50">Add richer components, diagrams, code blocks, quizzes, model calls.</p>
      </div>
    </main>
  );
}
