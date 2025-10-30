# Metaplex Integration

This project now integrates with Metaplex for Solana NFT operations.

## Features

- **Real Phantom Wallet Connection**: Connects to actual Phantom wallet browser extension
- **NFT Creation**: Creates NFT collections using Metaplex
- **NFT Transfer**: Transfers NFTs between wallets
- **Royalty Distribution**: Distributes SOL royalties to NFT holders
- **Metadata Storage**: Uses Irys (formerly Bundlr) for decentralized metadata storage

## Dependencies

- `@metaplex-foundation/js` - Core Metaplex SDK
- `@solana/web3.js` - Solana Web3 library
- `@solana/wallet-adapter-*` - Wallet adapter packages

## Configuration

- **Network**: Solana Devnet
- **RPC URL**: `https://api.devnet.solana.com`
- **Storage**: Irys Devnet (`https://devnet.irys.xyz`)

## Usage

1. Install Phantom wallet browser extension
2. Connect wallet using the "Connect Wallet" button
3. Create NFT collections in Artist Panel
4. Purchase NFTs in Album view
5. Distribute royalties in Dashboard

## Error Handling

All blockchain operations include proper error handling with user-friendly messages and transaction status tracking.

## Development Notes

- Uses mock data for NFT collections and pricing
- Real blockchain operations require actual SOL on Devnet
- Metadata URIs point to example URLs (should be replaced with actual IPFS/Arweave URLs)
- Royalty distribution currently sends to first fan address only (simplified implementation)
