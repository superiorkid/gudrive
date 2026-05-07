"use client"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Display, useDisplay } from "@/hooks/use-display"
import { CheckIcon, GridIcon, ListIcon } from "lucide-react"

const NodeDisplaySwitcher = () => {
  const [display, setDisplay] = useDisplay()
  const isList = display === Display.list

  return (
    <ButtonGroup>
      <Button
        size="lg"
        variant={isList ? "default" : "outline"}
        onClick={() => setDisplay(Display.list)}
      >
        {isList && <CheckIcon />}
        <ListIcon />
      </Button>
      <Button
        size="lg"
        variant={!isList ? "default" : "outline"}
        onClick={() => setDisplay(Display.grid)}
      >
        {!isList && <CheckIcon />}
        <GridIcon />
      </Button>
    </ButtonGroup>
  )
}

export default NodeDisplaySwitcher
