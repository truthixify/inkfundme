"use client"

import { use } from "react"
import { CampaignDetailPage } from "./campaign-detail"

interface CampaignPageProps {
  params: Promise<{ id: string }>
}

export default function CampaignPage({ params }: CampaignPageProps) {
  const unwrappedParams = use(params)
  return <CampaignDetailPage campaignId={Number.parseInt(unwrappedParams.id, 10)} />
}
