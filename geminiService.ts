
import { GoogleGenAI, Type } from "@google/genai";
import { AnalyticalStandard, DetailedMethod, MethodCard, QCReport } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * TẦNG 1: AUTO-GENERATE DRAFT
 * Tạo bản thảo kỹ thuật với mật độ thông tin cao.
 */
export async function generateMethodCardDraft(params: { analyte: string, chemicalGroup: string, matrix: string, technique: string, standards: string }): Promise<MethodCard> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a HIGH-DETAIL Laboratory Method Card.
Analyte: ${params.analyte}
Chemical group: ${params.chemicalGroup || 'N/A'}
Matrix: ${params.matrix}
Technique: ${params.technique || 'Standard Analytical Technique'}
Standards: ${params.standards || 'Relevant ISO/AOAC/EPA'}

Requirements:
- Provide high technical density.
- Include specific extraction solvents, cleanup sorbents (e.g., C18, PSA), and column types (e.g., C18, HILIC).
- Focus on practical troubleshooting and 'insider' lab tips.
- Language: Vietnamese.`,
    config: {
      systemInstruction: `You are a Senior Application Engineer in an ISO 17025 accredited laboratory.
Generate a comprehensive 9-section Method Card.
Sections:
1. Method Overview: Principle and chemical relevance.
2. Sample Preparation: Detailed extraction and cleanup (summary but technical).
3. Instrumentation: Column details, mobile phases, and detection logic.
4. Performance: Expected LOD, LOQ, Recovery, and RSD ranges.
5. Pitfalls: Critical failures and matrix effects.
6. Lab Notes: Professional experience and productivity tips.
7. Selection: When to choose this method vs others.
8. Compliance: Specific quality criteria (SANTE, EPA, etc.).
9. Disclaimer: Standard technical liability notice.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          analytes: { type: Type.STRING },
          chemicalGroup: { type: Type.STRING },
          matrix: { type: Type.STRING },
          technique: { type: Type.STRING },
          referenceStandards: { type: Type.STRING },
          sections: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING },
              samplePrep: { type: Type.STRING },
              instrumentation: { type: Type.STRING },
              performance: { type: Type.STRING },
              pitfalls: { type: Type.STRING },
              labNotes: { type: Type.STRING },
              selection: { type: Type.STRING },
              compliance: { type: Type.STRING },
              disclaimer: { type: Type.STRING }
            },
            required: ["overview", "samplePrep", "instrumentation", "performance", "pitfalls", "labNotes", "selection", "compliance", "disclaimer"]
          }
        },
        required: ["title", "analytes", "matrix", "technique", "referenceStandards", "sections"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * TẦNG 2 & 3: AUTO-CHECK & FINAL FIX
 * Kiểm soát chất lượng và bổ sung các chi tiết còn thiếu để đạt chất lượng chuyên gia.
 */
export async function performQCAndFinalize(draft: MethodCard): Promise<{ qcReport: QCReport, finalCard: MethodCard }> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Review and finalize this expert Method Card: ${JSON.stringify(draft)}`,
    config: {
      systemInstruction: `You are an ISO 17025 Lead Auditor and Method Validation Expert.
1. Audit the draft for technical gaps (e.g., missing pH adjustments, matrix matching).
2. Create a concise QC Report.
3. Fix and enrich the Method Card to ensure it provides MAXIMUM value to a lab technician.
Ensure the Final version is robust, highly technical, and strictly formatted.
Language: Vietnamese.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          qcReport: {
            type: Type.OBJECT,
            properties: {
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    section: { type: Type.STRING },
                    risk: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
                  }
                }
              },
              suggestions: { type: Type.STRING },
              isReady: { type: Type.BOOLEAN },
              confidence: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
            }
          },
          finalCard: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              analytes: { type: Type.STRING },
              chemicalGroup: { type: Type.STRING },
              matrix: { type: Type.STRING },
              technique: { type: Type.STRING },
              referenceStandards: { type: Type.STRING },
              sections: {
                type: Type.OBJECT,
                properties: {
                  overview: { type: Type.STRING },
                  samplePrep: { type: Type.STRING },
                  instrumentation: { type: Type.STRING },
                  performance: { type: Type.STRING },
                  pitfalls: { type: Type.STRING },
                  labNotes: { type: Type.STRING },
                  selection: { type: Type.STRING },
                  compliance: { type: Type.STRING },
                  disclaimer: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function searchStandards(query: string): Promise<{ standards: AnalyticalStandard[], sources: { title?: string; uri?: string }[] }> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find analytical standards for: "${query}". Return a JSON list of objects with fields: id, code, title, organization, status, lastUpdate, matrix, parameters { analyte, lod, instrument, technique }, summary, twoMinuteRead.`,
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }]
    }
  });

  const standards = JSON.parse(response.text || '[]');
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({ title: chunk.web?.title, uri: chunk.web?.uri }))
    .filter((s: any) => s.uri) || [];

  return { standards, sources };
}

export async function fetchFullMethodDetails(code: string, title: string): Promise<DetailedMethod> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide technical breakdown for standard: ${code} - ${title}. 
Return JSON with sections: overview, samplePrep, instrumentation, performance, pitfalls, labNotes, compliance, selection. 
Each section must have { en, vi } strings.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
}

export async function compareStandards(codes: string[]): Promise<any> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Compare technical specs of: ${codes.join(', ')}. Return JSON with comparisonTable (array of {attribute, values: { [code]: string }}) and expertInsight string.`,
    config: { responseMimeType: "application/json" }
  });
  return JSON.parse(response.text || '{}');
}
