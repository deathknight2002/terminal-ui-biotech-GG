/**
 * Catalyst Timeline Engine
 * 
 * Aggregates and analyzes pharmaceutical catalysts from multiple sources
 * Provides timeline visualization and impact analysis
 */

import { CatalystContract } from '../contracts';
import { CTGovV2Connector } from './ctgov-v2';
import { DrugsAtFDAConnector } from './drugsfda';
import { FAERSConnector } from './faers';

export interface CatalystSource {
  id: string;
  name: string;
  type: 'clinical_trial' | 'fda_approval' | 'adverse_event' | 'manual';
  weight: number; // 0-1, for impact calculation
}

export interface CatalystTimeline {
  startDate: string;
  endDate: string;
  catalysts: CatalystContract[];
  summary: {
    total: number;
    byType: Record<string, number>;
    byImpact: Record<string, number>;
    topDrugs: Array<{ drugId: string; count: number }>;
    topCompanies: Array<{ companyId: string; count: number }>;
  };
}

export interface CatalystFilter {
  drugId?: string;
  companyId?: string;
  type?: CatalystContract['data']['type'];
  impact?: CatalystContract['data']['impact'];
  startDate?: string;
  endDate?: string;
}

/**
 * Catalyst Timeline Engine
 */
export class CatalystEngine {
  private catalysts: Map<string, CatalystContract> = new Map();
  private ctgovConnector?: CTGovV2Connector;
  private drugsAtFDAConnector?: DrugsAtFDAConnector;
  private faersConnector?: FAERSConnector;

  constructor(config?: {
    ctgovConnector?: CTGovV2Connector;
    drugsAtFDAConnector?: DrugsAtFDAConnector;
    faersConnector?: FAERSConnector;
  }) {
    this.ctgovConnector = config?.ctgovConnector;
    this.drugsAtFDAConnector = config?.drugsAtFDAConnector;
    this.faersConnector = config?.faersConnector;
  }

  /**
   * Add catalyst to engine
   */
  addCatalyst(catalyst: CatalystContract): void {
    this.catalysts.set(catalyst.data.id, catalyst);
  }

  /**
   * Add multiple catalysts
   */
  addCatalysts(catalysts: CatalystContract[]): void {
    for (const catalyst of catalysts) {
      this.addCatalyst(catalyst);
    }
  }

  /**
   * Get catalyst by ID
   */
  getCatalyst(id: string): CatalystContract | undefined {
    return this.catalysts.get(id);
  }

  /**
   * Remove catalyst
   */
  removeCatalyst(id: string): boolean {
    return this.catalysts.delete(id);
  }

  /**
   * Get all catalysts with optional filtering
   */
  getCatalysts(filter?: CatalystFilter): CatalystContract[] {
    let catalysts = Array.from(this.catalysts.values());

    if (filter) {
      catalysts = catalysts.filter(catalyst => {
        if (filter.drugId && catalyst.data.drugId !== filter.drugId) {
          return false;
        }
        if (filter.companyId && catalyst.data.companyId !== filter.companyId) {
          return false;
        }
        if (filter.type && catalyst.data.type !== filter.type) {
          return false;
        }
        if (filter.impact && catalyst.data.impact !== filter.impact) {
          return false;
        }
        if (filter.startDate && catalyst.data.eventDate < filter.startDate) {
          return false;
        }
        if (filter.endDate && catalyst.data.eventDate > filter.endDate) {
          return false;
        }
        return true;
      });
    }

    // Sort by event date (most recent first)
    return catalysts.sort((a, b) => 
      b.data.eventDate.localeCompare(a.data.eventDate)
    );
  }

  /**
   * Get timeline of catalysts
   */
  getTimeline(startDate: string, endDate: string, filter?: CatalystFilter): CatalystTimeline {
    const catalysts = this.getCatalysts({
      ...filter,
      startDate,
      endDate,
    });

    // Calculate summary statistics
    const byType: Record<string, number> = {};
    const byImpact: Record<string, number> = {};
    const drugCounts = new Map<string, number>();
    const companyCounts = new Map<string, number>();

    for (const catalyst of catalysts) {
      // Count by type
      byType[catalyst.data.type] = (byType[catalyst.data.type] || 0) + 1;

      // Count by impact
      if (catalyst.data.impact) {
        byImpact[catalyst.data.impact] = (byImpact[catalyst.data.impact] || 0) + 1;
      }

      // Count by drug
      if (catalyst.data.drugId) {
        drugCounts.set(
          catalyst.data.drugId,
          (drugCounts.get(catalyst.data.drugId) || 0) + 1
        );
      }

      // Count by company
      if (catalyst.data.companyId) {
        companyCounts.set(
          catalyst.data.companyId,
          (companyCounts.get(catalyst.data.companyId) || 0) + 1
        );
      }
    }

    // Get top drugs and companies
    const topDrugs = Array.from(drugCounts.entries())
      .map(([drugId, count]) => ({ drugId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCompanies = Array.from(companyCounts.entries())
      .map(([companyId, count]) => ({ companyId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      startDate,
      endDate,
      catalysts,
      summary: {
        total: catalysts.length,
        byType,
        byImpact,
        topDrugs,
        topCompanies,
      },
    };
  }

  /**
   * Sync catalysts from clinical trials
   */
  async syncFromClinicalTrials(condition: string): Promise<number> {
    if (!this.ctgovConnector) {
      throw new Error('CTGovV2Connector not configured');
    }

    const trials = await this.ctgovConnector.searchByCondition(condition, 100);
    let count = 0;

    for (const trial of trials) {
      // Create catalyst for trial status changes
      if (trial.data.status === 'Completed' || trial.data.status === 'Active, not recruiting') {
        const catalyst: CatalystContract = {
          version: '1.0',
          schema: 'catalyst',
          data: {
            id: `ct-${trial.data.nctId}`,
            type: 'trial_result',
            title: `${trial.data.title} - ${trial.data.status}`,
            description: trial.data.primaryEndpoint,
            eventDate: trial.data.completionDate || trial.data.lastChanged,
            impact: this.inferImpactFromPhase(trial.data.phase),
            confidence: 0.7,
          },
          metadata: {
            source: 'ClinicalTrials.gov',
            timestamp: Date.now(),
            detectedAt: Date.now(),
          },
        };

        this.addCatalyst(catalyst);
        count++;
      }
    }

    return count;
  }

  /**
   * Sync catalysts from FDA approvals
   */
  async syncFromFDAApprovals(drugName: string): Promise<number> {
    if (!this.drugsAtFDAConnector) {
      throw new Error('DrugsAtFDAConnector not configured');
    }

    const approvals = await this.drugsAtFDAConnector.getByBrandName(drugName);
    let count = 0;

    for (const approval of approvals) {
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: `fda-${approval.data.applicationNumber}`,
          type: 'approval',
          title: `FDA Approval: ${approval.data.brandName}`,
          description: `${approval.data.approvalType} - ${approval.data.genericName}`,
          eventDate: approval.data.approvalDate,
          impact: 'positive',
          confidence: 1.0,
        },
        metadata: {
          source: 'Drugs@FDA',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      this.addCatalyst(catalyst);
      count++;
    }

    return count;
  }

  /**
   * Sync adverse events as negative catalysts
   */
  async syncFromAdverseEvents(drugName: string): Promise<number> {
    if (!this.faersConnector) {
      throw new Error('FAERSConnector not configured');
    }

    const events = await this.faersConnector.getByDrug(drugName, 50);
    let count = 0;

    // Group by serious events only
    const seriousEvents = events.filter(e => 
      e.data.seriousnessCode && e.data.seriousnessCode !== 'Not Serious'
    );

    for (const event of seriousEvents) {
      const catalyst: CatalystContract = {
        version: '1.0',
        schema: 'catalyst',
        data: {
          id: `faers-${event.data.safetyReportId}`,
          type: 'fda_action',
          title: `Adverse Event: ${event.data.reactionMeddrapt}`,
          description: `${event.data.seriousnessCode} - ${event.data.drugName}`,
          eventDate: this.parseFAERSDate(event.data.reportDate),
          impact: 'negative',
          confidence: 0.5,
        },
        metadata: {
          source: 'FAERS',
          timestamp: Date.now(),
          detectedAt: Date.now(),
        },
      };

      this.addCatalyst(catalyst);
      count++;
    }

    return count;
  }

  /**
   * Get upcoming catalysts (future events)
   */
  getUpcoming(days = 90): CatalystContract[] {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const endDate = futureDate.toISOString().split('T')[0];

    return this.getCatalysts({
      startDate: today,
      endDate,
    });
  }

  /**
   * Get recent catalysts (past events)
   */
  getRecent(days = 30): CatalystContract[] {
    const today = new Date().toISOString().split('T')[0];
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    const startDate = pastDate.toISOString().split('T')[0];

    return this.getCatalysts({
      startDate,
      endDate: today,
    });
  }

  /**
   * Clear all catalysts
   */
  clear(): void {
    this.catalysts.clear();
  }

  /**
   * Get total count
   */
  count(): number {
    return this.catalysts.size;
  }

  /**
   * Infer impact from trial phase
   */
  private inferImpactFromPhase(phase?: string): CatalystContract['data']['impact'] {
    if (!phase) return undefined;
    
    if (phase.includes('III')) return 'positive';
    if (phase.includes('II')) return 'neutral';
    return undefined;
  }

  /**
   * Parse FAERS date format (YYYYMMDD) to ISO
   */
  private parseFAERSDate(dateStr: string): string {
    if (dateStr.length === 8) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  }
}
