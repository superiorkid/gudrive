import AppContainer from "@/components/container"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Stat,
  StatIndicator,
  StatLabel,
  StatTrend,
  StatValue,
} from "@/components/ui/stat"
import {
  FileTextIcon,
  HardDriveIcon,
  ImageIcon,
  MusicIcon,
  SearchIcon,
  StarIcon,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react"
import { Suspense } from "react"
import NodeModifiedFilter from "../../_components/node-modified-filter"
import NodeTypeFilter from "../../_components/node-type-filter"

const DriveHomePage = () => {
  return (
    <main className="space-y-10">
      <div className="mx-auto max-w-xl space-y-4 pt-28 pb-10">
        <h1 className="text-center text-3xl font-semibold">Welcome to Drive</h1>

        <InputGroup className="h-10 2xl:h-12">
          <InputGroupInput placeholder="Search In Drive" />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center justify-center gap-4">
          <Suspense
            fallback={
              <div className="flex items-center space-x-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={`skeleton-${index}`} className="h-10 w-40" />
                ))}
              </div>
            }
          >
            <NodeTypeFilter />
            <NodeModifiedFilter />
          </Suspense>
        </div>
      </div>
      <AppContainer className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:max-w-6xl">
        <Stat>
          <StatLabel>Total Files</StatLabel>
          <StatValue>2,842</StatValue>
          <StatIndicator variant="badge" color="info">
            +12 today
          </StatIndicator>
        </Stat>

        <Stat>
          <StatLabel>Library Size</StatLabel>
          <StatValue>124.5 GB</StatValue>
          <StatIndicator variant="icon" color="success">
            <HardDriveIcon size={16} />
          </StatIndicator>
        </Stat>

        <Stat>
          <StatLabel>Recent Uploads</StatLabel>
          <StatValue>48</StatValue>
          <StatIndicator variant="icon" color="info">
            <UploadCloudIcon size={16} />
          </StatIndicator>
          <StatTrend trend="up">Past 7 days</StatTrend>
        </Stat>

        <Stat>
          <StatLabel>Starred Items</StatLabel>
          <StatValue>128</StatValue>
          <StatIndicator variant="icon" color="warning">
            <StarIcon size={16} fill="currentColor" />
          </StatIndicator>
          <StatTrend>Pinned for quick access</StatTrend>
        </Stat>

        <Stat>
          <StatLabel>Images</StatLabel>
          <StatValue>1,420</StatValue>
          <StatIndicator variant="icon" color="info">
            <ImageIcon size={16} />
          </StatIndicator>
          <StatTrend trend="up">Photos & Screenshots</StatTrend>
        </Stat>

        <Stat>
          <StatLabel>Videos</StatLabel>
          <StatValue>84</StatValue>
          <StatIndicator variant="icon" color="error">
            <VideoIcon size={16} />
          </StatIndicator>
          <StatTrend>Movies & Recordings</StatTrend>
        </Stat>

        <Stat>
          <StatLabel>Documents</StatLabel>
          <StatValue>312</StatValue>
          <StatIndicator variant="icon" color="success">
            <FileTextIcon size={16} />
          </StatIndicator>
          <StatTrend>PDFs, Docs & Sheets</StatTrend>
        </Stat>

        <Stat>
          <StatLabel>Audio & Others</StatLabel>
          <StatValue>56</StatValue>
          <StatIndicator variant="icon" color="warning">
            <MusicIcon size={16} />
          </StatIndicator>
          <StatTrend>Music & Zip files</StatTrend>
        </Stat>
      </AppContainer>
    </main>
  )
}

export default DriveHomePage
