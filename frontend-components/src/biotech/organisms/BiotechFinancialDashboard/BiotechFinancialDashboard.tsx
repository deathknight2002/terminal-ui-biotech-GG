import { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MetricCard } from '@/terminal/molecules/MetricCard';
import { Panel } from '@/terminal/organisms/Panel';
import type {
  RoyaltyTier,
  BiotechFinancialDashboardProps,
} from '@/types/biotech';




// Utility functions for financial calculations
const formatToMillions = (value: number): string => {
  if (value === 0) return "-";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs < 1_000_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
};

const royaltyComputation = (royaltyTable: RoyaltyTier[], sales: number): number => {
  if (!royaltyTable?.length || sales <= 0) return 0;
  let totalRoyalty = 0;
  let remainingSales = sales;

  for (const tier of royaltyTable) {
    if (remainingSales <= 0) break;

    const applicableSales = Math.min(remainingSales, tier.max - tier.min);
    if (applicableSales > 0) {
      totalRoyalty += applicableSales * tier.rate;
      remainingSales -= applicableSales;
    }
  }
  return totalRoyalty;
};

export function BiotechFinancialDashboard({
  asset,
  projection,
  className
}: BiotechFinancialDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'projections' | 'milestones'>('overview');

  // Calculate financial projections
  const projections = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: projection.patientProjections.length }, (_, i) => currentYear + i);

    return projection.patientProjections.map((pp, index) => {
      const year = years[index];
      const totalRevenue = pp.revenue;
      const netRevenue = totalRevenue * projection.assumptions.marketPenetration; // Using marketPenetration as sales_margin
      const royalties = royaltyComputation(projection.royaltyTiers, totalRevenue);
      const grossProfit = netRevenue - royalties;
      const netIncome = grossProfit * (1 - projection.assumptions.discountRate); // Using discountRate as tax_rate

      return {
        year,
        revenue: totalRevenue,
        expenses: totalRevenue - netRevenue + royalties,
        netIncome,
        patients: {
          us: pp.patients, // Assuming patients is total for now
          eur: 0,
          row: 0,
          total: pp.patients
        }
      };
    });
  }, [asset, projection]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (!projections.length) return {
      totalNPV: 0,
      peakRevenue: 0,
      cumulativeRevenue: 0,
      breakEvenYear: undefined
    };

    const totalNPV = projection.npv;
    const cumulativeRevenue = projections.reduce((sum, p) => sum + p.revenue, 0);
    const peakRevenue = projection.peakSales;
    let breakEvenYear: number | undefined;

    // Recalculate breakEvenYear based on the new projections structure
    let cumulativeNetIncome = 0;
    for (const proj of projections) {
      cumulativeNetIncome += proj.netIncome;
      if (cumulativeNetIncome > 0) {
        breakEvenYear = proj.year;
        break;
      }
    }
    return { totalNPV, peakRevenue, cumulativeRevenue, breakEvenYear };
  }, [projections, projection]);

  const chartData = projections.map(proj => ({
    year: proj.year.toString(),
    Revenue: proj.revenue / 1_000_000,
    'Net Income': proj.netIncome / 1_000_000,
    Patients: proj.patients?.total || 0
  }));
  
  const developmentMilestones = projection.milestones.filter(m => m.type === 'regulatory'); // Assuming regulatory are development
  const salesMilestones = projection.milestones.filter(m => m.type === 'sales'); // Assuming sales type for sales milestones

  return (
    <div className={clsx('biotech-financial-dashboard', className)}>
      {/* Hero Metrics */}
      <div className="hero-metrics-grid">
        <MetricCard
          label="Total NPV"
          value={formatToMillions(metrics.totalNPV)}
          subtitle="Net Present Value"
          variant="revenue"
          trend="up"
        />
        <MetricCard
          label="Peak Revenue"
          value={formatToMillions(metrics.peakRevenue)}
          subtitle="Maximum Annual Revenue"
          variant="revenue"
          trend="up"
        />
        <MetricCard
          label="Break-Even"
          value={metrics.breakEvenYear?.toString() || "TBD"}
          subtitle="First Profitable Year"
          variant="primary"
          trend="flat"
        />
        <MetricCard
          label="Cumulative Revenue"
          value={formatToMillions(metrics.cumulativeRevenue)}
          subtitle="Total Revenue Projection"
          variant="revenue"
          trend="up"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={clsx('tab-button', { active: activeTab === 'overview' })}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={clsx('tab-button', { active: activeTab === 'projections' })}
          onClick={() => setActiveTab('projections')}
        >
          Projections
        </button>
        <button 
          className={clsx('tab-button', { active: activeTab === 'milestones' })}
          onClick={() => setActiveTab('milestones')}
        >
          Milestones
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <Panel title="Revenue vs Net Income" cornerBrackets>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--eclipse-void)',
                        border: '1px solid var(--eclipse-aurora)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Revenue" 
                      stroke="var(--biotech-emerald)" 
                      strokeWidth={3}
                      dot={{ fill: 'var(--biotech-emerald)', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Net Income" 
                      stroke="var(--biotech-cyan)" 
                      strokeWidth={3}
                      dot={{ fill: 'var(--biotech-cyan)', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="projections-content">
            <Panel title="Patient Population Growth" cornerBrackets>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.7)" />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--eclipse-void)',
                        border: '1px solid var(--eclipse-aurora)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Patients" 
                      stroke="var(--biotech-teal)" 
                      fill="var(--biotech-teal)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="milestones-content">
            <Panel title="Development & Sales Milestones" cornerBrackets>
              <div className="milestones-grid">
                {developmentMilestones.map((milestone) => (
                  <MetricCard
                    key={milestone.id}
                    label={`Development ${milestone.name}`}
                    value={formatToMillions(milestone.value)}
                    variant="milestone"
                    subtitle={milestone.date}
                  />
                ))}
                {salesMilestones.map((milestone) => (
                  <MetricCard
                    key={milestone.id}
                    label={`Sales > ${formatToMillions(milestone.value)}`}
                    value={formatToMillions(milestone.value)}
                    variant="royalty"
                    subtitle={milestone.date}
                  />
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
