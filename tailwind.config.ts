import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./1780081963742663076.html"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				golos: ['Golos Text', 'sans-serif'],
				oswald: ['Oswald', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'coin-pop': {
					'0%': { transform: 'scale(0) translateY(0)', opacity: '1' },
					'60%': { transform: 'scale(1.2) translateY(-40px)', opacity: '1' },
					'100%': { transform: 'scale(0.8) translateY(-80px)', opacity: '0' }
				},
				'click-pulse': {
					'0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(250,204,21,0.7)' },
					'50%': { transform: 'scale(0.93)', boxShadow: '0 0 0 20px rgba(250,204,21,0)' },
					'100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(250,204,21,0)' }
				},
				'float-up': {
					'0%': { transform: 'translateY(0)', opacity: '1' },
					'100%': { transform: 'translateY(-90px)', opacity: '0' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(250,204,21,0.3), 0 0 60px rgba(250,204,21,0.1)' },
					'50%': { boxShadow: '0 0 40px rgba(250,204,21,0.6), 0 0 100px rgba(250,204,21,0.2)' }
				},
				'slide-in-left': {
					'0%': { transform: 'translateX(-30px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(30px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'fade-in-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'ad-slide-in': {
					'0%': { transform: 'translateY(100px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'shake': {
					'0%, 100%': { transform: 'translateX(0)' },
					'20%': { transform: 'translateX(-4px)' },
					'40%': { transform: 'translateX(4px)' },
					'60%': { transform: 'translateX(-4px)' },
					'80%': { transform: 'translateX(4px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'coin-pop': 'coin-pop 0.8s ease-out forwards',
				'click-pulse': 'click-pulse 0.3s ease-out',
				'float-up': 'float-up 1s ease-out forwards',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'slide-in-left': 'slide-in-left 0.4s ease-out',
				'slide-in-right': 'slide-in-right 0.4s ease-out',
				'fade-in-up': 'fade-in-up 0.5s ease-out',
				'spin-slow': 'spin-slow 8s linear infinite',
				'ad-slide-in': 'ad-slide-in 0.5s ease-out',
				'shake': 'shake 0.4s ease-in-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
