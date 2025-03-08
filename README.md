# CoinLock - Sui Blockchain

A simple dApp that allows users to lock their SUI coins for a specified duration.

> **Note**: The current smart contracts are deployed on Sui testnet. To interact with the dApp, make sure your wallet is connected to testnet. If you deploy your own contracts, you'll need to update the contract address and other variables in the frontend code accordingly.

## Features

- Lock SUI coins for custom durations (30 minutes to 1 day)
- Add optional notes to locked coins
- View all locked coins in a clean interface
- Withdraw coins after lock period expires
- Wallet integration with Sui

## Project Structure

```
├── contracts/           # Smart contract code
│   └── coin_lock/      # Move smart contract
├── frontend/           # React frontend application
│   └── coin_lock/      # Frontend code
```

## Getting Started

### Prerequisites

- [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil) (browser extension)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/installation)
- [Sui CLI](https://docs.sui.io/build/install)

### Smart Contract Setup

1. Navigate to the contract directory:

```bash
cd contracts/coin_lock
```

2. Build the contract:

```bash
sui move build
```

3. Run the tests:

```bash
sui move test
```

4. Deploy the contract:

```bash
sui client publish --gas-budget 10000000
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend/coin_lock
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm dev
```

4. Open your browser and visit `http://localhost:5173`

## Usage

1. Connect your Sui wallet
2. Click "Lock Coin" button
3. Enter the amount of SUI to lock
4. Select lock duration
5. Add an optional note
6. Confirm the transaction
7. Wait for the lock period to expire
8. Click "Withdraw" to retrieve your coins

## Learning Outcomes

Building this project provided hands-on experience with several key aspects of Sui blockchain development:

### 1. Sui CLI and Development Environment

- Setting up and configuring the Sui development environment
- Working with Sui CLI for building, testing, and deploying smart contracts
- Managing different networks (testnet/mainnet) and accounts

### 2. Move Smart Contract Development

- Writing and testing Move smart contracts
- Understanding Move's object-centric programming model
- Working with advanced Move features:
  - Dynamic fields for flexible data storage
  - Object capabilities and ownership
  - Custom types and structs
  - Error handling and assertions

### 3. Frontend Development with Sui

- Integrating Sui dApp Kit for blockchain interactions
- Managing wallet connections and transactions
- Building responsive UIs for blockchain applications
- Handling blockchain events and state updates
- Working with Sui JSON-RPC API through dapp Kit for blockchain data retrieval and interaction
- Building complex transactions using Programmable Transaction Blocks (PTBs) for operations like:
  - Merging coins
  - Splitting coins
  - Combining multiple operations in a single transaction
