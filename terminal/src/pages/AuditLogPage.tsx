import React, { useState, useEffect } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import './AuditLogPage.css';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName?: string;
  action: 'ingest' | 'export' | 'view' | 'edit' | 'delete' | 'share';
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  details?: string;
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          userId: 'user123',
          userName: 'John Doe',
          action: 'ingest',
          entityType: 'news',
          metadata: { source: 'fierce', records: 25 },
          ipAddress: '192.168.1.100',
          status: 'success',
          details: 'Successfully ingested 25 news articles from FierceBiotech'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          userId: 'user456',
          userName: 'Jane Smith',
          action: 'export',
          entityType: 'catalyst',
          metadata: { format: 'csv', records: 50 },
          ipAddress: '192.168.1.101',
          status: 'success',
          details: 'Exported 50 catalysts to CSV'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          userId: 'user789',
          userName: 'Bob Johnson',
          action: 'ingest',
          entityType: 'trials',
          metadata: { source: 'clinicaltrials.gov', records: 0 },
          ipAddress: '192.168.1.102',
          status: 'failure',
          details: 'Failed to connect to ClinicalTrials.gov API'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          userId: 'user123',
          userName: 'John Doe',
          action: 'view',
          entityType: 'company',
          entityId: 'pfizer',
          ipAddress: '192.168.1.100',
          status: 'success',
          details: 'Viewed company profile: Pfizer'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          userId: 'user456',
          userName: 'Jane Smith',
          action: 'share',
          entityType: 'layout',
          metadata: { layout_name: 'Oncology PM', share_token: 'abc123' },
          ipAddress: '192.168.1.101',
          status: 'success',
          details: 'Shared workspace layout: Oncology PM'
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          userId: 'admin001',
          userName: 'Admin User',
          action: 'edit',
          entityType: 'permissions',
          entityId: 'user789',
          ipAddress: '192.168.1.1',
          status: 'warning',
          details: 'Modified permissions for user: Bob Johnson'
        },
      ];
      setLogs(mockLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesSearch = !searchQuery || 
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#00ff00';
      case 'failure': return '#ff6666';
      case 'warning': return '#ffaa00';
      default: return '#888888';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'ingest': return '📥';
      case 'export': return '📤';
      case 'view': return '👁️';
      case 'edit': return '✏️';
      case 'delete': return '🗑️';
      case 'share': return '🔗';
      default: return '📝';
    }
  };

  const getTimeSince = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Status', 'Details'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.userName || log.userId,
        log.action,
        log.entityType || '',
        log.status,
        log.details || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audit-log-page">
      <Panel
        title="AUDIT LOG"
        cornerBrackets
        variant="glass"
        headerAction={
          <button onClick={exportLogs} className="export-btn" title="Export to CSV">
            📥 EXPORT CSV
          </button>
        }
      >
        <div className="audit-controls">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="audit-search"
          />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="audit-filter"
          >
            <option value="all">ALL ACTIONS</option>
            <option value="ingest">INGEST</option>
            <option value="export">EXPORT</option>
            <option value="view">VIEW</option>
            <option value="edit">EDIT</option>
            <option value="delete">DELETE</option>
            <option value="share">SHARE</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="audit-filter"
          >
            <option value="all">ALL STATUS</option>
            <option value="success">SUCCESS</option>
            <option value="failure">FAILURE</option>
            <option value="warning">WARNING</option>
          </select>
        </div>

        {loading && <div className="loading-state">Loading audit logs...</div>}
        {error && <div className="error-state">{error}</div>}

        {!loading && !error && filteredLogs.length === 0 && (
          <div className="empty-state">No audit logs match your criteria</div>
        )}

        {!loading && !error && filteredLogs.length > 0 && (
          <div className="audit-timeline">
            {filteredLogs.map((log) => (
              <div key={log.id} className="audit-entry">
                <div className="entry-indicator">
                  <div
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor(log.status) }}
                  />
                  <div className="timeline-line" />
                </div>
                <div className="entry-content">
                  <div className="entry-header">
                    <div className="entry-meta">
                      <span className="action-icon">{getActionIcon(log.action)}</span>
                      <span className="action-text">{log.action.toUpperCase()}</span>
                      <span className="entry-time">{getTimeSince(log.timestamp)}</span>
                    </div>
                    <span className={`status-badge status-${log.status}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="entry-details">
                    <div className="detail-row">
                      <span className="detail-label">USER:</span>
                      <span className="detail-value">{log.userName || log.userId}</span>
                    </div>
                    {log.entityType && (
                      <div className="detail-row">
                        <span className="detail-label">ENTITY:</span>
                        <span className="detail-value">
                          {log.entityType}
                          {log.entityId && ` (${log.entityId})`}
                        </span>
                      </div>
                    )}
                    {log.details && (
                      <div className="detail-row">
                        <span className="detail-label">DETAILS:</span>
                        <span className="detail-value">{log.details}</span>
                      </div>
                    )}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">METADATA:</span>
                        <span className="detail-value metadata-json">
                          {JSON.stringify(log.metadata)}
                        </span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">IP:</span>
                      <span className="detail-value">{log.ipAddress}</span>
                      <span className="detail-label">TIME:</span>
                      <span className="detail-value">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
