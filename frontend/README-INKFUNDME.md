# InkFundMe Frontend Integration

This document explains the frontend integration for the InkFundMe crowdfunding platform built with ink! smart contracts.

## Overview

The frontend provides a complete interface for interacting with the InkFundMe smart contracts, including:

- **Token Management**: View token information and mint tokens via faucet
- **Campaign Creation**: Create new fundraising campaigns
- **Campaign Browsing**: View all active and completed campaigns
- **Progress Tracking**: Real-time campaign progress visualization
- **Wallet Integration**: Connect and interact with Polkadot wallets

## Components

### ContractCard (`/components/web3/contract-card.tsx`)

The main component that displays:

- **Token Information**: Name, symbol, decimals, total supply, user balance
- **Contract Details**: Addresses, compiler info, campaign count
- **Campaign List**: All campaigns with progress bars and status badges
- **Faucet Functionality**: Mint tokens for testing

### CreateCampaignForm (`/components/web3/create-campaign-form.tsx`)

Form component for creating new campaigns with:

- Campaign title and description
- Funding goal (in tokens)
- Deadline selection
- Form validation and error handling

## Key Features

### 1. Token Integration

```typescript
// Query token information
const tokenInfo = await contract.query("name", {})
const balance = await contract.query("balance_of", { owner: userAddress })

// Mint tokens (faucet)
const tx = contract.send("mint_faucet", { amount: tokenAmount })
```

### 2. Campaign Management

```typescript
// Create campaign
const tx = contract.send("create_campaign", {
    title: "Campaign Title",
    description: "Campaign Description",
    goal: goalAmount, // U256 format
    deadline: timestampBigInt,
})

// Get all campaigns
const campaigns = await contract.query("get_all_campaigns", {})
```

### 3. Real-time Updates

The interface automatically refreshes data after transactions:

- Campaign creation triggers data refresh
- Token minting updates balances
- Progress bars update in real-time

### 4. Data Formatting

Helper functions handle complex data types:

```typescript
// Format U256 token amounts
const formatTokenAmount = (amount: bigint[], decimals: number): string => {
    const value = amount[0] || 0n
    const divisor = 10n ** BigInt(decimals)
    return (value / divisor).toString()
}

// Format addresses for display
const formatAddress = (address: Uint8Array): string => {
    const hex = Array.from(address)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    return `0x${hex.slice(0, 6)}...${hex.slice(-4)}`
}
```

## UI Components

### Progress Visualization

Campaigns display progress with:

- Progress bars showing funding percentage
- Status badges (Active, Expired, Successful, Failed)
- Formatted amounts and deadlines

### Responsive Design

- Grid layouts for campaign information
- Mobile-friendly card designs
- Accessible form controls

## Error Handling

Comprehensive error handling for:

- Wallet connection issues
- Transaction failures
- Contract query errors
- Form validation errors

## Usage

### 1. Connect Wallet

Users must connect their Polkadot wallet to interact with contracts.

### 2. Get Test Tokens

Click "Mint Tokens (Faucet)" to get test tokens for contributing to campaigns.

### 3. Create Campaign

Fill out the campaign form with:

- Descriptive title and description
- Realistic funding goal
- Future deadline date

### 4. View Campaigns

Browse all campaigns with:

- Real-time progress tracking
- Status indicators
- Owner and deadline information

## Technical Details

### Contract Integration

The frontend uses `@polkadot-api/sdk-ink` for contract interactions:

```typescript
const sdk = createReviveSdk(api as ReviveSdkTypedApi, inkFundMe.contract)
const contract = sdk.getContract(inkFundMe.evmAddresses[chain])
```

### Type Safety

TypeScript types are generated from contract metadata:

```typescript
type Campaign = {
    id: number
    title: string
    description: string
    goal: bigint[]
    deadline: bigint
    owner: Uint8Array
    raised: bigint[]
    completed: boolean
}
```

### State Management

React hooks manage component state:

```typescript
const [campaigns, setCampaigns] = useState<Campaign[]>([])
const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
const [queryIsLoading, setQueryIsLoading] = useState(true)
```

## Dependencies

Key dependencies added:

```json
{
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-label": "^2.1.7"
}
```

## Development

### Running the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### Building for Production

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

## Future Enhancements

Potential improvements:

1. **Campaign Contributions**: Add contribution interface
2. **Refund Claims**: Interface for claiming refunds from failed campaigns
3. **Campaign Finalization**: Manual campaign finalization controls
4. **Advanced Filtering**: Filter campaigns by status, deadline, etc.
5. **User Dashboard**: Personal campaign and contribution history
6. **Notifications**: Real-time updates via WebSocket
7. **Multi-token Support**: Support for different ERC20 tokens

## Troubleshooting

### Common Issues

1. **Account Not Mapped**: Users need to map their accounts before transactions
2. **Insufficient Balance**: Users need tokens to contribute to campaigns
3. **Contract Queries Failing**: Check network connection and contract deployment
4. **Transaction Failures**: Verify wallet connection and account permissions

### Debug Mode

Enable debug logging:

```typescript
console.log("Contract query result:", result)
console.log("Transaction status:", tx)
```

## Security Considerations

- All user inputs are validated
- Contract addresses are verified
- Transaction amounts are formatted safely
- Error messages don't expose sensitive information
