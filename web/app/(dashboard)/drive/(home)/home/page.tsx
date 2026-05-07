import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SearchIcon } from "lucide-react"

const DriveHomePage = () => {
  return (
    <div className="space-y-8">
      <div className="py-8">
        <h1>Welcome to Drive</h1>

        <InputGroup>
          <InputGroupInput placeholder="Search In Drive" />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div>stat card</div>
    </div>
  )
}

export default DriveHomePage
