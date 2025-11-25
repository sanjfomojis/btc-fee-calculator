import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        modern: {
          bg: "#fafafa",
          surface: "#ffffff",
          surfaceHover: "#f9fafb",
          border: "#e5e7eb",
          borderLight: "#f3f4f6",
          accent: "#3b82f6",
          accentHover: "#2563eb",
          accentLight: "#dbeafe",
          warning: "#f59e0b",
          warningLight: "#fef3c7",
          error: "#ef4444",
          errorLight: "#fee2e2",
          success: "#10b981",
          successLight: "#d1fae5",
          text: "#111827",
          textDim: "#6b7280",
          textLight: "#9ca3af",
        },
      },
      fontFamily: {
        pixel: ["Press Start 2P", "monospace"],
        mono: ["Courier New", "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0px 0px",
        pixelSmall: "2px 2px 0px 0px",
        pixelInset: "inset 2px 2px 0px 0px",
      },
      animation: {
        glitch: "glitch 0.3s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

