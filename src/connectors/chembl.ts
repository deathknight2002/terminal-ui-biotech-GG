/**
 * ChEMBL Connector
 * 
 * Queries ChEMBL database for drug potency, selectivity, and assay data
 * Provides translational evidence for mechanism validation
 */

import { z } from 'zod';

/**
 * ChEMBL activity/assay data schema
 */
const ChEMBLActivitySchema = z.object({
  moleculeChemblId: z.string(),
  moleculeName: z.string().optional(),
  targetChemblId: z.string(),
  targetName: z.string(),
  activityType: z.string(), // IC50, Ki, EC50, etc.
  activityValue: z.number(),
  activityUnits: z.string(), // nM, uM, etc.
  assayType: z.string(), // Binding, Functional, ADME, etc.
  assayDescription: z.string().optional(),
  publicationDoi: z.string().optional(),
  publicationYear: z.number().optional(),
});

export type ChEMBLActivity = z.infer<typeof ChEMBLActivitySchema>;

/**
 * ChEMBL activity contract with provenance
 */
export interface ChEMBLActivityContract {
  version: '1.0';
  schema: 'chembl-activity';
  data: ChEMBLActivity;
  metadata: {
    source: 'ChEMBL';
    url: string;
    pulledAt: string; // ISO 8601 timestamp
    domain: 'ebi.ac.uk';
    chemblVersion: string;
  };
}

/**
 * Target selectivity analysis
 */
export interface TargetSelectivity {
  primaryTarget: string;
  primaryIC50: number;
  offTargets: Array<{
    target: string;
    ic50: number;
    selectivityFold: number; // Primary IC50 / Off-target IC50
  }>;
  overallSelectivity: number; // Minimum fold selectivity
}

/**
 * ChEMBL connector for potency and assay data
 */
export class ChEMBLConnector {
  private baseUrl = 'https://www.ebi.ac.uk/chembl/api/data';
  private webUrl = 'https://www.ebi.ac.uk/chembl';
  private chemblVersion = 'chembl_33'; // Update as needed
  
  /**
   * Get activities for a molecule by ChEMBL ID
   */
  async getActivitiesByMolecule(
    moleculeChemblId: string
  ): Promise<ChEMBLActivityContract[]> {
    const pulledAt = new Date().toISOString();
    
    // In production, query ChEMBL REST API:
    // GET /api/data/activity?molecule_chembl_id={moleculeChemblId}&format=json
    
    // Mock data for demonstration
    return [
      {
        version: '1.0',
        schema: 'chembl-activity',
        data: {
          moleculeChemblId: 'CHEMBL1234',
          moleculeName: 'Factor XI Inhibitor A',
          targetChemblId: 'CHEMBL2047',
          targetName: 'Coagulation factor XI',
          activityType: 'IC50',
          activityValue: 4.2,
          activityUnits: 'nM',
          assayType: 'Binding',
          assayDescription: 'Inhibition of Factor XI enzymatic activity',
          publicationDoi: '10.1021/jm12345678',
          publicationYear: 2024,
        },
        metadata: {
          source: 'ChEMBL',
          url: `${this.webUrl}/compound_report_card/${moleculeChemblId}`,
          pulledAt,
          domain: 'ebi.ac.uk',
          chemblVersion: this.chemblVersion,
        },
      },
      {
        version: '1.0',
        schema: 'chembl-activity',
        data: {
          moleculeChemblId: 'CHEMBL1234',
          moleculeName: 'Factor XI Inhibitor A',
          targetChemblId: 'CHEMBL2048',
          targetName: 'Coagulation factor XII',
          activityType: 'IC50',
          activityValue: 4800,
          activityUnits: 'nM',
          assayType: 'Binding',
          assayDescription: 'Selectivity assay vs Factor XII',
          publicationDoi: '10.1021/jm12345678',
          publicationYear: 2024,
        },
        metadata: {
          source: 'ChEMBL',
          url: `${this.webUrl}/compound_report_card/${moleculeChemblId}`,
          pulledAt,
          domain: 'ebi.ac.uk',
          chemblVersion: this.chemblVersion,
        },
      },
    ];
  }
  
  /**
   * Get activities for a target by ChEMBL ID
   */
  async getActivitiesByTarget(
    targetChemblId: string,
    maxActivities = 100
  ): Promise<ChEMBLActivityContract[]> {
    const pulledAt = new Date().toISOString();
    
    // In production, query ChEMBL REST API:
    // GET /api/data/activity?target_chembl_id={targetChemblId}&limit={maxActivities}
    
    return [];
  }
  
  /**
   * Calculate target selectivity for a molecule
   */
  async calculateSelectivity(
    moleculeChemblId: string,
    primaryTarget: string
  ): Promise<TargetSelectivity> {
    const activities = await this.getActivitiesByMolecule(moleculeChemblId);
    
    // Find primary target IC50
    const primaryActivity = activities.find(
      a => a.data.targetName === primaryTarget && a.data.activityType === 'IC50'
    );
    
    if (!primaryActivity) {
      throw new Error(`No IC50 data found for primary target: ${primaryTarget}`);
    }
    
    const primaryIC50 = primaryActivity.data.activityValue;
    
    // Calculate selectivity vs off-targets
    const offTargets = activities
      .filter(a => 
        a.data.targetName !== primaryTarget && 
        a.data.activityType === 'IC50'
      )
      .map(a => ({
        target: a.data.targetName,
        ic50: a.data.activityValue,
        selectivityFold: a.data.activityValue / primaryIC50,
      }))
      .sort((a, b) => a.selectivityFold - b.selectivityFold);
    
    const overallSelectivity = offTargets.length > 0 
      ? offTargets[0].selectivityFold 
      : Infinity;
    
    return {
      primaryTarget,
      primaryIC50,
      offTargets,
      overallSelectivity,
    };
  }
  
  /**
   * Search molecules by name
   */
  async searchMolecules(query: string): Promise<Array<{
    chemblId: string;
    name: string;
    maxPhase: number;
  }>> {
    // In production, use ChEMBL search API
    // GET /api/data/molecule/search?q={query}
    
    return [
      {
        chemblId: 'CHEMBL1234',
        name: 'Factor XI Inhibitor A',
        maxPhase: 2,
      },
    ];
  }
  
  /**
   * Get mechanism of action for a molecule
   */
  async getMechanismOfAction(moleculeChemblId: string): Promise<Array<{
    targetName: string;
    mechanismOfAction: string;
    actionType: string;
    maxPhase: number;
  }>> {
    // In production, query ChEMBL mechanism API
    // GET /api/data/mechanism?molecule_chembl_id={moleculeChemblId}
    
    return [
      {
        targetName: 'Coagulation factor XI',
        mechanismOfAction: 'Factor XI inhibitor',
        actionType: 'INHIBITOR',
        maxPhase: 2,
      },
    ];
  }
  
  /**
   * Format IC50 value with appropriate units
   */
  formatIC50(value: number, units: string): string {
    if (units === 'nM') {
      if (value < 1) {
        return `${(value * 1000).toFixed(0)} pM`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)} µM`;
      } else {
        return `${value.toFixed(1)} nM`;
      }
    }
    return `${value} ${units}`;
  }
}
