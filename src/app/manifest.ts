import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "WealthyMinds",
        short_name: "WealthyMinds",
        description:
            "AI Operating System for Personal Wealth — portfolio cognition, behavioral intelligence, and disciplined long-term wealth creation.",
        start_url: "/dashboard",
        display: "standalone",
        // Hex approximations of --color-surface-0: oklch(0.13 0.01 260)
        background_color: "#05070b",
        theme_color: "#05070b",
        icons: [
            // SVG-only icon set is intentional: scalable, and modern
            // browsers/installers accept SVG manifest icons.
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
            },
        ],
    };
}
