import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-0 px-4">
            <div className="text-center">
                <div className="text-8xl font-black gradient-text mb-4">
                    404
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-3">
                    Page Not Found
                </h1>
                <p className="text-sm text-text-secondary mb-8 max-w-md">
                    The page you&apos;re looking for doesn&apos;t exist or has
                    been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-wealth-600 text-white font-medium hover:bg-wealth-500 transition-colors"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
