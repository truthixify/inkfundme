"use client"

import { ChainProvider, ReactiveDotProvider, SignerProvider } from "@reactive-dot/react"
import Link from "next/link"
import { type ReactNode, Suspense, useState } from "react"
import { ButtonSkeleton } from "@/components/layout/skeletons"
import { WalletDropdown } from "@/components/web3/wallet-dropdown"
import { config } from "@/lib/reactive-dot/config"
import type { ChainId } from "@/lib/reactive-dot/custom-types"

export function WalletProviders({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<any>(null)
  const [chainId, setChainId] = useState<ChainId>("dev")

  return (
    <ReactiveDotProvider config={config}>
      <SignerProvider signer={account?.polkadotSigner}>
        <ChainProvider chainId={chainId}>
          <div className="min-h-screen">
            {/* Top Navigation */}
            <div className="sticky top-0 right-0 left-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center justify-between px-4">
                <Link className="font-semibold" href="/">
                  Ink!FundMe
                </Link>
                <Suspense fallback={<ButtonSkeleton />}>
                  <WalletDropdown
                    account={account}
                    setAccount={setAccount}
                    chainId={chainId}
                    setChainId={setChainId}
                  />
                </Suspense>
              </div>
            </div>

            {/* Page Content */}
            <main className="flex justify-center py-8">{children}</main>
          </div>
        </ChainProvider>
      </SignerProvider>
    </ReactiveDotProvider>
  )
}
