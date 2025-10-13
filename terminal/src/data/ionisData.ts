// Mock data for Ionis Pharmaceuticals with 42 pipeline programs
import type { PipelineProgram } from '../components/visualizations/PipelineVisualization'; // eslint-disable-line @typescript-eslint/no-unused-vars

export const IONIS_PROFILE = {
  ticker: 'IONS',
  name: 'Ionis Pharmaceuticals, Inc.',
  company_type: 'Biotech',
  description: 'Ionis Pharmaceuticals is a leader in RNA-targeted drug discovery and development, with a pipeline of over 40 drugs designed to treat patients with serious diseases. The company\'s antisense technology has enabled the development of multiple approved drugs and a robust pipeline across cardiovascular, neurological, metabolic, renal, and cancer indications.',
  website: 'https://www.ionispharma.com',
  investor_relations_url: 'https://ir.ionispharma.com',
  headquarters: 'Carlsbad, California',
  founded_year: 1989,
  employees: 850,
  financials: {
    market_cap: 4800000000,
    enterprise_value: 4200000000,
    cash_position: 850000000,
    latest_price: 42.50,
    price_change: 2.35,
    volume: 1250000,
  },
  xbi_membership: {
    is_constituent: true,
    added_date: '2010-03-15',
    removed_date: null,
  },
  pipeline: {
    program_count: 42,
    therapeutic_areas: ['Cardiovascular', 'Neurology', 'Oncology', 'Metabolic', 'Renal', 'Rare Disease'],
  },
  catalysts: {
    upcoming_count: 12,
  },
  updated_at: new Date().toISOString(),
};

// Generate stock chart data (90 days)
export const generateIonisStockData = () => {
  const data = [];
  const basePrice = 40;
  let currentPrice = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const dailyChange = (Math.random() - 0.48) * 2;
    currentPrice += dailyChange;
    
    const open = currentPrice;
    const high = currentPrice + Math.random() * 1.5;
    const low = currentPrice - Math.random() * 1.5;
    const close = currentPrice + (Math.random() - 0.5) * 0.5;
    const volume = Math.floor(800000 + Math.random() * 1000000);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
    
    currentPrice = close;
  }
  
  return data;
};
