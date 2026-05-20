/**
 * AI Prompt Management System
 * Centralized prompt templates with context engineering for Google AI Studio.
 */

// ── Base Context ─────────────────────────────────────────────
export const SYSTEM_CONTEXT = `You are WealthyMinds AI — an intelligent financial assistant focused on long-term wealth creation and disciplined investing for Indian investors.

Core principles:
- Always prioritize long-term wealth creation over short-term gains
- Promote disciplined, systematic investing (SIPs)
- Provide balanced, emotionally stable financial guidance
- Never recommend intraday trading or speculative investments
- Consider Indian tax implications (LTCG, STCG, indexation)
- Use Indian financial context (INR, NSE/BSE, SEBI regulations)
- Be analytical but accessible in your communication

You never provide buy/sell recommendations for specific securities. You provide educational insights and general allocation guidance.`;

// ── Prompt Templates ─────────────────────────────────────────

export const PROMPTS = {
    PORTFOLIO_SUMMARY: (context: {
        totalValue: number;
        totalInvested: number;
        returns: number;
        assetAllocation: Record<string, number>;
        topHoldings: Array<{ name: string; weight: number; returns: number }>;
    }) => `
${SYSTEM_CONTEXT}

Analyze this portfolio and provide a clear, analytical summary:

Portfolio Overview:
- Total Value: ₹${context.totalValue.toLocaleString("en-IN")}
- Total Invested: ₹${context.totalInvested.toLocaleString("en-IN")}
- Total Returns: ₹${context.returns.toLocaleString("en-IN")} (${((context.returns / context.totalInvested) * 100).toFixed(1)}%)

Asset Allocation:
${Object.entries(context.assetAllocation)
    .map(([asset, weight]) => `- ${asset}: ${weight}%`)
    .join("\n")}

Top Holdings:
${context.topHoldings
    .map((h) => `- ${h.name}: ${h.weight}% allocation, ${h.returns}% returns`)
    .join("\n")}

Provide:
1. A 2-3 sentence portfolio health assessment
2. Key strengths (2-3 points)
3. Areas for improvement (2-3 points)
4. One actionable suggestion

Keep the tone calm, analytical, and focused on long-term wealth building.`,

    RISK_NARRATIVE: (context: {
        riskScore: number;
        volatility: number;
        concentration: number;
        topSectorWeight: number;
        topSector: string;
    }) => `
${SYSTEM_CONTEXT}

Generate a risk narrative for this portfolio:

Risk Metrics:
- Overall Risk Score: ${context.riskScore}/100
- Volatility: ${context.volatility}%
- Top 5 Holdings Concentration: ${context.concentration}%
- Highest Sector Exposure: ${context.topSector} at ${context.topSectorWeight}%

Provide:
1. A plain-English risk assessment (3-4 sentences)
2. What the risk score means for the investor
3. Concentration risk analysis
4. One protective action to consider

Use calm, educational language. Avoid alarm or urgency.`,

    BEHAVIORAL_OBSERVATION: (context: {
        disciplineScore: number;
        avgHoldingPeriod: number;
        sipConsistency: number;
        recentActions: string[];
    }) => `
${SYSTEM_CONTEXT}

Analyze this investor's behavioral patterns:

Behavioral Data:
- Discipline Score: ${context.disciplineScore}/100
- Average Holding Period: ${context.avgHoldingPeriod} years
- SIP Consistency: ${context.sipConsistency}%
- Recent Actions: ${context.recentActions.join(", ")}

Provide:
1. Overall behavioral assessment (2-3 sentences)
2. Positive patterns observed (2 points)
3. Behavioral biases detected (if any)
4. One suggestion for improvement

Be supportive and constructive. Focus on long-term behavioral improvement.`,

    GOAL_ANALYSIS: (context: {
        goalName: string;
        targetAmount: number;
        currentAmount: number;
        deadline: string;
        monthlyContribution: number;
    }) => `
${SYSTEM_CONTEXT}

Analyze progress toward this financial goal:

Goal: ${context.goalName}
- Target: ₹${context.targetAmount.toLocaleString("en-IN")}
- Current: ₹${context.currentAmount.toLocaleString("en-IN")}
- Deadline: ${context.deadline}
- Monthly Contribution: ₹${context.monthlyContribution.toLocaleString("en-IN")}
- Progress: ${((context.currentAmount / context.targetAmount) * 100).toFixed(1)}%

Provide:
1. Progress assessment (on track, behind, ahead)
2. Whether current contributions are sufficient
3. Suggested adjustments if needed
4. Motivational note about the journey

Keep it practical and encouraging.`,
} as const;

// ── AI Provider Abstraction ──────────────────────────────────

export interface AIProvider {
    generateText: (prompt: string) => Promise<string>;
    generateStructured: <T>(prompt: string, schema: object) => Promise<T>;
}

/**
 * Google AI Studio provider (to be implemented with actual API integration).
 */
export class GoogleAIProvider implements AIProvider {
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model = "gemini-2.0-flash") {
        this.apiKey = apiKey;
        this.model = model;
    }

    async generateText(prompt: string): Promise<string> {
        // TODO: Implement actual Google AI Studio API call
        // POST https://generativelanguage.googleapis.com/v1/models/{model}:generateContent
        console.log(`[AI] Generating text with ${this.model}`);
        return "AI response placeholder — integrate Google AI Studio API";
    }

    async generateStructured<T>(prompt: string, _schema: object): Promise<T> {
        const text = await this.generateText(prompt);
        return JSON.parse(text) as T;
    }
}

// ── AI Orchestrator ──────────────────────────────────────────

export class AIOrchestrator {
    private provider: AIProvider;

    constructor(provider: AIProvider) {
        this.provider = provider;
    }

    async getPortfolioSummary(
        context: Parameters<typeof PROMPTS.PORTFOLIO_SUMMARY>[0],
    ) {
        const prompt = PROMPTS.PORTFOLIO_SUMMARY(context);
        return this.provider.generateText(prompt);
    }

    async getRiskNarrative(
        context: Parameters<typeof PROMPTS.RISK_NARRATIVE>[0],
    ) {
        const prompt = PROMPTS.RISK_NARRATIVE(context);
        return this.provider.generateText(prompt);
    }

    async getBehavioralObservation(
        context: Parameters<typeof PROMPTS.BEHAVIORAL_OBSERVATION>[0],
    ) {
        const prompt = PROMPTS.BEHAVIORAL_OBSERVATION(context);
        return this.provider.generateText(prompt);
    }

    async getGoalAnalysis(
        context: Parameters<typeof PROMPTS.GOAL_ANALYSIS>[0],
    ) {
        const prompt = PROMPTS.GOAL_ANALYSIS(context);
        return this.provider.generateText(prompt);
    }
}
