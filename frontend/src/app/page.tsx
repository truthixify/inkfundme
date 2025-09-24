"use client"

import { Footer } from "@/components/layout/footer"
import { App } from "./app"

export default function Home() {
  return (
    <div className="flex grow flex-col items-center justify-center py-8">
      <App />

      <Footer />
    </div>
  )
}
