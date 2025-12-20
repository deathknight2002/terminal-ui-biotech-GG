import { MenuItem } from '../../../frontend-components/src/terminal/organisms/AuroraTopBar/AuroraTopBar'

export const menuStructure: MenuItem[] = [
  {
    label: 'HOME',
    items: [{ label: 'Overview Dashboard', path: '/', description: 'Preview-ready PC experience' }],
  },
  {
    label: 'NEWS',
    items: [{ label: 'News Stream', path: '/news', description: 'Latest biotech headlines (offline-friendly)' }],
  },
  {
    label: 'TRIALS',
    items: [{ label: 'Clinical Trials', path: '/trials', description: 'Curated trial highlights' }],
  },
  {
    label: 'CATALYSTS',
    items: [{ label: 'Catalyst Calendar', path: '/catalysts', description: 'Upcoming events with expectations' }],
  },
  {
    label: 'FINANCIALS',
    items: [{ label: 'Financial Modeling', path: '/financials', description: 'Valuation-ready preview data' }],
  },
  {
    label: 'SCIENCE',
    items: [
      { label: 'Evidence Journal', path: '/evidence', description: 'Science-first notebook' },
      { label: '3D Molecules', path: '/3d', description: 'Molecule preview canvas' },
    ],
  },
]
