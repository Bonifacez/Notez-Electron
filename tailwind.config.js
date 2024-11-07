// const { nextui } = require("@nextui-org/theme");
const { nextui } = require("@nextui-org/react");
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            appRegion: {
                drag: "-webkit-app-region: drag",
                noDrag: "-webkit-app-region: no-drag",
            },
            animation: {
                rainbow: "rainbow 5s linear infinite",
                wave: "wave 2s ease-in-out infinite",
            },
            keyframes: {
                rainbow: {
                    "0%, 100%": { color: "#ff0000" },
                    "14%": { color: "#ff7f00" },
                    "28%": { color: "#ffff00" },
                    "42%": { color: "#00ff00" },
                    "57%": { color: "#0000ff" },
                    "71%": { color: "#8b00ff" },
                    "85%": { color: "#ff00ff" },
                },
                wave: {
                    "0%, 100%": {
                        opacity: "0",
                        transform: "translateX(-100%) scaleX(1) translateY(0)",
                    },
                    "50%": {
                        opacity: "1",
                        transform: "translateX(0) scaleX(1.2) translateY(-2px)",
                    },
                },
            },
        },
    },
    corePlugins: {
        preflight: false,
    },
    darkMode: "class",
    plugins: [nextui()],
};
