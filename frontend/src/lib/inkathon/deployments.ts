import { contracts } from "@polkadot-api/descriptors"
import * as inkFundMepassetHub from "contracts/deployments/inkfundme/passetHub"
import * as tokenPassetHub from "contracts/deployments/token/passetHub"

export const token = {
  contract: contracts.token,
  evmAddresses: {
    passetHub: tokenPassetHub.evmAddress,
    // Add more deployments here
  },
  ss58Addresses: {
    passetHub: tokenPassetHub.ss58Address,
    // Add more deployments here
  },
}

export const inkFundMe = {
  contract: contracts.inkfundme,
  evmAddresses: {
    passetHub: inkFundMepassetHub.evmAddress,
    // Add more deployments here
  },
  ss58Addresses: {
    passetHub: inkFundMepassetHub.ss58Address,
    // Add more deployments here
  },
}

export const deployments = {
  token,
  inkFundMe,
  // Add more contracts here
}
