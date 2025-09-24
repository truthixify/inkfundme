"use client"

import { Suspense } from "react"
import { CardSkeleton } from "@/components/layout/skeletons"
import { Wrapper } from "@/components/layout/wrapper"
import { ContractCard } from "@/components/web3/contract-card"

export function App() {
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <Wrapper className="py-8">
        {/* <Header /> */}
        <Suspense fallback={<CardSkeleton />}>
          <ContractCard />
        </Suspense>
      </Wrapper>
    </div>
  )
}
