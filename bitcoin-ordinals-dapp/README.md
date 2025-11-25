# Bitcoin Ordinals Inscription DApp

A minimal but production-grade Next.js application for creating Bitcoin Ordinals inscriptions.

## Features

- **Multi-wallet Support**: Connect using LaserEyes wallet connector
- **Simple UI**: Clean, dark-themed interface for creating inscriptions
- **OrdinalsBot Integration**: Create inscription orders via OrdinalsBot API
- **PSBT Signing**: Sign transactions with connected wallet
- **Transaction Broadcasting**: Broadcast signed transactions to Bitcoin network

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- LaserEyes (Bitcoin wallet connector)
- OrdinalsBot API
- Mempool.space API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Bitcoin wallet (Unisat, Xverse, etc.)
- OrdinalsBot API key (optional, for production)
- Maestro or Sandshrew API key (optional, for data provider)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```env
# OrdinalsBot API (optional)
ORDINALSBOT_API_KEY=your_api_key_here
ORDINALSBOT_API_URL=https://api.ordinalsbot.com

# Bitcoin data provider (choose one)
MAESTRO_API_KEY=your_maestro_api_key
# OR
SANDSHREW_API_KEY=your_sandshrew_api_key

# Network
NEXT_PUBLIC_NETWORK=mainnet
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with LaserEyes provider
│   ├── page.tsx            # Main inscription page
│   └── globals.css         # Global styles
├── components/
│   ├── wallet/
│   │   └── WalletConnectButton.tsx
│   └── inscriptions/
│       ├── InscriptionForm.tsx
│       └── InscriptionStatus.tsx
└── lib/
    ├── bitcoin/
    │   ├── ordinalsbot.ts  # OrdinalsBot API client (TODO)
    │   ├── broadcast.ts    # Transaction broadcasting (TODO)
    │   └── types.ts        # TypeScript types
    ├── utils.ts            # Utility functions
    └── env.ts              # Environment variable validation
```

## TODO

The following components need implementation:

1. **OrdinalsBot Integration** (`src/lib/bitcoin/ordinalsbot.ts`):
   - `createInscriptionOrder()` - Create order with file/text content
   - `getOrderStatus()` - Poll for order status
   - `buildPSBT()` - Request PSBT after deposit confirmation

2. **Transaction Broadcasting** (`src/lib/bitcoin/broadcast.ts`):
   - `broadcastTransaction()` - Broadcast signed transaction

3. **Inscription Flow** (`src/components/inscriptions/InscriptionForm.tsx`):
   - Complete the inscription workflow
   - Handle PSBT signing with LaserEyes
   - Poll for transaction confirmation

## License

MIT

