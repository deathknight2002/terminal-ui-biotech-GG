// Define a basic interface for Plotly data traces
export interface PlotlyData {
  [key: string]: unknown; // Plotly data objects can have various properties
}

export interface PlotlyLayoutMargin {
  t?: number;
  r?: number;
  b?: number;
  l?: number;
}

export interface ChartProps {
  json?: {
    data: PlotlyData[];
    layout: Record<string, unknown>;
    frames?: unknown[];
    config?: Record<string, unknown>;
  };
  date?: Date;
  cmd?: string;
  title?: string;
  globals?: PlotGlobals;
  theme?: 'light' | 'dark';
}

export interface OpenBBPlotPayload {
  data?: PlotlyData[];
  layout?: Record<string, unknown>;
  frames?: unknown[];
  config?: Record<string, unknown>;
  theme?: 'light' | 'dark';
  command_location?: string;
  python_version?: string;
  pywry_version?: string;
  terminal_version?: string;
}

export interface PlotGlobals {
  added_traces: unknown[];
  csv_yaxis_id: string | null;
  cmd_src_idx: number | null;
  cmd_idx: number | null;
  cmd_src: string;
  old_margin: PlotlyLayoutMargin | null;
  title: string;
}

export interface OpenBBPlotProps {
  payload: OpenBBPlotPayload;
  className?: string;
}

export interface TransformedPlot {
  json: {
    data: PlotlyData[];
    layout: Record<string, unknown>;
    frames?: unknown[];
    config?: Record<string, unknown>;
  };
  date: Date;
  cmd: string;
  title: string;
  globals: PlotGlobals;
  theme: 'light' | 'dark';
}
