import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client singleton.
 * Prevents multiple instances during hot reload in development.
 *
 * The client is created lazily on first use so that importing this module
 * (e.g. during `next build`) does not require DATABASE_URL to be set.
 */

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    // ── Prisma Adapter Setup ─────────────────────────────────
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });
}

let cachedClient: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
    // Reuse the hot-reload-surviving instance in development.
    if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }
    if (!cachedClient) {
        cachedClient = createPrismaClient();
        if (process.env.NODE_ENV !== "production") {
            globalForPrisma.prisma = cachedClient;
        }
    }
    return cachedClient;
}

/**
 * Lazy proxy: the underlying PrismaClient (and pg Pool) is only constructed
 * the first time a property is accessed, at which point a missing
 * DATABASE_URL fails fast with a clear error.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
    get(_target, property) {
        const client = getPrismaClient();
        const value = Reflect.get(client, property, client) as unknown;
        if (typeof value === "function") {
            return (value as (...args: unknown[]) => unknown).bind(client);
        }
        return value;
    },
});
