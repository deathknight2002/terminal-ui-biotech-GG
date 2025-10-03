import { Button, Text, Input, Metric, Panel, Badge, Spinner, StatusIndicator, DataTable, Checkbox, Switch, Tabs, Progress, Card, Gauge, DonutChart, BarChart, SparkLine, ProgressCircle, Section, MonitoringTable, Select, Modal, Toast, useToast, Tooltip, Accordion, Breadcrumbs } from '@deaxu/terminal-ui';
import type { Column, Tab, DonutSegment, BarDataPoint, MonitoringRow, SelectOption, AccordionItem, BreadcrumbItem } from '@deaxu/terminal-ui';
import { useState } from 'react';

interface AgentData {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'idle';
  location: string;
  missions: number;
}

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { messages, notify, remove } = useToast();

  const sampleData: AgentData[] = [
    { id: 'G-078W', name: 'VENGEFUL SPIRIT', status: 'success', location: 'Berlin', missions: 23 },
    { id: 'G-079X', name: 'OBSIDIAN SENTINEL', status: 'warning', location: 'Cairo', missions: 45 },
    { id: 'G-080Y', name: 'GHOSTLY FURY', status: 'warning', location: 'Tokyo', missions: 12 },
    { id: 'G-081Z', name: 'CURSED REVENANT', status: 'success', location: 'London', missions: 34 },
    { id: 'G-082A', name: 'VENOMOUS SHADE', status: 'idle', location: 'Moscow', missions: 8 },
  ];

  // Visualization data
  const mapMarkers: MapMarker[] = [
    { id: '1', x: 25, y: 25, label: 'New York', status: 'success', pulse: true },
    { id: '2', x: 48, y: 22, label: 'London', status: 'success', pulse: true },
    { id: '3', x: 52, y: 50, label: 'Cairo', status: 'warning', pulse: true },
    { id: '4', x: 70, y: 30, label: 'Tokyo', status: 'success', pulse: true },
    { id: '5', x: 80, y: 65, label: 'Sydney', status: 'idle' },
  ];

  const radarData: RadarDataPoint[] = [
    { label: 'Speed', value: 85 },
    { label: 'Stealth', value: 70 },
    { label: 'Combat', value: 90 },
    { label: 'Tech', value: 75 },
    { label: 'Intel', value: 95 },
    { label: 'Endurance', value: 80 },
  ];

  const activityData: ActivityDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
    timestamp: Date.now() - (29 - i) * 3600000,
    value: 20 + Math.random() * 60 + Math.sin(i / 3) * 20,
  }));

  const heatmapData: HeatmapCell[] = Array.from({ length: 168 }, (_, i) => ({
    id: `cell-${i}`,
    value: Math.random() * 100,
  }));

  const donutData: DonutSegment[] = [
    { label: 'Completed', value: 65, color: '#00d964' },
    { label: 'In Progress', value: 25, color: '#00d4ff' },
    { label: 'Pending', value: 10, color: '#ffb800' },
  ];

  const barData: BarDataPoint[] = [
    { label: 'Jan', value: 45 },
    { label: 'Feb', value: 67 },
    { label: 'Mar', value: 52 },
    { label: 'Apr', value: 89 },
    { label: 'May', value: 76 },
    { label: 'Jun', value: 94 },
  ];

  const sparkData = Array.from({ length: 20 }, () => Math.random() * 100);

  const selectOptions: SelectOption[] = [
    { value: 'option1', label: 'Agent Alpha' },
    { value: 'option2', label: 'Agent Beta' },
    { value: 'option3', label: 'Agent Gamma' },
    { value: 'option4', label: 'Agent Delta', disabled: true },
  ];

  const accordionItems: AccordionItem[] = [
    {
      id: 'section1',
      title: 'System Configuration',
      content: (
        <div>
          <Text variant="body-sm" color="secondary">Configure system-wide settings including network, security, and performance options.</Text>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Switch label="Enable auto-updates" defaultChecked />
            <Switch label="Debug logging" />
          </div>
        </div>
      ),
    },
    {
      id: 'section2',
      title: 'User Preferences',
      content: (
        <div>
          <Text variant="body-sm" color="secondary">Customize your user experience.</Text>
          <div style={{ marginTop: '12px' }}>
            <Select options={selectOptions} placeholder="Select theme" />
          </div>
        </div>
      ),
    },
    {
      id: 'section3',
      title: 'Advanced Options',
      content: <Text variant="body-sm" color="secondary">Advanced configuration for power users only.</Text>,
      disabled: true,
    },
  ];

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Dashboard', onClick: () => console.log('Navigate to Dashboard') },
    { label: 'Analytics', onClick: () => console.log('Navigate to Analytics') },
    { label: 'Real-time Indicators' },
  ];

  const monitoringRows: MonitoringRow[] = [
    {
      id: 'e-3',
      label: 'E-3',
      description: 'MP and design does not match',
      status: 'warning',
      actionLabel: 'ACTION',
      actionVariant: 'secondary',
      meta: '91%'
    },
    {
      id: 'e-6',
      label: 'E-6',
      description: 'Implementation difficulties',
      status: 'warning',
      actionLabel: 'ACTION',
      actionVariant: 'secondary',
      meta: '65%'
    },
    {
      id: 'd-3',
      label: 'D-3',
      description: '2nd round draft',
      status: 'success',
      progress: 85,
      meta: '542'
    },
    {
      id: 'e-4',
      label: 'E-4',
      description: 'Setup server with file structure',
      status: 'success',
      progress: 60,
      meta: '147'
    },
  ];

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'OVERVIEW',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text variant="body">System overview and real-time monitoring dashboard.</Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <Card title="CPU USAGE" bordered>
              <Progress value={67} variant="success" size="lg" />
              <Text variant="body-sm" color="secondary" style={{ marginTop: '8px' }}>67% utilized</Text>
            </Card>
            <Card title="MEMORY" bordered>
              <Progress value={82} variant="warning" size="lg" />
              <Text variant="body-sm" color="secondary" style={{ marginTop: '8px' }}>82% utilized</Text>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'operations',
      label: 'OPERATIONS',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text variant="body">Active operations and mission status.</Text>
          <Card noPadding>
            <div style={{ padding: '16px' }}>
              <Text variant="body-sm" color="secondary">Operation ALPHA - In Progress</Text>
              <Progress value={45} variant="info" style={{ marginTop: '8px' }} />
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-default)' }}>
              <Text variant="body-sm" color="secondary">Operation BRAVO - Standby</Text>
              <Progress value={15} variant="idle" style={{ marginTop: '8px' }} />
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text variant="body">System configuration and preferences.</Text>
          <Card title="DISPLAY OPTIONS">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Switch
                label="Dark Mode"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <Switch
                label="Enable Notifications"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <Switch
                label="Auto Update"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
              />
            </div>
          </Card>
        </div>
      ),
    },
  ];

  const columns: Column<AgentData>[] = [
    {
      key: 'id',
      header: 'AGENT ID',
      width: 120,
    },
    {
      key: 'name',
      header: 'IDENTIFIER',
      width: 200,
    },
    {
      key: 'status',
      header: 'STATUS',
      width: 140,
      render: (value) => (
        <StatusIndicator status={value} label={value.toUpperCase()} pulse />
      ),
    },
    {
      key: 'location',
      header: 'LOCATION',
      width: 120,
    },
    {
      key: 'missions',
      header: 'MISSIONS',
      width: 100,
      align: 'right',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      background: 'var(--bg-primary)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text variant="display" color="accent" uppercase>
            AGENT DATA OVERVIEW
          </Text>
          <Text variant="body-sm" color="secondary">
            Last Update 05/10/2025 20:00
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge variant="success" dot>ONLINE</Badge>
          <Badge variant="warning">3 ALERTS</Badge>
          <Spinner size="sm" />
        </div>
      </div>

      {/* Top Section Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Left Column - Monitoring Table */}
        <Section title="MONITORING TABLE" variant="warning" noPadding>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <Text variant="body-sm" color="secondary">PROJECT</Text>
                <Text variant="h3">BLRF-WEB</Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text variant="body-sm" color="secondary">PROJECT DESCRIPTION</Text>
                <Text variant="body-sm">A new website copy, design and development for Black Mesa Research Facility</Text>
              </div>
            </div>
          </div>

          <Section title="OPERATOR ACTION ITEMS" variant="default" noPadding>
            <MonitoringTable
              rows={monitoringRows.slice(0, 2)}
              onAction={(id) => console.log('Action clicked:', id)}
            />
          </Section>
        </Section>

        {/* Right Column - Metrics & Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Section title="MAIN METRICS" variant="success">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Text variant="body-sm" color="secondary">AGENTS</Text>
                <Text variant="h2">19</Text>
              </div>
              <div>
                <Text variant="body-sm" color="secondary">TOTAL TOKENS</Text>
                <Text variant="h2">51,312</Text>
              </div>
              <div>
                <Text variant="body-sm" color="secondary">TOTAL SPEND</Text>
                <Text variant="h2">$345</Text>
              </div>
            </div>
          </Section>

          <Section title="GLOBAL QUEUE" variant="warning">
            <div>
              <Text variant="body-sm" color="secondary">PRODUCT</Text>
              <div style={{ marginTop: '12px' }}>
                <Badge variant="success">UP NEXT</Badge>
                <Text variant="body" style={{ marginTop: '8px', display: 'block' }}>D-2</Text>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* Agent Table */}
      <Section title="AGENT" variant="default" noPadding>
        <DataTable
          columns={columns}
          data={sampleData}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => console.log('Clicked:', row)}
          dense
        />
      </Section>

      {/* Action Buttons */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <Button variant="primary">
          DEPLOY NEW MISSION
        </Button>
        <Button variant="secondary">
          VIEW REPORTS
        </Button>
        <Button variant="ghost">
          SETTINGS
        </Button>
        <Button variant="danger">
          EMERGENCY RECALL
        </Button>
      </div>

      {/* Command Center with Badges */}
      <Panel
        title="COMMAND CENTER"
        cornerBrackets
        style={{ marginTop: '24px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Text variant="body-sm" color="secondary">ACTIVE OPERATIONS:</Text>
            <Badge variant="success" filled>ALPHA</Badge>
            <Badge variant="info" filled>BRAVO</Badge>
            <Badge variant="warning" filled>CHARLIE</Badge>
            <Badge variant="primary">DELTA</Badge>
            <Badge removable onRemove={() => console.log('Removed')}>TEMP-01</Badge>
          </div>

          <Input
            placeholder="ENTER COMMAND OR SEARCH..."
            prefix=">"
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary">EXECUTE</Button>
            <Button size="sm">CLEAR</Button>
            <Button size="sm" loading>PROCESSING</Button>
          </div>
        </div>
      </Panel>

      {/* Status Grid */}
      <div style={{
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px'
      }}>
        <StatusIndicator status="success" label="ONLINE" pulse />
        <StatusIndicator status="error" label="OFFLINE" />
        <StatusIndicator status="warning" label="STANDBY" pulse />
        <StatusIndicator status="info" label="UPDATING" />
        <StatusIndicator status="idle" label="IDLE" />
      </div>

      {/* New Components Showcase */}
      <Panel
        title="SYSTEM CONTROL"
        subtitle="Tabs, Progress, Cards & Form Controls"
        cornerBrackets
        style={{ marginTop: '24px' }}
      >
        <Tabs tabs={tabs} defaultTab="overview" />
      </Panel>

      {/* Progress Examples */}
      <Panel
        title="LOADING STATES"
        cornerBrackets
        style={{ marginTop: '24px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Text variant="body-sm" color="secondary">Default Progress</Text>
            <Progress value={35} style={{ marginTop: '8px' }} />
          </div>
          <div>
            <Text variant="body-sm" color="secondary">Success State (Small)</Text>
            <Progress value={95} variant="success" size="sm" style={{ marginTop: '8px' }} />
          </div>
          <div>
            <Text variant="body-sm" color="secondary">Error State</Text>
            <Progress value={20} variant="error" style={{ marginTop: '8px' }} />
          </div>
          <div>
            <Text variant="body-sm" color="secondary">Indeterminate Loading</Text>
            <Progress indeterminate style={{ marginTop: '8px' }} />
          </div>
        </div>
      </Panel>

      {/* Cards Grid */}
      <div style={{
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        <Card
          title="AGENT STATS"
          subtitle="Last 24 hours"
          footer={<Button size="sm" fullWidth>VIEW DETAILS</Button>}
          bordered
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Metric label="DEPLOYED" value={45} trend="up" change={12} />
            <Metric label="RECALLED" value={3} trend="down" change={-50} />
          </div>
        </Card>

        <Card
          title="QUICK ACTIONS"
          bordered
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button variant="primary" fullWidth>DEPLOY MISSION</Button>
            <Button variant="secondary" fullWidth>RECALL AGENTS</Button>
            <Button variant="ghost" fullWidth>VIEW ANALYTICS</Button>
          </div>
        </Card>

        <Card
          title="SYSTEM STATUS"
          bordered
          onClick={() => console.log('Card clicked')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StatusIndicator status="success" label="DATABASE" pulse />
            <StatusIndicator status="success" label="API SERVER" pulse />
            <StatusIndicator status="warning" label="BACKUP" />
          </div>
        </Card>
      </div>

      {/* Form Controls */}
      <Panel
        title="PREFERENCES"
        cornerBrackets
        style={{ marginTop: '24px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Text variant="label" style={{ marginBottom: '8px' }}>NOTIFICATION SETTINGS</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox label="Email notifications" defaultChecked />
              <Checkbox label="Push notifications" defaultChecked />
              <Checkbox label="SMS alerts" />
              <Checkbox label="Desktop notifications" defaultChecked />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '16px' }}>
            <Text variant="label" style={{ marginBottom: '8px' }}>ADVANCED OPTIONS</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Switch label="Enable debug mode" />
              <Switch label="Auto-save progress" defaultChecked />
              <Switch label="High contrast mode" />
            </div>
          </div>
        </div>
      </Panel>

      {/* Analytics Dashboard Section */}
      <div style={{
        marginTop: '32px',
        borderTop: '2px solid var(--accent-primary)',
        paddingTop: '32px'
      }}>
        <Text variant="display" color="accent" uppercase style={{ marginBottom: '24px' }}>
          ANALYTICS DASHBOARD
        </Text>

        {/* Gauge Charts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <Card title="CPU UTILIZATION" bordered>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <Gauge value={78} label="CPU" status="success" />
            </div>
          </Card>

          <Card title="MEMORY USAGE" bordered>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <Gauge value={92} label="RAM" status="warning" />
            </div>
          </Card>

          <Card title="DISK SPACE" bordered>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <Gauge value={45} label="DISK" status="info" />
            </div>
          </Card>
        </div>

        {/* Donut Chart and Bar Chart */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <Panel
            title="TASK DISTRIBUTION"
            subtitle="Project completion status"
            cornerBrackets
          >
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
              <DonutChart
                data={donutData}
                size={240}
                centerValue="100"
                centerLabel="TASKS"
                showLegend={false}
              />
            </div>
          </Panel>

          <Panel
            title="MONTHLY METRICS"
            subtitle="Performance over time"
            cornerBrackets
          >
            <div style={{ padding: '16px 0' }}>
              <BarChart data={barData} height={280} />
            </div>
          </Panel>
        </div>

        {/* SparkLines and Progress Circles */}
        <Panel
          title="REAL-TIME INDICATORS"
          subtitle="Micro visualizations"
          cornerBrackets
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Card bordered>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text variant="label" color="secondary">NETWORK TRAFFIC</Text>
                <SparkLine data={sparkData} width={180} height={40} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text variant="body-sm" color="secondary">Throughput</Text>
                  <Text variant="body-sm" color="success">▲ 12.5%</Text>
                </div>
              </div>
            </Card>

            <Card bordered>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Text variant="label" color="secondary">API RESPONSE TIME</Text>
                <SparkLine data={sparkData.map(v => v * 0.8)} width={180} height={40} color="var(--status-warning)" />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text variant="body-sm" color="secondary">Latency</Text>
                  <Text variant="body-sm" color="error">▼ 3.2%</Text>
                </div>
              </div>
            </Card>

            <Card bordered>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ProgressCircle value={87} size={60} status="success" label="UP" />
                <div style={{ flex: 1 }}>
                  <Text variant="label" color="secondary">SYSTEM UPTIME</Text>
                  <Text variant="body" color="success">99.87%</Text>
                </div>
              </div>
            </Card>

            <Card bordered>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ProgressCircle value={64} size={60} status="info" label="LOAD" />
                <div style={{ flex: 1 }}>
                  <Text variant="label" color="secondary">SERVER LOAD</Text>
                  <Text variant="body" color="info">64% AVG</Text>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        {/* Monitoring Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginTop: '24px'
        }}>
          <Section title="OPERATOR ACTION ITEMS" variant="warning">
            <MonitoringTable
              rows={monitoringRows}
              onAction={(id) => console.log('Action clicked:', id)}
            />
          </Section>

          <Section title="GLOBAL QUEUE" variant="warning">
            <div style={{ padding: '16px' }}>
              <Text variant="body-sm" color="secondary">PRODUCT</Text>
              <div style={{ marginTop: '12px' }}>
                <Badge variant="success">UP NEXT</Badge>
                <Text variant="body-sm" style={{ marginTop: '8px' }}>D-2</Text>
              </div>
            </div>
          </Section>
        </div>

        {/* Master Control Panel */}
        <Section title="MASTER CONTROL PANEL" variant="warning" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Text variant="body-sm">RUNNING: 25:55</Text>
              <Progress value={65} variant="success" style={{ flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="primary" icon={<span>▶</span>}>RUN</Button>
              <Button variant="secondary">PAUSE ALL</Button>
              <Button variant="danger">STOP NEW</Button>
              <Button variant="ghost">THROTTLE</Button>
              <Badge>1X</Badge>
              <Badge>2X</Badge>
              <Badge>3X</Badge>
            </div>
          </div>
        </Section>

        {/* Backend Integration Components Demo */}
        <div style={{ marginTop: '32px', borderTop: '2px solid var(--accent-primary)', paddingTop: '32px' }}>
          <Text variant="display" color="accent" uppercase style={{ marginBottom: '16px' }}>
            BACKEND INTEGRATION COMPONENTS
          </Text>

          <Breadcrumbs items={breadcrumbItems} style={{ marginBottom: '24px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            <Panel title="SELECT & MODAL" cornerBrackets>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Text variant="label" color="secondary" style={{ marginBottom: '8px' }}>Agent Selection</Text>
                  <Select options={selectOptions} placeholder="Select an agent" />
                </div>

                <Tooltip content="Click to open configuration modal" position="top">
                  <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                    OPEN MODAL
                  </Button>
                </Tooltip>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="success" onClick={() => notify('Operation successful!', 'success')}>
                    SUCCESS TOAST
                  </Button>
                  <Button variant="danger" onClick={() => notify('Error occurred!', 'error', 5000)}>
                    ERROR TOAST
                  </Button>
                </div>
              </div>
            </Panel>

            <Panel title="ACCORDION" cornerBrackets>
              <Accordion items={accordionItems} defaultOpenIds={['section1']} />
            </Panel>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="SYSTEM CONFIGURATION"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              CANCEL
            </Button>
            <Button variant="primary" onClick={() => {
              notify('Configuration saved!', 'success');
              setIsModalOpen(false);
            }}>
              SAVE CHANGES
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Text variant="label" color="secondary" style={{ marginBottom: '8px' }}>System Name</Text>
            <Input placeholder="Enter system name" />
          </div>
          <div>
            <Text variant="label" color="secondary" style={{ marginBottom: '8px' }}>Agent Type</Text>
            <Select options={selectOptions} placeholder="Select agent type" />
          </div>
          <div>
            <Text variant="label" color="secondary" style={{ marginBottom: '8px' }}>Options</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Checkbox label="Enable monitoring" defaultChecked />
              <Checkbox label="Auto-restart on failure" defaultChecked />
              <Checkbox label="Send notifications" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast Container */}
      <Toast messages={messages} onRemove={remove} position="top-right" />
    </div>
  );
}

export default App;
