import { contracts } from "@polkadot-api/descriptors"

// import * as flipperPassethub from "contracts/deployments/flipper/passethub"
// import * as flipperPop from "contracts/deployments/flipper/pop"
// import * as flipperDev from "contracts/deployments/flipper/dev"

import * as inkFundMeDev from "contracts/deployments/inkfundme/dev"
// import * as tokenPassethub from "contracts/deployments/flipper/passethub"
// import * as flipperPop from "contracts/deployments/flipper/pop"
import * as tokenDev from "contracts/deployments/token/dev"

export const token = {
  contract: contracts.token,
  evmAddresses: {
    dev: tokenDev.evmAddress,
    // pop: flipperPop.evmAddress,
    // passethub: flipperPassethub.evmAddress,
    // Add more deployments here
  },
  ss58Addresses: {
    dev: tokenDev.ss58Address,
    // pop: flipperPop.ss58Address,
    // passethub: flipperPassethub.ss58Address,
    // Add more deployments here
  },
}

export const inkFundMe = {
  contract: contracts.inkfundme,
  evmAddresses: {
    dev: inkFundMeDev.evmAddress,
    // pop: flipperPop.evmAddress,
    // passethub: flipperPassethub.evmAddress,
    // Add more deployments here
  },
  ss58Addresses: {
    dev: inkFundMeDev.ss58Address,
    // pop: flipperPop.ss58Address,
    // passethub: flipperPassethub.ss58Address,
    // Add more deployments here
  },
}

export const deployments = {
  token,
  inkFundMe,
  // Add more contracts here
}
