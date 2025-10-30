
Roman Jaishibekov (https://www.instagram.com/mrromenion/) 

Batumukhammed Beksultan (https://x.com/cil_mann41719) (https://github.com/BATU994)

Kanat Aldabek (https://www.instagram.com/kaneke_design/) (https://www.behance.net/45ba0a97)

Galymbek Muratbay (https://www.behance.net/galymbemuratba) (https://smart-directions-578401.framer.app/)

Magzhan Skakov (https://github.com/vcffff) (https://x.com/MagzhanSka21914)

# Resources

Figma Presentation:
https://www.figma.com/proto/UGZgBUPgD1J84hAntjveDQ/Agrolink-Presentation?page-id=0%3A1&node-id=2026-41&p=f&viewport=-316%2C-614%2C0.7&t=Ub8YYz8KGP0mKT0r-1&scaling=contain&content-scaling=fixed

Platform (Demo):
https://blockchain-project-lilac.vercel.app

Landing Page / YouTube Video:
(link to be added)

# Problem and solution
The poultry industry is a $400+ billion global market, but it remains opaque.
Farmers depend on intermediaries and lack direct access to investments.

Our Solution
Every chicken item gets a unique digital token proving its origin and quality.
Liquidity for farmers, stable income for investors

# Summary of Submission Features

Role-based demo login (Investor/Retailer or Poultry Farm)

Farm catalog with NFT product batches

Demo NFT purchase & price offer flow

Seller dashboard with offer management & shipment status

Sales analytics: bar chart, funnel, revenue trend

Simulated Phantom wallet connection & royalty balance

Demo payout with masked IBAN verification

Help modal, smooth animations, and landing page with info blocks

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

# Tech Stack

UI: React 19, TypeScript, Vite

Blockchain SDKs: @solana/web3.js, wallet-adapter (Phantom demo connection), @metaplex-foundation/js

Styling: Custom utility classes (Tailwind-style), CSS

State Management: React hooks + localStorage (demo persistence)

Build & Dev Server: Vite 7

Linting: ESLint 9, TypeScript-ESLint

# Architecture
<img width="700" height="1080" alt="ChatGPT Image Oct 30, 2025, 04_14_54 PM" src="https://github.com/user-attachments/assets/82822488-e408-4a4c-bada-18ac2b4dbb22" />

# Quick Start Guide

1. Clone the repository
git clone https://github.com/vcffff/Blockchain-project.git
cd Blockchain-project/AgroLink

2. Install dependencies
Make sure you have Node.js 18+ and npm 9+ installed.
Then run:
npm install

3. Start the development server
npm run dev

The app will be available at http://localhost:5173/

4. Tech notes

   No external API keys required (demo-mode only).

   Works on Vite 7 with React 19 + TypeScript.

   Phantom wallet connection and NFT operations are simulated locally.

