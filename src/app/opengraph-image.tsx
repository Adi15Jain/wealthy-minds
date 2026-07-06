import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "WealthyMinds — AI Operating System for Personal Wealth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#05070b",
                    backgroundImage:
                        "radial-gradient(ellipse 900px 500px at 50% -10%, rgba(31, 116, 191, 0.28), transparent 70%), radial-gradient(ellipse 700px 400px at 85% 110%, rgba(0, 179, 136, 0.18), transparent 70%), linear-gradient(rgba(120, 130, 150, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 130, 150, 0.06) 1px, transparent 1px)",
                    backgroundSize:
                        "100% 100%, 100% 100%, 48px 48px, 48px 48px",
                    fontFamily:
                        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
                }}
            >
                {/* Trend mark */}
                <svg
                    width="112"
                    height="112"
                    viewBox="0 0 64 64"
                    style={{ marginBottom: 40 }}
                >
                    <path
                        d="M14 24 L23 44 L32 30 L41 44 L50 17"
                        fill="none"
                        stroke="#56c9a2"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="50" cy="17" r="3.5" fill="#56c9a2" />
                </svg>
                <div
                    style={{
                        display: "flex",
                        fontSize: 96,
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        color: "#eceff2",
                    }}
                >
                    WealthyMinds
                </div>
                <div
                    style={{
                        display: "flex",
                        marginTop: 24,
                        fontSize: 34,
                        fontWeight: 500,
                        letterSpacing: "0.01em",
                        color: "#9b9fa5",
                    }}
                >
                    AI Operating System for Personal Wealth
                </div>
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background:
                            "linear-gradient(90deg, transparent, #1f74bf, #56c9a2, transparent)",
                    }}
                />
            </div>
        ),
        size,
    );
}
