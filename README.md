<div align="center">
  <img src="./frontend/public/file.svg" alt="Bushi Logo" width="80" />
  <h1>Bushi</h1>
  <p><strong>Bank-grade encryption for your physical devices.</strong></p>
  <p>Protect, track, and transfer hardware ownership using the Solana blockchain.</p>
</div>

---

## 🛡️ Overview

**Bushi** is a decentralized application designed to cryptographically bind physical assets (like smartphones and laptops) to digital identities. By hashing a device's unique identifier (such as an IMEI number) and storing it on-chain, Bushi prevents device theft, establishes verifiable provenance, and allows seamless peer-to-peer ownership transfers.

When a device is reported stolen on Bushi, its on-chain status is updated instantly, rendering it useless to thieves and preventing it from being resold on secondary markets.

### Key Features
- **Mint Device Cores:** Securely register your device by creating a non-transferable cryptographic core (powered by Metaplex Core) linked to a one-way hash of your IMEI.
- **Emergency Lockdown:** Instantly report your device as stolen. This updates the on-chain PDA (Program Derived Address), immediately halting any transferability and warning potential buyers.
- **Ownership Transfers:** Cryptographically transfer your device to a new buyer. Ownership history is transparent and immutable.
- **Public Verification Portal:** Buyers can verify the status of a device *before* purchasing it via an intuitive, rate-limited public portal.
- **Responsive Dark Mode UI:** A gorgeous, density-optimized frontend that works perfectly on both mobile devices (for scanning in the field) and desktop dashboards (for vendors managing inventory).

---

## 🏗️ Technology Stack

Bushi is built with a modern, high-performance Web3 stack.

**Smart Contracts (On-Chain Logic)**
- **Rust:** Core programming language.
- **Anchor Framework:** For secure, fast Solana smart contract development.
- **Solana Devnet:** Current deployment environment.
- **Metaplex Core:** Next-generation, highly optimized NFT standard for digital assets.

**Frontend (Client & Vendor Dashboard)**
- **Next.js (App Router):** React framework for SSR and API routes.
- **Tailwind CSS v4:** Utility-first styling with comprehensive dark mode support.
- **Privy:** Seamless onboarding and wallet management (Google, Email, Solana Wallets).
- **@coral-xyz/anchor:** Client library for interacting with the Solana program.

---

## 🗺️ Roadmap

The current version of Bushi is a fully functional MVP on the Solana Devnet. Here is the path forward:

### Phase 1: Production Hardening (Current)
- [x] Responsive Desktop & Mobile UI
- [x] Dark Mode System Integration
- [ ] Migrate from in-memory API rate limiting to **Redis** (Vercel KV) for the Verification Portal.
- [ ] Transition RPC providers from public Devnet to dedicated Mainnet endpoints (e.g., Helius, QuickNode).
- [ ] Comprehensive Smart Contract Audit.

### Phase 2: Advanced Corporate Features
- **Multisig Vendor Accounts:** Allow corporations and retail stores to manage massive fleets of devices using SPL Governance or Squads.
- **Batch Minting:** Optimized instructions for registering thousands of devices in a single transaction.
- **Bounty System:** Smart contracts that escrow USDC rewards for individuals who return devices marked as stolen.

### Phase 3: Ecosystem Expansion
- **Mobile Application:** A native mobile wrapper (React Native / Expo) that auto-reads device IMEIs securely.
- **Zero-Knowledge Recovery:** Allow users to recover a device without exposing sensitive personal identifiable information (PII) on-chain.

---

## 👨‍💻 Developer Guide

Want to contribute to Bushi? Here is how to set up your local environment.

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js (v18+)](https://nodejs.org/) & `npm` / `yarn`
- [Rust & Cargo](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.30+)

### 1. Clone the Repository
```bash
git clone https://github.com/0takuc0mrade/Bushi.git
cd Bushi
```

### 2. Smart Contract Setup (`anchor/bushi/`)
The Solana programs are located in the `anchor/bushi` directory.

```bash
cd anchor/bushi
yarn install
```

**Testing the contracts:**
To run the local validator and test the Rust logic:
```bash
anchor test
```

**Deploying to Devnet:**
1. Configure your Solana CLI to use Devnet: `solana config set --url devnet`
2. Ensure you have Devnet SOL: `solana airdrop 2`
3. Build the program: `anchor build`
4. Deploy: `anchor deploy`
*(Note: If you deploy a new program, you must update the Program ID in `declare_id!` inside `lib.rs` and update the `Anchor.toml`).*

### 3. Frontend Setup (`frontend/`)
The Next.js application is located in the `frontend` directory.

```bash
cd ../../frontend
npm install
```

**Environment Variables:**
Create a `.env.local` file in the `frontend/` root. You will need a Privy App ID.
```env
NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id_here"
NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
```

**Run the Development Server:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Architecture & Key Files
- `frontend/src/app/page.tsx`: The main dashboard (responsive).
- `frontend/src/lib/bushiClient.ts`: Contains all the logic for building Anchor transactions and fetching PDAs.
- `anchor/bushi/programs/bushi/src/instructions/`: Contains the Rust logic for minting, transferring, and reporting devices.
- `anchor/bushi/programs/bushi/src/state.rs`: Defines the on-chain state structure for a `DeviceState` account.

---

<div align="center">
  <i>Built with ❤️ for a more secure world.</i>
</div>
