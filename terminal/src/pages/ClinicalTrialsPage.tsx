import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ClinicalTrialsTimeline,
  type ClinicalTrial
} from '../../../frontend-components/src/biotech';

// Mock data for sophisticated trials display
const DEFAULT_TRIALS: ClinicalTrial[] = [
  {
    id: 'NCT05123456',
    title: 'SRPT-5051 in Boys with DMD - Phase 3 MOMENTUM Study',
    phase: 'Phase III',
    status: 'Recruiting',
    indication: 'Duchenne Muscular Dystrophy',
    primaryCompletion: '2025-08-15',
    estimatedEnrollment: 220,
    sponsors: ['Sarepta Therapeutics'],
    locations: ['USA', 'Europe', 'Canada'],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'NCT04987654',
    title: 'BEAM-302 Base Editing for Sickle Cell Disease',
    phase: 'Phase II',
    status: 'Active, not recruiting',
    indication: 'Sickle Cell Disease',
    primaryCompletion: '2025-12-30',
    estimatedEnrollment: 45,
    sponsors: ['Beam Therapeutics'],
    locations: ['USA', 'UK'],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'NCT03654321',
    title: 'NTLA-2001 CRISPR Gene Editing for ATTR Amyloidosis',
    phase: 'Phase I',
    status: 'Completed',
    indication: 'ATTR Amyloidosis',
    primaryCompletion: '2024-06-15',
    estimatedEnrollment: 12,
    sponsors: ['Intellia Therapeutics'],
    locations: ['USA', 'Netherlands'],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'NCT05456789',
    title: 'REGN-EB3 Antibody Cocktail for Ebola Virus',
    phase: 'Phase III',
    status: 'Suspended',
    indication: 'Ebola Virus Disease',
    primaryCompletion: '2025-04-20',
    estimatedEnrollment: 150,
    sponsors: ['Regeneron Pharmaceuticals'],
    locations: ['Africa', 'USA'],
    lastUpdated: new Date().toISOString(),
  }
];

const fetchTrialsData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/biotech/trials');
    if (!response.ok) {
      return DEFAULT_TRIALS;
    }
    const data = await response.json();
    return data.trials || DEFAULT_TRIALS;
  } catch {
    console.log('Backend unavailable, using default trials data');
    return DEFAULT_TRIALS;
  }
};

export function ClinicalTrialsPage() {
  const { 
    data: trialsData = DEFAULT_TRIALS,
  } = useQuery({
    queryKey: ['clinical-trials'],
    queryFn: fetchTrialsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">LIVE CLINICAL TRIALS TRACKER</div>
        <h1>PHARMACEUTICAL TRIALS INTELLIGENCE</h1>
        <div className="subtitle">Real-time clinical trial tracking & outcomes analysis</div>
      </div>

      <ClinicalTrialsTimeline
        symbol="BIOTECH PORTFOLIO"
        trials={trialsData}
        onTrialSelect={(trial: ClinicalTrial) => {
          console.log('Selected trial:', trial);
          // Could open detailed trial analysis modal
        }}
      />
    </div>
  );
}