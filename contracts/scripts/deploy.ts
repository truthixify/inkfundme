import { contracts } from "@polkadot-api/descriptors"
import { FixedSizeBinary } from "polkadot-api"
import { deployContract } from "./utils/deploy-contract"
import { initApi } from "./utils/init-api"
import { writeAddresses } from "./utils/write-addresses"

/**
 * This script initializes the Polkadot API client and deploys the contract
 * using the provided utilities under './utils'.
 *
 * @options
 *  Environment variables:
 *    CHAIN         - Target chain to deploy the contract to (must be initialized with `bunx papi add <chain>`). Default: `dev`
 *    ACCOUNT_URI   - Account to deploy the contract from. If not set, uses `.env.{CHAIN}` or defaults to `//Alice`
 *    DIR           - Directory to write the contract addresses to. Default: `./deployments`
 *
 * @example
 * CHAIN=dev bun run deploy.ts
 */
const main = async () => {
  const initResult = await initApi()

  const deployTokenResult = await deployContract(
    initResult,
    "token",
    contracts.inkfundme_token,
    "new",
    {
      name: "INKFUNDME",
      symbol: "IFM",
      decimals: 0,
      initial_supply: [1000000000000n, 0n, 0n, 0n],
    },
  )

  const deployInkFundMeResult = await deployContract(
    initResult,
    "inkfundme",
    contracts.inkfundme,
    "new",
    {
      token_address: FixedSizeBinary.fromHex(deployTokenResult.evmAddress),
    },
  )

  await writeAddresses({ token: deployTokenResult, inkFundMe: deployInkFundMeResult })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
