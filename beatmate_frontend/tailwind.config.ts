import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        ai: {
          primary: "hsl(var(--ai-primary))",
          secondary: "hsl(var(--ai-secondary))",
          glow: "hsl(var(--ai-glow))",
        },
        collab: {
          primary: "hsl(var(--collab-primary))",
          secondary: "hsl(var(--collab-secondary))",
        },
        songs: {
          primary: "hsl(var(--songs-primary))",
          secondary: "hsl(var(--songs-secondary))",
        },
      },
      backgroundImage: {
        'gradient-ai': 'var(--gradient-ai)',
        'gradient-collab': 'var(--gradient-collab)',
        'gradient-songs': 'var(--gradient-songs)',
        'gradient-bg': 'var(--gradient-bg)',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'card': 'var(--shadow-card)',
        'intense': 'var(--shadow-intense)',
        'subtle': 'var(--shadow-subtle)',
        'strong': 'var(--shadow-strong)',
      },
      transitionTimingFunction: {
        'smooth': 'var(--transition-smooth)',
        'bounce': 'var(--transition-bounce)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 20px hsl(var(--ai-glow) / 0.3)",
          },
          "50%": {
            opacity: "0.8",
            boxShadow: "0 0 40px hsl(var(--ai-glow) / 0.6)",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        "float-slow": {
          "0%, 100%": { 
            transform: "translateY(0px) translateX(0px)" 
          },
          "50%": { 
            transform: "translateY(-30px) translateX(10px)" 
          },
        },
        "glow-rotate": {
          "0%": {
            boxShadow: "0 0 20px hsl(280 100% 70% / 0.3), 0 0 40px hsl(320 100% 75% / 0.2)",
          },
          "50%": {
            boxShadow: "0 0 30px hsl(320 100% 75% / 0.4), 0 0 60px hsl(280 100% 70% / 0.3)",
          },
          "100%": {
            boxShadow: "0 0 20px hsl(280 100% 70% / 0.3), 0 0 40px hsl(320 100% 75% / 0.2)",
          },
        },
        "fade-in": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(10px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)" 
          },
        },
        "fade-in-left": {
          "0%": { 
            opacity: "0", 
            transform: "translateX(-20px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateX(0)" 
          },
        },
        "fade-in-right": {
          "0%": { 
            opacity: "0", 
            transform: "translateX(20px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateX(0)" 
          },
        },
        "slide-up": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(20px)" 
          },
          "100%": { 
            opacity: "1", 
            transform: "translateY(0)" 
          },
        },
        "scale-in": {
          "0%": { 
            transform: "scale(0.8)" 
          },
          "100%": { 
            transform: "scale(1)" 
          },
        },
        "shimmer": {
          "0%": { 
            backgroundPosition: "-200% center" 
          },
          "100%": { 
            backgroundPosition: "200% center" 
          },
        },
        "equalizer": {
          "0%, 100%": { 
            height: "20%" 
          },
          "50%": { 
            height: "100%" 
          },
        },
        "equalizer-2": {
          "0%, 100%": { 
            height: "60%" 
          },
          "50%": { 
            height: "30%" 
          },
        },
        "equalizer-3": {
          "0%, 100%": { 
            height: "40%" 
          },
          "50%": { 
            height: "80%" 
          },
        },
        "wave": {
          "0%": { 
            transform: "translateX(-100%)" 
          },
          "100%": { 
            transform: "translateX(100%)" 
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "glow-rotate": "glow-rotate 4s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-left": "fade-in-left 0.6s ease-out",
        "fade-in-right": "fade-in-right 0.6s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "shimmer": "shimmer 3s linear infinite",
        "equalizer": "equalizer 1s ease-in-out infinite",
        "equalizer-2": "equalizer-2 1.2s ease-in-out infinite",
        "equalizer-3": "equalizer-3 0.8s ease-in-out infinite",
        "wave": "wave 4s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
