"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Display, useDisplay } from "@/hooks/use-display"
import { GridIcon, ListIcon } from "lucide-react"

const NodeDisplaySwitcher = () => {
  const [display, setDisplay] = useDisplay()

  return (
    <ButtonGroup>
      <Button
        size="lg"
        variant={display === Display.list ? "default" : "outline"}
        onClick={() => setDisplay(Display.list)}
      >
        <ListIcon />
      </Button>
      <Button
        size="lg"
        variant={display === Display.grid ? "default" : "outline"}
        onClick={() => setDisplay(Display.grid)}
      >
        <GridIcon />
      </Button>
    </ButtonGroup>
  )
}

export default NodeDisplaySwitcher
