"use client"

import { ChevronDownIcon, WalletIcon } from "lucide-react"
import { Suspense } from "react"
import type { ChainId, WalletAccount } from "@/lib/reactive-dot/custom-types"
import { ButtonSkeleton } from "../layout/skeletons"
import { Button } from "../ui/button-extended"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { AccountBalance } from "./account-balance"
import { AccountSelect } from "./account-select"
import { ChainSelect } from "./chain-select"
import { MapAccountButton } from "./map-account-button"

interface WalletDropdownProps {
  account: WalletAccount | undefined
  setAccount: (account: WalletAccount | undefined) => void
  chainId: ChainId
  setChainId: (chainId: ChainId) => void
}

export function WalletDropdown({ account, setAccount, chainId, setChainId }: WalletDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <WalletIcon className="h-4 w-4" />
          {account ? account.name : "Connect Wallet"}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-full p-4">
        <div className="w-full space-y-4">
          {/* Account Selection */}
          <div className="w-full space-y-2">
            <Suspense fallback={<ButtonSkeleton />}>
              <AccountSelect account={account} setAccount={setAccount} />
            </Suspense>
          </div>

          {/* Chain Selection */}
          <div className="space-y-2">
            <Suspense fallback={<ButtonSkeleton />}>
              <ChainSelect chainId={chainId} setChainId={setChainId} />
            </Suspense>
          </div>

          {account && (
            <>
              <DropdownMenuSeparator className="my-4" />

              {/* Account Balance */}
              <div className="space-y-2">
                <Suspense
                  fallback={<div className="text-muted-foreground text-sm">Loading...</div>}
                >
                  <AccountBalance />
                </Suspense>
              </div>

              {/* Map Account Button */}
              <div className="space-y-2">
                <Suspense>
                  <MapAccountButton />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
