
export type AppLanguage = 'en' | 'vi';

export enum StandardStatus {
  ACTIVE = 'Active',
  SUPERSEDED = 'Superseded',
  WITHDRAWN = 'Withdrawn',
  PROPOSED = 'Proposed'
}

export interface DetailedSection {
  en: string;
  vi: string;
}

export interface DetailedMethod {
  overview: DetailedSection;
  samplePrep: DetailedSection;
  instrumentation: DetailedSection;
  performance: DetailedSection;
  pitfalls: DetailedSection;
  labNotes: DetailedSection;
  compliance: DetailedSection;
  selection: DetailedSection;
}

export interface MethodCard {
  title: string;
  analytes: string;
  chemicalGroup?: string;
  matrix: string;
  technique: string;
  referenceStandards: string;
  sections: {
    overview: string;      // 1. Method Overview
    samplePrep: string;    // 2. Sample Preparation (Summary)
    instrumentation: string; // 3. Instrumentation
    performance: string;   // 4. Typical Performance Characteristics
    pitfalls: string;      // 5. Common Pitfalls & Troubleshooting
    labNotes: string;      // 6. Laboratory Notes
    selection: string;     // 7. Applicability & Method Selection
    compliance: string;    // 8. Quality & Compliance Check
    disclaimer: string;    // 9. Disclaimer
  };
}

export interface QCReport {
  issues: { description: string; section: string; risk: 'Low' | 'Medium' | 'High' }[];
  suggestions: string;
  isReady: boolean;
  confidence: 'Low' | 'Medium' | 'High';
}

export interface AnalyticalStandard {
  id: string;
  code: string;
  title: string;
  organization: 'ISO' | 'EPA' | 'AOAC' | 'ASTM' | 'EU' | 'USP' | 'TCVN';
  status: StandardStatus;
  lastUpdate: string;
  matrix: string;
  parameters: {
    analyte: string;
    mdl: string;
    lod: string;
    mrl?: string;
    instrument: string;
    technique: string;
  };
  summary: string;
  twoMinuteRead: string;
  sourceUrl?: string;
  details?: DetailedMethod;
}

export interface ComparisonResult {
  standards: AnalyticalStandard[];
  comparisonTable: {
    attribute: string;
    values: Record<string, string>;
  }[];
  expertInsight: string;
}
