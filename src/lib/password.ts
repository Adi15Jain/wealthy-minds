import bcrypt from "bcryptjs";

/**
 * Password hashing & validation utilities.
 * Uses bcryptjs (pure JS) with 12 salt rounds.
 */

const SALT_ROUNDS = 12;

export const PASSWORD_RULE =
    "At least 8 characters, with at least one letter and one number.";

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
    password: string,
    hash: string,
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export interface PasswordValidationResult {
    valid: boolean;
    message: string;
}

export function validatePassword(password: string): PasswordValidationResult {
    if (password.length < 8) {
        return {
            valid: false,
            message: "Password must be at least 8 characters long.",
        };
    }
    if (!/[a-zA-Z]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one letter.",
        };
    }
    if (!/[0-9]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one number.",
        };
    }
    return { valid: true, message: "Password looks good." };
}
