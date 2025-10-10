/**
 * EMA (European Medicines Agency) Connector
 * 
 * Retrieves medicine data and CHMP meeting schedules to triangulate EU catalysts
 * Uses EMA public data and meeting calendars
 */

import { z } from 'zod';

/**
 * EMA medicine data schema
 */
const EMAMedicineSchema = z.object({
  medicineName: z.string(),
  activeSubstance: z.string(),
  therapeuticArea: z.string(),
  marketingAuthHolder: z.string(),
  authorizationStatus: z.enum(['authorized', 'pending', 'refused', 'withdrawn', 'suspended']),
  authorizationDate: z.string().optional(),
  procedureType: z.string().optional(), // Centralized, MRP, etc.
  orphanDesignation: z.boolean().optional(),
  conditionalApproval: z.boolean().optional(),
  epar: z.string().optional(), // European Public Assessment Report URL
});

export type EMAMedicine = z.infer<typeof EMAMedicineSchema>;

/**
 * CHMP meeting data
 */
const CHMPMeetingSchema = z.object({
  meetingDate: z.string(), // ISO 8601 date
  agendaItems: z.array(z.object({
    medicine: z.string().optional(),
    sponsor: z.string().optional(),
    procedure: z.string(), // Initial application, extension, etc.
    expectedOpinion: z.enum(['positive', 'negative', 'pending', 'unknown']).optional(),
  })),
  meetingMinutesUrl: z.string().optional(),
  pressReleaseUrl: z.string().optional(),
});

export type CHMPMeeting = z.infer<typeof CHMPMeetingSchema>;

/**
 * EMA medicine contract with provenance
 */
export interface EMAMedicineContract {
  version: '1.0';
  schema: 'ema-medicine';
  data: EMAMedicine;
  metadata: {
    source: 'European Medicines Agency';
    url: string;
    pulledAt: string; // ISO 8601 timestamp
    domain: 'ema.europa.eu';
  };
}

/**
 * CHMP meeting contract
 */
export interface CHMPMeetingContract {
  version: '1.0';
  schema: 'chmp-meeting';
  data: CHMPMeeting;
  metadata: {
    source: 'EMA CHMP Calendar';
    url: string;
    pulledAt: string;
    domain: 'ema.europa.eu';
  };
}

/**
 * EMA connector for medicine data and CHMP meetings
 */
export class EMAConnector {
  private baseUrl = 'https://www.ema.europa.eu';
  private medicineDataUrl = 'https://www.ema.europa.eu/en/medicines/download-medicine-data';
  private chmpCalendarUrl = 'https://www.ema.europa.eu/en/committees/chmp/chmp-agendas-minutes-highlights';
  
  /**
   * Get medicine data for a specific product
   */
  async getMedicineByName(medicineName: string): Promise<EMAMedicineContract | null> {
    const pulledAt = new Date().toISOString();
    
    // In production, download and parse EMA medicine data files
    // Available at: https://www.ema.europa.eu/en/medicines/download-medicine-data
    // Excel files with all authorized medicines
    
    // Mock data for demonstration
    return {
      version: '1.0',
      schema: 'ema-medicine',
      data: {
        medicineName: 'Example Medicine',
        activeSubstance: 'Active Substance A',
        therapeuticArea: 'Immunology',
        marketingAuthHolder: 'Company X',
        authorizationStatus: 'authorized',
        authorizationDate: '2025-06-15',
        procedureType: 'Centralized',
        orphanDesignation: false,
        conditionalApproval: false,
        epar: `${this.baseUrl}/en/medicines/human/EPAR/example-medicine`,
      },
      metadata: {
        source: 'European Medicines Agency',
        url: this.medicineDataUrl,
        pulledAt,
        domain: 'ema.europa.eu',
      },
    };
  }
  
  /**
   * Get upcoming CHMP meetings
   */
  async getUpcomingCHMPMeetings(count = 12): Promise<CHMPMeetingContract[]> {
    const pulledAt = new Date().toISOString();
    
    // In production, scrape CHMP calendar
    // Meetings held monthly, typically 3rd week
    // Agendas published ~2 weeks before meeting
    
    // Mock data showing typical CHMP meeting schedule
    const meetings: CHMPMeetingContract[] = [];
    
    // Generate next 12 months of CHMP meetings (typically monthly)
    for (let i = 0; i < count; i++) {
      const meetingDate = new Date();
      meetingDate.setMonth(meetingDate.getMonth() + i);
      meetingDate.setDate(15); // Typically mid-month
      
      meetings.push({
        version: '1.0',
        schema: 'chmp-meeting',
        data: {
          meetingDate: meetingDate.toISOString().split('T')[0],
          agendaItems: [
            {
              medicine: i === 2 ? 'Drug B' : undefined, // Example: opinion expected in 2 months
              sponsor: i === 2 ? 'Company Y' : undefined,
              procedure: 'Initial marketing authorization application',
              expectedOpinion: i === 2 ? 'pending' : 'unknown',
            },
          ],
          meetingMinutesUrl: i < 2 ? `${this.chmpCalendarUrl}#minutes-${i}` : undefined,
          pressReleaseUrl: i < 2 ? `${this.baseUrl}/en/news/press-release-${i}` : undefined,
        },
        metadata: {
          source: 'EMA CHMP Calendar',
          url: this.chmpCalendarUrl,
          pulledAt,
          domain: 'ema.europa.eu',
        },
      });
    }
    
    return meetings;
  }
  
  /**
   * Search medicines by therapeutic area
   */
  async searchMedicinesByTherapeuticArea(therapeuticArea: string): Promise<EMAMedicineContract[]> {
    const pulledAt = new Date().toISOString();
    
    // In production, parse downloaded medicine data files and filter
    // Mock data for demonstration
    return [
      {
        version: '1.0',
        schema: 'ema-medicine',
        data: {
          medicineName: 'IBD Medicine A',
          activeSubstance: 'IL-23 Inhibitor',
          therapeuticArea: therapeuticArea,
          marketingAuthHolder: 'Company X',
          authorizationStatus: 'authorized',
          authorizationDate: '2025-03-20',
          procedureType: 'Centralized',
          orphanDesignation: false,
          conditionalApproval: false,
        },
        metadata: {
          source: 'European Medicines Agency',
          url: this.medicineDataUrl,
          pulledAt,
          domain: 'ema.europa.eu',
        },
      },
    ];
  }
  
  /**
   * Check if CHMP opinion is expected for a specific medicine
   */
  async checkCHMPOpinion(medicineName: string): Promise<CHMPMeetingContract | null> {
    const meetings = await this.getUpcomingCHMPMeetings();
    
    for (const meeting of meetings) {
      const hasItem = meeting.data.agendaItems.some(item => 
        item.medicine?.toLowerCase().includes(medicineName.toLowerCase())
      );
      
      if (hasItem) {
        return meeting;
      }
    }
    
    return null;
  }
}
