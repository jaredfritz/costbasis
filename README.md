# Crypto Tax Calculator

Calculate your cryptocurrency cost basis from Crypto.com and Coinbase transactions. Generate Form 8949 entries for your tax return.

## Features

- **CSV Import**: Upload transaction history from Crypto.com and Coinbase
- **FIFO Calculation**: Automatically calculates cost basis using First In, First Out method
- **Form 8949 Generation**: Creates IRS-compatible entries for your tax return
- **Tax Software Guides**: Step-by-step instructions for FreeTaxUSA, TurboTax, and H&R Block
- **Privacy First**: All calculations happen in your browser - no data is sent to servers

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Navigate to the project directory
cd crypto-tax-calculator

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Accept the disclaimer** - Read and accept the terms before using the calculator
2. **Select your tax year** - Choose the tax year you want to calculate
3. **Upload your CSV files** - Drag and drop or click to upload transaction history files
4. **Review results** - See your calculated gains/losses summary
5. **Generate Form 8949** - Download or print your Form 8949 entries
6. **Follow the guide** - Use the step-by-step instructions for your tax software

## Getting Your CSV Files

### Crypto.com
1. Open the Crypto.com app
2. Go to Accounts → Transaction History
3. Click Export and select your date range
4. Download the CSV file

### Coinbase
1. Log in to Coinbase on the web
2. Go to Settings → Taxes
3. Click "Generate Report"
4. Download the CSV file

## Supported Transaction Types

- Buy/Sell transactions
- Crypto-to-crypto trades
- Rewards and staking income
- Dust conversions

## Limitations

- Uses FIFO method only (no LIFO or Specific ID)
- May not handle complex DeFi transactions correctly
- Requires complete transaction history for accurate cost basis
- Does not account for wash sale rules

## Disclaimer

**This calculator provides informational estimates only and does not constitute tax, legal, or financial advice.** You are solely responsible for the accuracy of your tax return. Consult a qualified tax professional for guidance specific to your situation.

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [PapaParse](https://www.papaparse.com/) - CSV parsing
- [date-fns](https://date-fns.org/) - Date utilities
- [Lucide React](https://lucide.dev/) - Icons

## License

MIT
