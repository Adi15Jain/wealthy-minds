/**
 * Shared error type for all AI providers. Kept in its own module so provider
 * files and the orchestrator can import it without a circular dependency.
 */

export type AiErrorCode =
    | "NO_KEY"
    | "TIMEOUT"
    | "RATE_LIMIT"
    | "UPSTREAM"
    | "PARSE";

/** Codes that mean "try the next provider" rather than "give up". */
export const RETRIABLE_CODES: ReadonlySet<AiErrorCode> = new Set([
    "NO_KEY",
    "TIMEOUT",
    "RATE_LIMIT",
    "UPSTREAM",
]);

export class AiError extends Error {
    readonly provider: string;
    readonly code: AiErrorCode;

    constructor(provider: string, code: AiErrorCode, message: string) {
        super(message);
        this.name = "AiError";
        this.provider = provider;
        this.code = code;
    }
}
