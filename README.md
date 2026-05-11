<div align="center">
  <img src="./frontend/public/file.svg" alt="VaultID Logo" width="80" />
  <h1>VaultID</h1>
  <p><strong>Secure Your Device. Defeat the Black Market.</strong></p>
  <p>Moving from reactive tracking to proactive economic denial using the Solana blockchain.</p>
</div>

---

## 🛡️ Overview

**VaultID** is a decentralized application designed to cryptographically bind physical assets (like smartphones and laptops) to digital identities. By hashing a device's unique identifier (such as an IMEI number) and storing it on-chain, VaultID prevents device theft by making it economically unviable for the black market to fence stolen goods.

When a device is reported stolen on VaultID, its on-chain status is updated instantly. VaultID turns secondary market vendors into bounty hunters by offering a trustless, automated financial payout for returning the device, effectively outbidding the black market.

### Key Features
- **Mint Device Cores:** Securely register your device by creating a non-transferable cryptographic core (powered by Metaplex Core) linked to a one-way hash of your IMEI for less than a cent.
- **Emergency Lockdown:** Instantly report your device as stolen to update the on-chain PDA, halting transferability and transferring salvage rights.
- **Trustless Bounty Escrows:** When a device is reported stolen, owners fund a trustless SOL bounty. Vendors who scan the IMEI can return the device via the owner's recovery email to claim the payout.
- **Cross-Chain Funding via LI.FI:** Users can fund their in-app wallets and bounties using ETH on Base or USDC on Arbitrum with a single click, completely abstracted via the LI.FI widget.
- **Cryptographic Proof of Loss:** VaultID provides verifiable, immutable proof of loss to smartphone insurance providers, eliminating double-dipping fraud.
- **Public Vendor Portal:** Buyers and vendors can verify the status of a device *before* purchasing it via an intuitive, rate-limited public portal.
- **Web2 UX, Web3 Core:** Onboard seamlessly with just an email via Privy—no seed phrases required.

---

## 🏗️ Technology Stack

VaultID is built with a modern, high-performance Web3 stack, spanning 11,000+ lines of code shipped in 41 hours.

**Smart Contracts (On-Chain Logic)**
- **Rust & Anchor Framework:** For secure, fast Solana smart contract development.
- **Solana Devnet:** Current deployment environment utilizing sub-cent fees.
- **Metaplex Core:** Highly optimized, stateful NFT standard for digital asset registry.

**Frontend (Client & Vendor Dashboard)**
- **Next.js (App Router):** React framework for SSR and API routes.
- **Tailwind CSS v4:** Utility-first styling with comprehensive dark mode support.
- **Privy:** Seamless onboarding and in-app wallet management (Email).
- **LI.FI:** Cross-chain bridging aggregation for seamless liquidity routing.
- **@coral-xyz/anchor:** Client library for interacting with the Solana program.

---

## 🗺️ Roadmap

The current version of VaultID is a fully functional MVP on the Solana Devnet. Here is the path forward:

### Phase 1: MVP & Core Loops (Current)
- [x] Responsive Desktop & Mobile UI
- [x] Privy Email Onboarding & In-App Wallets
- [x] Cross-Chain LI.FI Bridge Integration
- [x] Trustless Bounty Escrow System
- [ ] Migrate from in-memory API rate limiting to **Redis** (Vercel KV) for the Vendor Portal.
- [ ] Comprehensive Smart Contract Audit.

### Phase 2: Advanced Corporate Features
- **Fiat On-Ramp Integration:** Seamlessly support local fiat currencies (e.g., Naira) for true mass-market Web2 adoption.
- **Multisig Vendor Accounts:** Allow corporations and retail stores to manage massive fleets of devices using SPL Governance or Squads.
- **Batch Minting:** Optimized instructions for registering thousands of devices in a single transaction.

### Phase 3: Ecosystem Expansion
- **Mobile Application:** A native mobile wrapper (React Native / Expo) that auto-reads device IMEIs securely.
- **Zero-Knowledge Recovery:** Allow users to recover a device without exposing sensitive personal identifiable information (PII) on-chain.

---

## 👨‍💻 Developer Guide

Want to contribute to VaultID? Here is how to set up your local environment.

### Prerequisites
Ensure you have the following installed on your machine:
- [Node.js (v18+)](https://nodejs.org/) & `npm` / `yarn`
- [Rust & Cargo](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.30+)

### 1. Clone the Repository
```bash
git clone https://github.com/0takuc0mrade/VaultID.git
cd VaultID
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
  <i>Built with ❤️ to defeat the black market.</i>
</div>
