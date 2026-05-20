"use client"

import AppContainer from "@/components/container"
import {
  Stat,
  StatIndicator,
  StatLabel,
  StatTrend,
  StatValue,
} from "@/components/ui/stat"
import { useStatOverview } from "@/hooks/apis/stats/use-stat-overview"
import { formatBytes } from "@/lib/utils"
import {
  FileTextIcon,
  HardDriveIcon,
  ImageIcon,
  MusicIcon,
  StarIcon,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react"
import StatsOverviewSkeleton from "./stats-overview-skeleton"

const StatsOverview = () => {
  const { data: statsOverview, isPending } = useStatOverview()

  if (isPending) {
    return <StatsOverviewSkeleton />
  }

  return (
    <AppContainer className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:max-w-6xl">
      <Stat>
        <StatLabel>Total Files</StatLabel>
        <StatValue>{statsOverview?.data.total_files}</StatValue>
        <StatIndicator variant="badge" color="info">
          +12 today
        </StatIndicator>
      </Stat>

      <Stat>
        <StatLabel>Library Size</StatLabel>
        <StatValue>
          {formatBytes(statsOverview?.data.library_size || 0)}
        </StatValue>
        <StatIndicator variant="icon" color="success">
          <HardDriveIcon size={16} />
        </StatIndicator>
      </Stat>

      <Stat>
        <StatLabel>Recent Uploads</StatLabel>
        <StatValue>{statsOverview?.data.recent_uploads}</StatValue>
        <StatIndicator variant="icon" color="info">
          <UploadCloudIcon size={16} />
        </StatIndicator>
        <StatTrend trend="up">Past 7 days</StatTrend>
      </Stat>

      <Stat>
        <StatLabel>Starred Items</StatLabel>
        <StatValue>{statsOverview?.data.starred_items}</StatValue>
        <StatIndicator variant="icon" color="warning">
          <StarIcon size={16} fill="currentColor" />
        </StatIndicator>
        <StatTrend>Pinned for quick access</StatTrend>
      </Stat>

      <Stat>
        <StatLabel>Images</StatLabel>
        <StatValue>{statsOverview?.data.types.images}</StatValue>
        <StatIndicator variant="icon" color="info">
          <ImageIcon size={16} />
        </StatIndicator>
        <StatTrend trend="up">Photos & Screenshots</StatTrend>
      </Stat>

      <Stat>
        <StatLabel>Videos</StatLabel>
        <StatValue>{statsOverview?.data.types.videos}</StatValue>
        <StatIndicator variant="icon" color="error">
          <VideoIcon size={16} />
        </StatIndicator>
        <StatTrend>Movies & Recordings</StatTrend>
      </Stat>

      <Stat>
        <StatLabel>Documents</StatLabel>
        <StatValue>{statsOverview?.data.types.documents}</StatValue>
        <StatIndicator variant="icon" color="success">
          <FileTextIcon size={16} />
        </StatIndicator>
        <StatTrend>PDFs, Docs & Sheets</StatTrend>
      </Stat>

      <Stat>
        <StatLabel>Audio & Others</StatLabel>
        <StatValue>{statsOverview?.data.types.audio_other}</StatValue>
        <StatIndicator variant="icon" color="warning">
          <MusicIcon size={16} />
        </StatIndicator>
        <StatTrend>Music & Zip files</StatTrend>
      </Stat>
    </AppContainer>
  )
}

export default StatsOverview
