import { describe, it, expect } from 'vitest';
import { SmartPrescriptionNERAdapter } from '@/lib/ocr/adapter';

describe('Enhanced Indian Prescription AI & NER Extractor', () => {
  const adapter = new SmartPrescriptionNERAdapter();

  it('extracts candidate medicines with strengths, frequencies and safety cautions', async () => {
    const rawPrescription = `
      Dr. R. K. Gupta MBBS MD
      City Hospital, Delhi
      Date: 23-10-2026
      
      Rx:
      Tab. Amlodipine 5mg - 1-0-0 after food
      Tab. Metformin 500mg - 0-0-1 after food with water
      Tab. Paracetamol 650mg - SOS
    `;

    const result = await adapter.extractPrescription(rawPrescription);

    expect(result.medicines.length).toBeGreaterThanOrEqual(2);

    // 1. Amlodipine check
    const amlo = result.medicines.find((m) => m.candidate_name.toLowerCase().includes('amlodipine'));
    expect(amlo).toBeDefined();
    expect(amlo?.candidate_strength).toBe('5mg');
    expect(amlo?.candidate_frequency).toBe('once_daily');
    expect(amlo?.verified).toBe(false); // Mandatory verification safeguard

    // 2. Metformin check
    const met = result.medicines.find((m) => m.candidate_name.toLowerCase().includes('metformin'));
    expect(met).toBeDefined();
    expect(met?.candidate_strength).toBe('500mg');

    // 3. Overall confidence score & safety warnings
    expect(result.overallConfidence).toBeGreaterThan(0.7);
    expect(result.safetyWarnings).toBeDefined();
    expect(result.safetyWarnings?.length).toBeGreaterThan(0);
  });

  it('handles brand names like Dolo and Pan40', async () => {
    const rawBrands = `
      1. Tab. Dolo 650mg - SOS
      2. Tab. Pan 40mg - 1-0-0
    `;

    const result = await adapter.extractPrescription(rawBrands);
    expect(result.medicines.length).toBe(2);
    expect(result.medicines[0].candidate_name).toContain('Paracetamol');
    expect(result.medicines[1].candidate_name).toContain('Pantoprazole');
  });
});
