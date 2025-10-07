import '../../vendor/openbb/plotly/index.css';

import { useMemo } from 'react';
// import Chart from '../../vendor/openbb/plotly/components/Chart';

// Temporary placeholder component
const Chart = (props: any) => <div>Chart component placeholder</div>;

export interface OpenBBPlotPayload {
  data?: any[];
  layout?: Record<string, any>;
  frames?: any[];
  config?: Record<string, any>;
  theme?: 'light' | 'dark';
  command_location?: string;
  python_version?: string;
  pywry_version?: string;
  terminal_version?: string;
}

export interface OpenBBPlotProps {
  payload: OpenBBPlotPayload;
  className?: string;
}

interface PlotGlobals {
  added_traces: any[];
  csv_yaxis_id: string | null;
  cmd_src_idx: number | null;
  cmd_idx: number | null;
  cmd_src: string;
  old_margin: Record<string, any> | null;
  title: string;
}

interface TransformedPlot {
  json: {
    data: any[];
    layout: Record<string, any>;
    frames?: any[];
    config?: Record<string, any>;
  };
  date: Date;
  cmd: string;
  title: string;
  globals: PlotGlobals;
  theme: 'light' | 'dark';
}

const deepClone = <T,>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export const transformOpenBBPlotPayload = (
  payload: OpenBBPlotPayload,
): TransformedPlot | null => {
  if (!payload) {
    return null;
  }

  const cloned = deepClone({
    data: payload.data ?? [],
    layout: payload.layout ?? {},
    frames: payload.frames ?? [],
    config: payload.config ?? {},
  });

  const globals: PlotGlobals = {
    added_traces: [],
    csv_yaxis_id: null,
    cmd_src_idx: null,
    cmd_idx: null,
    cmd_src: '',
    old_margin: null,
    title: '',
  };

  const layout = cloned.layout ?? {};

  if (Array.isArray(layout.annotations)) {
    layout.annotations.forEach((annotation: Record<string, any>, index: number) => {
      if (typeof annotation?.text === 'string' && annotation.text.startsWith('/')) {
        globals.cmd_src = annotation.text;
        globals.cmd_idx = index;
        annotation.text = '';

        if (layout.margin) {
          globals.old_margin = { ...layout.margin };
          if (layout.margin.t !== undefined && layout.margin.t > 40) {
            layout.margin.t = 40;
          }
          if (
            payload.command_location === '/equity/price/historical' &&
            layout.margin.r !== undefined
          ) {
            layout.margin.r = Math.max(0, layout.margin.r - 50);
          }
        }
      }
    });
  }

  if (Array.isArray(cloned.data)) {
    cloned.data.forEach((trace: Record<string, any>) => {
      if (trace && trace.name) {
        trace.hoverlabel = { namelength: -1 };
      }
    });
  }

  const rawTitle =
    layout?.title?.text ??
    payload.command_location?.toUpperCase() ??
    'OpenBB Chart';

  globals.title = rawTitle;

  const sanitizedTitle = rawTitle
    .replace(/ -/g, '')
    .replace(/-/g, '')
    .replace(/<b>|<\/b>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const figureTitle = sanitizedTitle.length ? sanitizedTitle : 'OpenBB Chart';

  const theme = payload.theme === 'light' ? 'light' : 'dark';

  return {
    json: cloned,
    date: new Date(),
    cmd: payload.command_location ?? '',
    title: figureTitle,
    globals,
    theme,
  };
};

export const OpenBBPlot: React.FC<OpenBBPlotProps> = ({ payload, className }) => {
  const transformed = useMemo(
    () => transformOpenBBPlotPayload(payload),
    [payload],
  );

  if (!transformed) {
    return null;
  }

  return (
    <div className={className}>
      <Chart
        json={transformed.json}
        date={transformed.date}
        cmd={transformed.cmd}
        title={transformed.title}
        globals={transformed.globals}
        theme={transformed.theme}
      />
    </div>
  );
};

export default OpenBBPlot;
