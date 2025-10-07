import React, { useMemo } from 'react';
import styles from './BioAuroraDashboard.module.css';
import { AuroraBackdrop } from '../../../terminal/organisms/AuroraBackdrop';
import { Panel } from '../../../terminal/organisms/Panel';
import { DataTable, type Column } from '../../../tables/DataTable';
import { MonitoringTable } from '../../../tables/MonitoringTable';
import { Progress } from '../../../terminal/atoms/Progress';
import { Button } from '../../../terminal/atoms/Button';
import { Text } from '../../../terminal/atoms/Text';
import { Badge } from '../../../terminal/atoms/Badge';
import { SparkLine } from '../../../terminal/visualizations/SparkLine';
import { RadarChart } from '../../../terminal/visualizations/RadarChart';
import { ProgressCircle } from '../../../terminal/visualizations/ProgressCircle';
import { BioMetricGrid } from '../../molecules/BioMetricGrid';
import { CatalystTicker } from '../../molecules/CatalystTicker';
import type {
  BioAuroraDashboardProps,
  BioAuroraMetric,
  Catalyst,
  ExposureSlice,
  PortfolioPosition,
  PipelineStage,
} from '@/types/biotech';
import type { MonitoringRow } from '@/tables/MonitoringTable';

type DashboardDataset = Required<
  Pick<
    BioAuroraDashboardProps,
    'headline' | 'metrics' | 'catalysts' | 'positions' | 'exposures' | 'pipeline'
  >
>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const formatPercent = (value: number, fraction = 1) =>
  `${value > 0 ? '+' : ''}${value.toFixed(fraction)}%`;

const formatWeight = (value: number) => `${(value * 100).toFixed(1)}%`;

const formatShortDate = (dateString?: string) => {
  if (!dateString) return 'TBD';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const catalystProgress = (dateString?: string) => {
  if (!dateString) return 55;
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return 55;
  const diffDays = (parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const clamped = Math.max(0, Math.min(45, diffDays));
  return Math.round(85 - (clamped / 45) * 55);
};

const DEFAULT_HEADLINE: DashboardDataset['headline'] = {
  fundName: 'AURORA BIO ALPHA',
  strategy: 'GENE + CELL THERAPY MOMENTUM',
  status: 'success',
  lastUpdated: new Date().toISOString(),
  nav: 2_540_000_000,
  navChange: 62_000_000,
  navChangePercent: 2.7,
};

const DEFAULT_METRICS: BioAuroraMetric[] = [
  {
    id: 'aum',
    label: 'NET ASSET VALUE',
    value: '$2.54B',
    change: 2.7,
    changeLabel: 'vs prior week',
    trend: 'up',
    variant: 'primary',
    supportText: 'Peak NAV: $2.61B',
  },
  {
    id: 'alpha',
    label: 'ALPHA CAPTURE',
    value: '+418 bps',
    change: 0.36,
    changeLabel: '7d efficiency',
    trend: 'up',
    variant: 'accent',
    supportText: 'Contribution: Oncology 58%',
  },
  {
    id: 'drawdown',
    label: 'MAX DRAWDOWN',
    value: '-3.1%',
    change: 0.4,
    changeLabel: 'hedge overlay',
    trend: 'neutral',
    variant: 'secondary',
    supportText: 'Target guardrail: -5%',
  },
  {
    id: 'exposure',
    label: 'NET EXPOSURE',
    value: '62%',
    change: -0.9,
    changeLabel: 'weekly delta',
    trend: 'down',
    variant: 'primary',
    supportText: 'Gross leverage 1.42x',
  },
];

const DEFAULT_SPARKLINES = {
  navCurve: [92, 95, 101, 104, 109, 114, 121, 128, 134, 142, 151, 158],
  alphaCurve: [0.6, 0.9, 1.2, 1.18, 1.44, 1.5, 1.67, 1.9, 2.1],
  stressCurve: [32, 29, 36, 30, 27, 24, 22, 25, 21, 19],
};

const DEFAULT_CATALYSTS: Catalyst[] = [
  {
    id: 'cat-01',
    label: 'SRP-5051 DMD DATA DROP',
    date: '2025-11-05',
    risk: 'High',
    expectedImpact: 'High',
    category: 'Clinical',
    description: 'Pivotal dystrophin expression readout; street looking for >6% baseline delta.',
  },
  {
    id: 'cat-02',
    label: 'BEAM-302 FDA CLEARANCE',
    date: '2025-10-29',
    risk: 'Medium',
    expectedImpact: 'High',
    category: 'Regulatory',
    description: 'Gene editing IND clock ends; watch for CMC queries.',
  },
  {
    id: 'cat-03',
    label: 'NTLA-2002 PRISM EXPANSION',
    date: '2025-11-18',
    risk: 'Low',
    expectedImpact: 'Medium',
    category: 'Commercial',
    description: 'Acute post-launch uptake with EU payers; consensus 48 treated patients.',
  },
  {
    id: 'cat-04',
    label: 'RGX-202 DATA SAFETY',
    date: '2025-10-21',
    risk: 'Medium',
    expectedImpact: 'Medium',
    category: 'Clinical',
    description: 'Dose-escalation DSMB; monitoring transaminase profile vs competitor.',
  },
];

const DEFAULT_POSITIONS: PortfolioPosition[] = [
  {
    id: 'pos-01',
    ticker: 'SRPT',
    company: 'Sarepta Therapeutics',
    weight: 0.145,
    pnl: 58_400_000,
    catalystDate: '2025-11-05',
    thesis: 'Next-gen exon-skipping momentum',
    risk: 'High',
    region: 'US',
  },
  {
    id: 'pos-02',
    ticker: 'BEAM',
    company: 'Beam Therapeutics',
    weight: 0.112,
    pnl: 21_700_000,
    catalystDate: '2025-10-29',
    thesis: 'Prime editing leadership; IND runway',
    risk: 'Medium',
    region: 'US',
  },
  {
    id: 'pos-03',
    ticker: 'NTLA',
    company: 'Intellia Therapeutics',
    weight: 0.098,
    pnl: 14_200_000,
    catalystDate: '2025-11-18',
    thesis: 'CRISPR pipeline optionality',
    risk: 'Low',
    region: 'US',
  },
  {
    id: 'pos-04',
    ticker: 'REGN',
    company: 'Regeneron',
    weight: 0.083,
    pnl: 9_600_000,
    catalystDate: '2025-12-02',
    thesis: 'Gene combo leverage / solid base',
    risk: 'Low',
    region: 'US',
  },
  {
    id: 'pos-05',
    ticker: 'GNFT',
    company: 'Genfit',
    weight: 0.061,
    pnl: -4_100_000,
    catalystDate: '2025-10-30',
    thesis: 'Orphan cholestatic franchise',
    risk: 'Medium',
    region: 'EU',
  },
];

const DEFAULT_EXPOSURES: ExposureSlice[] = [
  { id: 'exp-01', label: 'Oncology', weight: 0.31, performance: 1.8, color: '#f43f5e' },
  { id: 'exp-02', label: 'Rare Disease', weight: 0.24, performance: 2.2, color: '#ef4444' },
  { id: 'exp-03', label: 'Gene Editing', weight: 0.19, performance: 1.5, color: '#38bdf8' },
  { id: 'exp-04', label: 'Cell Therapy', weight: 0.14, performance: 1.2, color: '#a855f7' },
  { id: 'exp-05', label: 'Neuro', weight: 0.12, performance: 0.8, color: '#fb7185' },
];

const DEFAULT_PIPELINE: PipelineStage[] = [
  { name: 'Discovery', progress: 0.82, startDate: '2025-04-01', endDate: '2025-08-01' },
  { name: 'Preclinical', progress: 0.64, startDate: '2025-05-10', endDate: '2025-12-15' },
  { name: 'IND Prep', progress: 0.46, startDate: '2025-07-01', endDate: '2026-03-01' },
  { name: 'Phase I', progress: 0.18, startDate: '2025-09-05', endDate: '2026-12-20' },
];

const DEFAULT_DATASET: DashboardDataset = {
  headline: DEFAULT_HEADLINE,
  metrics: DEFAULT_METRICS,
  catalysts: DEFAULT_CATALYSTS,
  positions: DEFAULT_POSITIONS,
  exposures: DEFAULT_EXPOSURES,
  pipeline: DEFAULT_PIPELINE,
};

const riskVariantMap = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
} as const;

export const BioAuroraDashboard: React.FC<BioAuroraDashboardProps> = ({
  theme = 'aurora-red',
  headline,
  metrics,
  catalysts,
  positions,
  exposures,
  pipeline,
  onSelectCatalyst,
  onSelectPosition,
}) => {
  const dataset = useMemo<DashboardDataset>(() => ({
    headline: headline ?? DEFAULT_DATASET.headline,
    metrics: metrics ?? DEFAULT_DATASET.metrics,
    catalysts: catalysts ?? DEFAULT_DATASET.catalysts,
    positions: positions ?? DEFAULT_DATASET.positions,
    exposures: exposures ?? DEFAULT_DATASET.exposures,
    pipeline: pipeline ?? DEFAULT_DATASET.pipeline,
  }), [headline, metrics, catalysts, positions, exposures, pipeline]);

  const metricColumns = useMemo(() => {
    if (dataset.metrics.length >= 4) return 4;
    if (dataset.metrics.length <= 2) return 2;
    return 3;
  }, [dataset.metrics]) as 2 | 3 | 4;

  const positionColumns = useMemo<Column<PortfolioPosition>[]>(() => [
    { key: 'ticker', header: 'TICKER', width: 90 },
    {
      key: 'company',
      header: 'COMPANY',
      width: 220,
      render: (_, row) => (
        <Text as="span" variant="body-sm" color="secondary" tabularNums>
          {row.company}
        </Text>
      ),
    },
    {
      key: 'weight',
      header: 'WEIGHT',
      width: 100,
      render: (value: number) => (
        <Text as="span" variant="body-sm" color="accent" tabularNums>
          {formatWeight(value)}
        </Text>
      ),
    },
    {
      key: 'pnl',
      header: 'P&L',
      align: 'right',
      render: (value: number) => (
        <Text
          as="span"
          variant="body-sm"
          color={value >= 0 ? 'success' : 'error'}
          tabularNums
        >
          {formatCurrency(Math.abs(value))} {value >= 0 ? '▲' : '▼'}
        </Text>
      ),
    },
    {
      key: 'catalystDate',
      header: 'CATALYST',
      render: (value?: string) => (
        <Badge variant="info" filled>
          {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
        </Badge>
      ),
    },
    {
      key: 'risk',
      header: 'RISK',
      render: (value) => (
        <Badge variant={riskVariantMap[value as keyof typeof riskVariantMap]} filled>
          {value}
        </Badge>
      ),
    },
  ], []);

  const radarData = useMemo(
    () =>
      dataset.exposures.map((slice) => ({
        label: slice.label,
        value: Math.round(slice.weight * 100),
      })),
    [dataset.exposures]
  );

  const pipelineStages = dataset.pipeline;
  const monitoringRows = useMemo<MonitoringRow[]>(() => (
    dataset.catalysts.slice(0, 5).map((catalyst) => ({
      id: catalyst.id,
      label: catalyst.label,
      description: catalyst.description ?? `${catalyst.category ?? 'Catalyst'} window`,
      status: riskVariantMap[catalyst.risk],
      progress: catalystProgress(catalyst.date),
      actionLabel: 'VIEW',
      actionVariant: 'secondary',
      meta: `${formatShortDate(catalyst.date)} | ${catalyst.expectedImpact ?? 'Impact TBD'}`,
    }))
  ), [dataset.catalysts]);

  return (
    <div className={styles.wrapper}>
      <AuroraBackdrop className={styles.auroraLayout}>
        <div className={styles.dashboard} data-theme={theme}>
          <div className={styles.hero}>
            <div className={styles.heroPanel}>
              <div className={styles.heroHeader}>
                <div className={styles.fundTitle}>
                  <div className={styles.fundTitleText}>
                    <Text as="span" variant="label" color="secondary" uppercase>
                      {dataset.headline.strategy}
                    </Text>
                    <Text as="h1" variant="heading-lg" color="primary" weight={600}>
                      {dataset.headline.fundName}
                    </Text>
                  </div>
                  <span className={styles.statusBadge}>
                    LIVE MONITOR • {new Date(dataset.headline.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={styles.heroActions}>
                  <Button variant="primary" size="sm">Execute Trade</Button>
                  <Button variant="secondary" size="sm">Open Scenario Pad</Button>
                  <Button variant="ghost" size="sm">Share Brief</Button>
                </div>
              </div>

              <BioMetricGrid metrics={dataset.metrics} columns={metricColumns} />

              <CatalystTicker
                catalysts={dataset.catalysts}
                onSelect={onSelectCatalyst}
              />
            </div>

            <div className={styles.sparklinePanel}>
              <div className={styles.sparklineRow}>
                <div className={styles.sparklineCard}>
                  <Text as="div" variant="label" color="secondary" uppercase>
                    NAV TRAJECTORY
                  </Text>
                  <SparkLine data={DEFAULT_SPARKLINES.navCurve} height={56} width={200} color="rgba(244, 63, 94, 0.9)" fillColor="rgba(244, 63, 94, 0.2)" />
                </div>
                <div className={styles.sparklineCard}>
                  <Text as="div" variant="label" color="secondary" uppercase>
                    ALPHA MOMENTUM
                  </Text>
                  <SparkLine data={DEFAULT_SPARKLINES.alphaCurve} height={56} width={200} color="rgba(56, 189, 248, 0.9)" fillColor="rgba(56, 189, 248, 0.2)" />
                </div>
                <div className={styles.sparklineCard}>
                  <Text as="div" variant="label" color="secondary" uppercase>
                    STRESS BAROMETER
                  </Text>
                  <SparkLine data={DEFAULT_SPARKLINES.stressCurve} height={56} width={200} color="rgba(168, 85, 247, 0.9)" fillColor="rgba(168, 85, 247, 0.2)" />
                </div>
              </div>

              <div className={styles.exposurePanel}>
                <Text as="div" variant="label" color="secondary" uppercase>
                  PORTFOLIO EXPOSURE MAP
                </Text>

                <RadarChart
                  data={radarData}
                  size={280}
                  color="rgba(244, 63, 94, 0.9)"
                />

                <div className={styles.sparklineRow}>
                  {dataset.exposures.map((slice) => (
                    <div key={slice.id} className={styles.sparklineCard}>
                      <Text as="div" variant="body-sm" color="accent" uppercase>
                        {slice.label}
                      </Text>
                      <Text as="div" variant="heading" color="primary" tabularNums>
                        {formatWeight(slice.weight)}
                      </Text>
                      <Text as="div" variant="body-sm" color={slice.performance && slice.performance >= 0 ? 'success' : 'error'}>
                        {slice.performance ? formatPercent(slice.performance, 1) : 'FLAT'}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.coreGrid}>
            <div className={styles.coreLeft}>
              <Panel
                title="PORTFOLIO POSITIONS"
                subtitle="MONITORED EXPOSURES"
                cornerBrackets
                className={styles.positionsPanel}
              >
                <DataTable
                  columns={positionColumns}
                  data={dataset.positions}
                  dense
                  keyExtractor={(row) => row.id}
                  onRowClick={onSelectPosition}
                  className={styles.positionsTable}
                />
              </Panel>

              <Panel
                title="PIPELINE VELOCITY"
                subtitle="PROGRAM EXECUTION STATUS"
                cornerBrackets
              >
                <div className={styles.sparklinePanel}>
                  {pipelineStages.map((stage) => (
                    <div key={stage.name} className={styles.sparklineCard}>
                      <Text as="div" variant="label" color="secondary" uppercase>
                        {stage.name}
                      </Text>
                      <Text as="div" variant="heading" color="primary" tabularNums>
                        {Math.round(stage.progress * 100)}%
                      </Text>
                      <Progress
                        value={stage.progress * 100}
                        variant={stage.progress > 0.7 ? 'success' : stage.progress > 0.4 ? 'info' : 'warning'}
                      />
                      <Text as="div" variant="body-sm" color="secondary">
                        [
                          stage.startDate ? `Start ${new Date(stage.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : null,
                          stage.endDate ? `ETA ${new Date(stage.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : null,
                        ].filter(Boolean).join(' | ')
                      </Text>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className={styles.corePanels}>
              <div className={styles.exposurePanel}>
                <Text as="div" variant="label" color="secondary" uppercase>
                  READINESS INDEX
                </Text>
                <div className={styles.heroActions}>
                  <ProgressCircle value={82} status="success" label="Coverage" size={104} />
                  <ProgressCircle value={64} status="warning" label="Liquidity" size={104} />
                  <ProgressCircle value={48} status="info" label="Hedge" size={104} />
                </div>
                <Text as="div" variant="body" color="secondary">
                  Coverage ratio and hedge depth auto-sync with prime broker telemetry every five minutes.
                </Text>
              </div>

              <div className={styles.exposurePanel}>
                <Text as="div" variant="label" color="secondary" uppercase>
                  ALERT STREAM
                </Text>
                <MonitoringTable
                  rows={monitoringRows}
                  onAction={(rowId) => {
                    const match = dataset.catalysts.find((item) => item.id === rowId);
                    if (match) {
                      onSelectCatalyst?.(match);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles.alertRibbon}>
            <span>
              <strong>Live Aurora Feed:</strong> 4 catalysts in focus • Stress index 18% • NAV {formatCurrency(dataset.headline.nav)}
            </span>
            <span>Transmission encrypted • Baker Brothers mirror active</span>
          </div>
        </div>
      </AuroraBackdrop>
    </div>
  );
};
