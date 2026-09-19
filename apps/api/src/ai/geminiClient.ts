import { GoogleGenerativeAI } from '@google/generative-ai';
import { DecisionContext } from '@campus-crisis/shared';

const API_KEY = process.env.GEMINI_API_KEY;

export interface GeminiCallResult {
  success: boolean;
  rawResponse?: string;
  parsedResponse?: any;
  error?: string;
}

const SYSTEM_INSTRUCTION = `You are a campus crisis decision-support AI.
Analyze ONLY the provided campus state context.
You may recommend actions but MUST NOT invent resources, incidents, capabilities, locations, or constraints that are not in the context.

System Safety Rules:
1. Human safety is top priority.
2. Only assign resources that are status === "available".
3. Assigned resource capabilities must match incident requiredResourceTypes.
4. Do not double-assign the same resource to multiple active incidents simultaneously.
5. Respect route constraints; do not send resources through blocked routes.

Return ONLY valid structured JSON matching this format:
{
  "executiveSummary": "string",
  "incidentAnalysis": [
    {
      "incidentId": "string",
      "priorityScore": number,
      "urgencyLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
      "impactAssessment": "string",
      "riskCategory": "string"
    }
  ],
  "dependencies": [
    {
      "primaryIncidentId": "string",
      "dependentIncidentId": "string",
      "dependencyType": "SPATIAL_PROXIMITY" | "CASCADE_RISK" | "ROUTE_OBSTRUCTION" | "SHARED_RESOURCE_CONTENTION",
      "rationale": "string"
    }
  ],
  "resourceAllocation": [
    {
      "resourceId": "string",
      "assignedIncidentId": "string",
      "capabilityMatched": "string",
      "etaMinutes": number
    }
  ],
  "actionPlan": [
    {
      "stepNumber": number,
      "minuteWindow": "string",
      "actionType": "DISPATCH" | "MONITOR" | "STAGING" | "EVACUATE" | "CONTAIN",
      "targetIncidentId": "string",
      "assignedResourceId": "string",
      "description": "string",
      "rationale": "string"
    }
  ]
}`;

export async function callGeminiDecisionSupport(
  context: DecisionContext,
  repairInstruction?: string
): Promise<GeminiCallResult> {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    return {
      success: false,
      error: 'GEMINI_API_KEY unconfigured'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      systemInstruction: SYSTEM_INSTRUCTION
    });

    let promptContent = `CURRENT CAMPUS STATE CONTEXT:\n${JSON.stringify(context, null, 2)}`;
    if (repairInstruction) {
      promptContent += `\n\nREPAIR INSTRUCTION - Your previous response failed safety validation:\n${repairInstruction}\nPlease fix the plan step allocations according to these rules.`;
    }

    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const text = response.text() || '';
    const parsed = JSON.parse(text);

    return {
      success: true,
      rawResponse: text,
      parsedResponse: parsed
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Gemini API execution failed'
    };
  }
}
