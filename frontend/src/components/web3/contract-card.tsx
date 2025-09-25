import { createReviveSdk, type ReviveSdkTypedApi, ss58ToEthereum } from "@polkadot-api/sdk-ink"
import { useChainId, useTypedApi } from "@reactive-dot/react"
import type { FixedSizeArray, FixedSizeBinary } from "polkadot-api"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSignerAndAddress } from "@/hooks/use-signer-and-address"
import { ALICE } from "@/lib/inkathon/constants"
import { inkFundMe, token } from "@/lib/inkathon/deployments"
import { Button } from "../ui/button-extended"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { CampaignCard } from "./campaign-card"
import { CreateCampaignForm } from "./create-campaign-form"

// Types based on the contract descriptors
type Campaign = {
  id: number
  title: string
  description: string
  goal: FixedSizeArray<4, bigint>
  deadline: bigint
  owner: FixedSizeBinary<20>
  raised: FixedSizeArray<4, bigint>
  completed: boolean
}

type TokenInfo = {
  name: string
  symbol: string
  decimals: number
  totalSupply: FixedSizeArray<4, bigint>
}

export function ContractCard() {
  const [queryIsLoading, setQueryIsLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignCount, setCampaignCount] = useState<number>(0)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [activeTab, setActiveTab] = useState("browse")

  const api = useTypedApi()
  const chain = useChainId()
  const { signerAddress } = useSignerAndAddress()

  const userEthAddress = signerAddress ? ss58ToEthereum(signerAddress) : null

  const myCampaigns = useMemo(() => {
    if (!userEthAddress) return []
    return campaigns.filter((c) => c.owner.asHex() === userEthAddress.asHex())
  }, [campaigns, userEthAddress])

  const myCampaignCount = myCampaigns.length

  /**
   * Query InkFundMe Contract Data
   */
  const queryInkFundMeContract = useCallback(async () => {
    if (!api || !chain) return

    try {
      const sdk = createReviveSdk(api as ReviveSdkTypedApi, inkFundMe.contract)
      const contractAddress =
        inkFundMe.evmAddresses[
          chain === "passethub" ? "passetHub" : (chain as keyof typeof inkFundMe.evmAddresses)
        ]
      if (!contractAddress) return
      const contract = sdk.getContract(contractAddress)

      // Get campaign count
      const countResult = await contract.query("get_campaign_count", { origin: ALICE })
      if (countResult.success) {
        setCampaignCount(countResult.value.response)
      }

      // Get all campaigns
      const campaignsResult = await contract.query("get_all_campaigns", { origin: ALICE })
      if (campaignsResult.success) {
        setCampaigns(campaignsResult.value.response)
      }
    } catch (error) {
      console.error("Error querying InkFundMe contract:", error)
    }
  }, [api, chain, signerAddress])

  /**
   * Query Token Contract Data
   */
  const queryTokenContract = useCallback(async () => {
    if (!api || !chain) return

    try {
      const sdk = createReviveSdk(api as ReviveSdkTypedApi, token.contract)
      const contractAddress =
        token.evmAddresses[
          chain === "passethub" ? "passetHub" : (chain as keyof typeof inkFundMe.evmAddresses)
        ]
      if (!contractAddress) return
      const contract = sdk.getContract(contractAddress)

      // Get token info
      const [nameResult, symbolResult, decimalsResult, totalSupplyResult] = await Promise.all([
        contract.query("name", { origin: signerAddress || ALICE }),
        contract.query("symbol", { origin: signerAddress || ALICE }),
        contract.query("decimals", { origin: signerAddress || ALICE }),
        contract.query("total_supply", { origin: signerAddress || ALICE }),
      ])

      if (
        nameResult.success &&
        symbolResult.success &&
        decimalsResult.success &&
        totalSupplyResult.success
      ) {
        setTokenInfo({
          name: nameResult.value.response,
          symbol: symbolResult.value.response,
          decimals: decimalsResult.value.response,
          totalSupply: totalSupplyResult.value.response,
        })
      }
    } catch (error) {
      console.error("Error querying token contract:", error)
    }
  }, [api, chain, signerAddress])

  const queryContracts = useCallback(async () => {
    setQueryIsLoading(true)
    try {
      await Promise.all([queryInkFundMeContract(), queryTokenContract()])
    } catch (error) {
      console.error("Error querying contracts:", error)
    } finally {
      setQueryIsLoading(false)
    }
  }, [queryInkFundMeContract, queryTokenContract])

  useEffect(() => {
    queryContracts()
  }, [queryContracts])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-none">
        <div className="mb-6 flex items-center justify-between">
          <div className="mb-8 max-w-3xl space-y-2">
            <h1 className="mb-6 font-bold text-4xl tracking-tight">Ink!FundMe Campaigns</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A decentralized crowdfunding platform built with{" "}
              <span className="font-semibold">ink!</span> smart contracts. Create campaigns, raise
              funds, and support amazing projects on Polkadot.
            </p>
          </div>
        </div>
        <TabsList className="mb-4">
          <TabsTrigger className="cursor-pointer" value="browse">
            Browse ({campaignCount})
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="my">
            My Campaigns ({myCampaignCount})
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="create">
            Create Campaign
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {campaigns.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="mb-2 font-semibold text-lg">No campaigns yet</h3>
              <p className="mb-6 text-muted-foreground">
                Be the first to create an amazing campaign!
              </p>
              <Button onClick={() => setActiveTab("create")}>Create First Campaign</Button>
            </div>
          ) : (
            <div className="columns-1 gap-8 space-y-8 md:columns-2">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="break-inside-avoid">
                  <CampaignCard campaign={campaign} tokenInfo={tokenInfo} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          {myCampaigns.length === 0 ? (
            <div className="py-12 text-center">
              <h3 className="mb-2 font-semibold text-lg">No campaigns yet</h3>
              <p className="mb-6 text-muted-foreground">
                Create your first campaign to get started!
              </p>
              <Button onClick={() => setActiveTab("create")}>Create First Campaign</Button>
            </div>
          ) : (
            <div className="columns-1 gap-8 space-y-8 md:columns-2">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="break-inside-avoid">
                  <CampaignCard campaign={campaign} tokenInfo={tokenInfo} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <h2 className="mb-2 font-semibold text-2xl">Create New Campaign</h2>
              <p className="text-muted-foreground">
                Launch your project and let the community support your vision.
              </p>
            </div>
            <CreateCampaignForm onCampaignCreated={queryContracts} tokenInfo={tokenInfo} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
