---
title: Building a Crowdfunding dApp with Ink!FundMe and React/Next.js
---

![Crowdfunding Title Picture](/img/title/crowdfunding.svg)

# Building a Crowdfunding dApp with Ink! Smart Contracts and React/Next.js

Hi there! In this tutorial, I’ll guide you through building a decentralized crowdfunding platform from the ground up. Think of it as us coding together over a coffee. I’ll explain each step, highlight important choices, and make sure you understand not just how but also why we’re doing things. If some parts feel challenging, don’t worry, just follow along and everything will click as we go.

We’ll be working with the Ink!FundMe smart contract on the Passet Hub testnet, using the Polkadot API (PAPI). To get started quickly, we’ll base our project on the Inkathon boilerplate. By the end, you’ll have a working dApp where users can create campaigns, make contributions, and explore more advanced features. You can grab the starter code here: [inkfundme](https://github.com:truthixify/inkfundme.git).

---

## Project Overview  

We’ll be building **Ink!FundMe**, a crowdfunding dApp powered by ink! contracts and a React/Next.js frontend.  

At a high level, the project consists of:  
- **Ink! smart contract**: Defines campaigns, tracks contributions, and enforces rules.  
- **React/Next.js frontend**: Lets users create and explore campaigns through a modern interface.  
- **Polkadot API (PAPI)**: Connects the contract to the frontend.  
- **Netlify hosting**: Makes the app accessible to anyone.  

Picture this: users can launch campaigns for causes they care about, while contributors browse, donate, and track progress. The smart contract guarantees transparent rules, and the frontend makes the experience intuitive.  

---

## Prerequisites  

Before starting, make sure you have these installed:  

- **Rust/ink!** – for writing and compiling smart contracts.  
- **React/Next.js** – for the frontend.  
- **TypeScript** – for type-safe frontend development.  
- **Node.js (v18 or later)** – required runtime for Next.js.  
- **Bun** – package manager and dev server.  
- **Pop CLI** – tool for compiling and deploying ink! contracts.  
- **Polkadot.js extension** – browser wallet for interacting with the testnet.  
- **GitHub** – for managing the repo.  
- **Netlify** – to host the frontend.  

👉 If you’re missing any, install them before continuing.  

---

## Diving into the Smart Contract

### Token Contract Integration

The Ink!FundMe contract integrates with an ERC20 token contract (`INKFUNDME`) for all financial transactions, ensuring modularity and reusability. Key features of the token contract include:
- **Standard ERC20 Functions**: `transfer`, `transferFrom`, `approve`, and `allowance`.
- **Minting**: A `mint` function for distributing test tokens via a faucet.
- **Events**: Emits `Transfer` and `Approval` events for off-chain tracking.
- **Access Control**: In production, the `mint` function should include access controls.

The token contract is deployed separately, and its address is passed to Ink!FundMe during initialization.

### Core Data Structures

#### Campaign Structure

```rust
#[derive(Clone, Debug, PartialEq, Eq)]
#[ink::scale_derive(Encode, Decode, TypeInfo)]
#[cfg_attr(feature = "std", derive(StorageLayout))]
pub struct Campaign {
    pub id: u32,                  // Unique campaign identifier
    pub title: String,            // Campaign title
    pub description: String,      // Detailed campaign description
    pub goal: U256,               // Funding goal in tokens
    pub deadline: u64,            // Campaign end timestamp
    pub owner: Address,           // Campaign creator's address
    pub raised: U256,             // Total funds raised
    pub completed: bool,          // Whether the campaign is finalized
}
```

**Design Choices**:
- `U256` for token amounts ensures compatibility with EVM standards and handles large numbers.
- `deadline` uses `u64` for Unix timestamps (seconds since epoch).
- `completed` flag prevents multiple finalizations.

#### Contract Storage

```rust
#[ink(storage)]
pub struct InkFundMe {
    token_contract: TokenRef,     // Reference to the ERC20 token contract
    campaigns: StorageVec<Campaign>, // Dynamic array of campaigns
    contributions: Mapping<(u32, Address), U256>, // (campaign_id, contributor) → amount
    next_campaign_id: u32,        // Auto-incrementing campaign ID
}
```

**Storage Optimization**:
- `StorageVec` is gas-efficient for storing campaigns.
- `Mapping` enables constant-time lookups for contributions.
- `next_campaign_id` ensures unique campaign identifiers.

### Key Contract Functions

#### Query Functions

These functions allow the frontend to read campaign and contribution data:

```rust
/// Get campaign details by ID
#[ink(message)]
pub fn get_campaign(&self, campaign_id: u32) -> Result<Campaign> {
    if campaign_id >= self.campaigns.len() {
        return Err(Error::CampaignNotFound);
    }
    Ok(self.campaigns.get(campaign_id).unwrap())
}

/// Get all campaigns
#[ink(message)]
pub fn get_all_campaigns(&self) -> Vec<Campaign> {
    let mut campaigns = Vec::new();
    for i in 0..self.campaigns.len() {
        if let Some(campaign) = self.campaigns.get(i) {
            campaigns.push(campaign);
        }
    }
    campaigns
}

/// Get contributor's contribution amount for a specific campaign
#[ink(message)]
pub fn get_contribution(&self, campaign_id: u32, contributor: Address) -> U256 {
    self.contributions.get((campaign_id, contributor)).unwrap_or_default()
}

/// Get the ERC20 token address
#[ink(message)]
pub fn get_token_address(&self) -> AccountId {
    self.token_contract.account_id()
}

/// Get total number of campaigns
#[ink(message)]
pub fn get_campaign_count(&self) -> u32 {
    self.campaigns.len() as u32
}
```

#### Campaign Creation

```rust
#[ink(message)]
pub fn create_campaign(
    &mut self,
    title: String,
    description: String,
    goal: U256,
    deadline: u64,
) -> Result<u32> {
    if goal == U256::zero() || deadline <= self.env().block_timestamp() {
        return Err(Error::InvalidParameters);
    }
    let campaign_id = self.next_campaign_id;
    let owner = self.env().caller();
    let campaign = Campaign {
        id: campaign_id,
        title,
        description,
        goal,
        deadline,
        owner,
        raised: U256::zero(),
        completed: false,
    };
    self.campaigns.push(&campaign);
    self.next_campaign_id += 1;
    self.env().emit_event(CampaignCreated { id: campaign_id, owner, goal, deadline });
    Ok(campaign_id)
}
```

**Security Considerations**:
- Validates inputs to prevent invalid campaigns.
- Uses `env().caller()` for ownership tracking.

#### Contributing to a Campaign

```rust
#[ink(message, payable)]
pub fn contribute(&mut self, campaign_id: u32, amount: U256) -> Result<()> {
    let campaign = self.get_campaign_mut(campaign_id)?;
    let caller = self.env().caller();
    if campaign.completed {
        return Err(Error::CampaignCompleted);
    }
    if self.env().block_timestamp() > campaign.deadline {
        return Err(Error::DeadlineReached);
    }
    self.token_contract.transfer_from(caller, self.env().account_id(), amount)?;
    campaign.raised = campaign.raised.checked_add(amount).ok_or(Error::Overflow)?;
    let contribution = self.contributions.get((campaign_id, caller)).unwrap_or(U256::zero());
    self.contributions.insert((campaign_id, caller), &(contribution + amount));
    self.env().emit_event(ContributionMade { campaign_id, contributor: caller, amount });
    Ok(())
}
```

**Key Features**:
- Uses checks-effects-interactions pattern for reentrancy protection.
- Employs safe math to prevent overflows.
- Emits events for off-chain tracking.

#### Finalizing a Campaign

```rust
#[ink(message)]
pub fn finalize(&mut self, campaign_id: u32) -> Result<()> {
    let campaign = self.get_campaign_mut(campaign_id)?;
    if self.env().caller() != campaign.owner {
        return Err(Error::OnlyOwner);
    }
    if campaign.completed {
        return Err(Error::CampaignCompleted);
    }
    if self.env().block_timestamp() <= campaign.deadline {
        return Err(Error::DeadlineNotReached);
    }
    campaign.completed = true;
    let success = campaign.raised >= campaign.goal;
    if success {
        self.token_contract.transfer(campaign.owner, campaign.raised)?;
    }
    self.env().emit_event(CampaignFinalized { campaign_id, success });
    Ok(())
}
```

**Patterns Used**:
- Access control via owner checks.
- State machine pattern for campaign lifecycle.
- Event-driven architecture for updates.

#### Claiming a Refund

```rust
#[ink(message)]
pub fn claim_refund(&mut self, campaign_id: u32) -> Result<()> {
    let campaign = self.get_campaign_mut(campaign_id)?;
    let caller = self.env().caller();
    if !campaign.completed {
        return Err(Error::CampaignNotCompleted);
    }
    if campaign.raised >= campaign.goal {
        return Err(Error::CampaignSuccessful);
    }
    let contribution = self.contributions.get((campaign_id, caller)).unwrap_or(U256::zero());
    if contribution == U256::zero() {
        return Err(Error::NoContribution);
    }
    self.contributions.insert((campaign_id, caller), &U256::zero());
    self.token_contract.transfer(caller, contribution)?;
    self.env().emit_event(RefundClaimed { campaign_id, contributor: caller, amount: contribution });
    Ok(())
}
```

**Security Considerations**:
- Ensures campaign is completed and unsuccessful before allowing refunds.
- Verifies contributor has a non-zero contribution.
- Clears contribution record after refund to prevent double-claiming.

---

## Getting Started

### 1. Set Up the Inkathon Boilerplate

Clone the Ink!FundMe repository, based on the Inkathon boilerplate:

```bash
git clone git@github.com:truthixify/inkfundme.git
cd inkfundme
bun install
```

The project structure includes:
- `contracts/`: Ink!FundMe and ERC20 token contracts, plus deployment scripts.
- `frontend/`: React/Next.js app for contract interaction.

Start the development server:

```bash
bun run dev
```

This launches the frontend at `http://localhost:3000`.

### 2. Deploy the Contracts

The repository includes a deployment script (`contracts/scripts/deploy.ts`) to deploy the ERC20 token and Ink!FundMe contracts. If using pre-deployed contracts, skip to the frontend configuration.

#### Deployment Script

The `deploy.ts` script automates contract deployment:

```typescript
import { contracts } from "@polkadot-api/descriptors";
import { deployContract } from "./utils/deploy-contract";
import { initApi } from "./utils/init-api";
import { writeAddresses } from "./utils/write-addresses";
import { type FixedSizeBinary } from "polkadot-api";

const main = async () => {
  const initResult = await initApi();
  const deployTokenResult = await deployContract(initResult, "token", contracts.inkfundme_token, "new", {
    name: "INKFUNDME",
    symbol: "IFM",
    decimals: 0,
    initial_supply: [1000000000000n, 0n, 0n, 0n],
  });
  const deployInkFundMeResult = await deployContract(initResult, "inkfundme", contracts.inkfundme, "new", {
    token_address: FixedSizeBinary.fromHex(deployTokenResult.evmAddress),
  });
  await writeAddresses({ token: deployTokenResult, inkFundMe: deployInkFundMeResult });
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => process.exit(0));
```

**Key Features**:
- **Initialization**: Connects to the target chain (e.g., Passet Hub or `dev`) via `initApi`.
- **Token Deployment**: Deploys the ERC20 token with name `INKFUNDME`, symbol `IFE`, 0 decimals, and 1 trillion tokens.
- **Ink!FundMe Deployment**: Deploys Ink!FundMe, linking it to the token contract.
- **Address Storage**: Saves EVM and SS58 addresses to `contracts/deployments/`.
- **Environment Variables**:
  - `CHAIN`: Target chain (default: `dev`).
  - `ACCOUNT_URI`: Deployment account (default: `//Alice` or `.env.<chain>` or `.env`).
  - `DIR`: Output directory for deployment files (default: `./deployments`).

**Usage**:
1. Build contracts and generate TypeScript bindings:
   ```bash
   cd contracts
   bun run build
   bun run codegen
   ```
2. Fund your account with test tokens using the [Passet Hub Faucet](https://faucet.polkadot.io/?parachain=1111).

3. Configure your .env like this:
   ```bash
   ACCOUNT_URL=your-account-uri
   CHAIN=passetHub
   ```

4. Add passetHub RPC
   ```bash
   bunx papi add -w wss://testnet-passet-hub.polkadot.io passetHub
   ```

5. Deploy:
   ```bash
   bun run deploy
   ```

**Example Output**:
```bash
✔ Initialized chain 'passethub' with account '5Grw...'
✔ Deployed contract 'token' at address '5GRs...' (0xc113f...)
✔ Deployed contract 'inkfundme' at address '5HkH...' (0xfb5e...)
✔ Exported deployment info to 'deployments/token/passethub.ts'
✔ Exported deployment info to 'deployments/inkfundme/passethub.ts'
```

#### Configure the Frontend

Update `frontend/src/lib/inkathon/deployments.ts` with the deployed addresses:

```typescript
import { contracts } from "@polkadot-api/descriptors";
import * as inkFundMePassetHub from "@inkathon/contracts/deployments/inkfundme/dev";
import * as tokenPassetHub from "@inkathon/contracts/deployments/token/dev";

export const token = {
  contract: contracts.inkfundme_token,
  evmAddresses: { passethub: tokenPassetHub.evmAddress },
  ss58Addresses: { passethub: tokenPassetHub.ss58Address },
};

export const inkFundMe = {
  contract: contracts.inkfundme,
  evmAddresses: { passethub: inkFundMePassetHub.evmAddress },
  ss58Addresses: { passethub: inkFundMePassetHub.ss58Address },
};
```

---

## Building the Frontend

### Project Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js app router
│   │   ├── campaign/         # Campaign detail pages
│   │   └── page.tsx          # Home page
│   ├── components/
│   │   ├── layout/           # Layout components
│   │   ├── ui/               # Shadcn UI components
│   │   └── web3/             # Web3-specific components
│   ├── hooks/                # Custom React hooks
│   └── lib/
│       ├── inkathon/         # Contract ABIs and deployments
│       └── utils/            # Utility functions
└── public/                   # Static assets
```

### Interacting with the Contract

Now comes the fun part—**connecting the frontend to your FundMe contract**.  

The structure is straightforward:  
- `app/pages` → route-based pages  
- `components` → reusable UI elements  
- `hooks` → blockchain interaction helpers  
- `utils` → formatting, address handling, and other helpers  

For blockchain interactions, we rely on hooks like:  
- `useTypedApi` → access the Polkadot API (PAPI)  
- `useChainId` → detect the active chain  
- `useSignerAndAddress` → access the connected wallet and signer  

The frontend itself uses **`@polkadot/api`** together with React hooks to handle contract interaction.  

:::note  
For queries that **just display data** (like the funding goal or total raised), you don’t actually need a wallet connection. However, because ink! contract `.query` calls require an `origin`, you’ll often run into cases where the signer address isn’t available yet.  

To work around this, you can:  
1. Use **Alice (`//Alice`)** as a default pre-mapped account for queries.  
2. Or skip `.query` entirely and fetch state directly from storage.  
:::  

---

### Querying Contract Data  

There are two main ways to read contract state:  

#### **Option 1: Query Storage Directly (Simple & Read-Only)**  

Best for global values that don’t depend on a user account:  

```ts
// Query storage directly
const storageResult = await contract.getStorage().getRoot()
const newState = storageResult.success ? storageResult.value : undefined
setFundMeState(newState)

#### 1. Querying Campaigns (Storage Query)

Fetch all campaigns directly from storage:

```typescript
const [campaigns, setCampaigns] = useState<Campaign[]>();
const api = useTypedApi();
const chain = useChainId();

const fetchCampaigns = useCallback(async () => {
  if (!api || !chain) return;
  const sdk = createReviveSdk(api as ReviveSdkTypedApi, inkFundMe.contract);
  const contract = sdk.getContract(inkFundMe.evmAddresses[chain]);
  const storageResult = await contract.getStorage().getRoot();
  if (storageResult.success) {
    setCampaigns(storageResult.value.campaigns);
  }
}, [api, chain]);
```

#### 2. Querying Contributions (Message Call)

Fetch a user's contribution to a campaign:

```typescript
const { signerAddress } = useSignerAndAddress();
const api = useTypedApi()
const chain = useChainId()
const [contribution, setContribution] = useState<FixedSizeArray<4, bigint>>();

const fetchContribution = useCallback(async (campaignId: number) => {
  if (!api || !chain || !signerAddress) return;
  const sdk = createReviveSdk(api as ReviveSdkTypedApi, inkFundMe.contract);
  const contract = sdk.getContract(inkFundMe.evmAddresses[chain]);
  const isMapped = await sdk.addressIsMapped(signerAddress);
  if (!isMapped) {
    toast.error("Account not mapped. Please map your account first.");
    return;
  }
  const result = await contract.query("get_contribution", {
    origin: signerAddress,
    data: { campaign_id: campaignId, contributor: ss58ToEthereum(signerAddress) },
  });
  if (result.success) {
    setContribution(result.value.response);
  }
}, [api, chain, signerAddress]);
```

#### 3. Creating a Campaign

```typescript
export function CreateCampaignForm({ onCampaignCreated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", goal: "", deadline: "" });
  const api = useTypedApi();
  const chain = useChainId();
  const { signer, signerAddress } = useSignerAndAddress();

  const handleCreateCampaign = useCallback(async () => {
    if (!api || !chain || !signer || !signerAddress) return toast.error("Connect wallet.");
    setIsLoading(true);
    try {
      const sdk = createReviveSdk(api as ReviveSdkTypedApi, inkFundMe.contract);
      const contract = sdk.getContract(inkFundMe.evmAddresses[chain]);
      const goalU256 = [BigInt(Math.floor(Number(formData.goal))), 0n, 0n, 0n];
      const deadlineTimestamp = BigInt(Math.floor(new Date(formData.deadline).getTime() / 1000));
      const tx = contract.send("create_campaign", {
        origin: signerAddress,
        data: { title: formData.title, description: formData.description, goal: goalU256, deadline: deadlineTimestamp },
      }).signAndSubmit(signer);
      await tx; // Simplified; full promise handling in repo
      onCampaignCreated();
      toast.success("Campaign created!");
    } catch (error) {
      toast.error("Failed to create.");
    } finally {
      setIsLoading(false);
    }
  }, [api, chain, signer, signerAddress, formData, onCampaignCreated]);

  // Form UI: Inputs for title, desc, goal, deadline, and Create button
  // Full JSX in repo
}
```

#### 4. Contributing to a Campaign

```typescript
const handleContribute = useCallback(async () => {
  if (!api || !chain || !signer || !signerAddress || !contributionAmount) return;
  setIsContributing(true);
  try {
    const sdk = createReviveSdk(api as ReviveSdkTypedApi, inkFundMe.contract);
    const contract = sdk.getContract(inkFundMe.evmAddresses[chain]);
    const amountBig = BigInt(Math.round(Number(contributionAmount) * 10 ** tokenInfo.decimals));
    const amountU256 = [amountBig, 0n, 0n, 0n];
    const tx = contract.send("contribute", {
      origin: signerAddress,
      data: { campaign_id: campaignId, amount: amountU256 },
    }).signAndSubmit(signer);
    await tx;
    toast.success("Contributed!");
  } catch (error) {
    toast.error("Failed.");
  } finally {
    setIsContributing(false);
  }
}, [api, chain, signer, signerAddress, contributionAmount, campaignId, tokenInfo]);
```

#### 5. Finalizing and Refunding
The finalization and refund follows similar patterns to contribute. Check repo for `handleFinalize` and `handleClaimRefund`. They send `finalize` or `claim_refund` with `campaign_id`.

#### 6. Example Component: ContractCard

A card listing campaigns (simplified):

```typescript
export function ContractCard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // ... hooks

  // fetchCampaigns as above

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  if (isLoading) return <CardSkeleton />;

  return (
    <Card>
      <CardHeader><CardTitle>Ink!FundMe Campaigns</CardTitle></CardHeader>
      <Table>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell>{campaign.title}</TableCell>
              <TableCell>{campaign.raised[0].toString()} / {campaign.goal[0].toString()} IFE</TableCell>
              <TableCell>
                {/* Input and Contribute button, wired to handleContribute */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
```

---

## Deployment to Netlify

To share your dApp, deploy the frontend to Netlify:

1. **Build the Frontend**:
   ```bash
   cd frontend
   bun run build
   bun run export
   ```
   This generates a static site in `frontend/out/`.

2. **Deploy to Netlify**:
   - Sign in to [Netlify](https://www.netlify.com/) and select "New site from Git."
   - Connect your GitHub account and choose the `truthixify/inkfundme` repository.
   - Set build settings:
     - Build command: `cd frontend && bun run build && bun run export`
     - Publish directory: `frontend/out`
   - Deploy the site. Netlify provides a URL (e.g., `https://inkfundme.netlify.app`).

3. **Test the Deployed App**:
   - Visit the Netlify URL and connect your Polkadot.js wallet.
   - Verify interaction with the Passet Hub testnet.
  
---

### Next Steps and Challenges

Enhance the dApp with:
### 1. Gas Optimization  

- **Batch Operations**: Process multiple contributions in one transaction.  
- **Storage Optimization**: Use `Lazy` for large or rarely accessed data structures.  
- **Event Indexing**: Implement custom indexing for efficient off-chain querying.  

### 2. Security Considerations  

- **Reentrancy Protection**: Follow the **checks → effects → interactions** pattern.  
- **Access Control**: Implement role-based access controls to restrict sensitive operations.  
- **Input Validation**: Validate all external inputs (amounts, addresses, asset IDs).  
- **Error Handling**: Return clear errors without exposing internal logic.  

3. **Multi-Asset Support**:
   - Update `Campaign` to support multiple assets:
     ```rust
     #[derive(Clone, Debug, PartialEq, Eq)]
     #[ink::scale_derive(Encode, Decode, TypeInfo)]
     pub struct Asset {
         pub asset_id: u32,            // 0 for native token, >0 for Asset Hub assets
         pub min_contribution: Balance, // Minimum contribution
         pub max_contribution: Option<Balance>, // Optional max contribution
     }
     #[derive(Clone, Debug, PartialEq, Eq)]
     #[ink::scale_derive(Encode, Decode, TypeInfo)]
     pub struct Campaign {
         // Existing fields...
         pub accepted_assets: Vec<Asset>, // List of accepted assets
         pub goals: Mapping<u32, Balance>, // Asset ID to target amount
     }
     ```
   - Add asset selection in the frontend.
   - Integrate price oracles for value conversion.

4. **Enhanced Features**:
   - Add milestone-based funding.
   - Implement vesting schedules for fund releases.
   - Add social sharing and IPFS for campaign media.

5. **Improved UX**:
   - Add pagination, search, and sorting for campaigns.
   - Display detailed campaign pages with progress bars.

6. **Testing and Auditing**:
   - Write comprehensive unit and integration tests.
   - Perform security audits and fuzz testing.

## Resources

- [Ink! Documentation](https://use.ink/)
- [Inkathon Docs](https://docs.inkathon.xyz/)
- [Inkathon GitHub](https://github.com/scio-labs/inkathon)
- [PAPI ink-sdk](https://papi.how/sdks/ink-sdk)
- [ReactiveDOT](https://reactivedot.dev/)
- [Polkadot.js API](https://polkadot.js.org/docs/api/)
- [Source Code](https://github.com/truthixify/inkfundme)
- [Live Demo](https://inkfundme.netlify.app) (Replace with your Netlify URL)

---

## Conclusion  

Congratulations! You’ve built a decentralized crowdfunding dApp powered by ink! smart contracts and a modern React/Next.js frontend. You can now create campaigns, contribute to them, and view progress — all secured by the blockchain.  

But this is just the beginning. Try extending the project with multi-asset support, better UX, or advanced security patterns. Contribute your version to the community, share your learnings, and help grow the ink! ecosystem.  

Happy coding, and see you on-chain 🚀  
