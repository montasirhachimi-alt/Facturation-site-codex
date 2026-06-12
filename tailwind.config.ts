import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        hicotech: {
          blue: "#0D6EFD",
          navy: "#0A1E3F",
          sky: "#E6F2FF",
          cloud: "#F5F7FA",
          green: "#2ECC71",
          orange: "#FF8C00",
          red: "#E74C3C",
          ink: "#333333"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(10, 30, 63, 0.08)"
      },
      fontFamily: {
        display: ["Montserrat", "Inter", "Arial", "sans-serif"],
        body: ["Inter", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
