import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          black: "#000000",
          void: "#050505",
          deep: "#0a0a0a",
          surface: "#141414",
          elevated: "#1a1a1a",
          card: "#111111",
        },
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "spin-slow": "spin-slow 2s linear infinite",
        "flip-in-x": "flip-in-x 0.7s ease-out forwards",
        "flip-in-y": "flip-in-y 0.7s ease-out forwards",
        "scroll-reveal": "scroll-reveal 0.8s ease-out forwards",
        "text-reveal": "text-reveal 0.6s ease-out forwards",
        "line-expand": "line-expand 0.8s ease-out forwards",
        "fade-in-blur": "fade-in-blur 0.6s ease-out forwards",
        "marquee": "marquee 30s linear infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "rotate-in": "rotate-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
      },
      boxShadow: {
        "glow-sm": "0 0 20px rgba(255, 255, 255, 0.05)",
        "glow-md": "0 0 40px rgba(255, 255, 255, 0.08)",
        "glow-lg": "0 0 60px rgba(255, 255, 255, 0.1)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
