"use client"

import MaterialSymbolsSubdirectoryArrowLeft from "@/components/icons/MaterialSymbolsSubdirectoryArrowLeft"
import { buttonVariants } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useNodes } from "@/hooks/apis/nodes/use-nodes"
import useDebounce from "@/hooks/use-debounce"
import { useDisplay } from "@/hooks/use-display"
import { useKeyword } from "@/hooks/use-keyword"
import { getFileIcon } from "@/lib/folder-icon"
import { cn, formatDate } from "@/lib/utils"
import { TNode } from "@/types/node-type"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Loader2Icon, SearchIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { searchSchema, TSearchSchema } from "../schema"

type Props = {
  className?: string
}

const AppSearch = ({ className }: Props) => {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [searchKeyword] = useKeyword()

  const { push } = useRouter()

  const form = useForm<TSearchSchema>({
    resolver: standardSchemaResolver(searchSchema),
    defaultValues: {
      keyword: searchKeyword ?? "",
    },
  })

  const keyword = useWatch({ control: form.control, name: "keyword" }) ?? ""
  const debouncedKeyword = useDebounce(keyword, 250)

  const onSubmit = (values: TSearchSchema) => {
    if (!values.keyword) return
    push(`/drive/search?q=${values.keyword}`)
  }

  const {
    data: nodes,
    isFetching,
    isError,
  } = useNodes({
    debounceKeyword: debouncedKeyword,
    enabled: !!debouncedKeyword,
  })

  const isEmpty = !isFetching && nodes?.data.length === 0

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsFocused(false)
    }
  }

  const [display] = useDisplay()
  const handleNodeNavigation = (node: TNode) => {
    if (node.type === "folder") {
      push(`/drive/folders/${node.id}?display=${display}`)
    } else {
      console.log("Opening file preview for:", node.name)
    }
  }

  return (
    <div
      className="relative"
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Controller
          name="keyword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <InputGroup className="h-10 max-w-md 2xl:max-w-xl">
                <InputGroupInput
                  {...field}
                  id={field.name}
                  placeholder="Search in Drive"
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                <InputGroupAddon>
                  {isFetching ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <SearchIcon />
                  )}
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </form>

      {debouncedKeyword && isFocused && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full max-w-md 2xl:max-w-xl">
          <div className="rounded-lg border bg-card shadow-sm">
            {isError && (
              <div className="p-4 text-sm text-destructive">
                Failed to load results.
              </div>
            )}

            {isEmpty && (
              <div className="p-4 text-sm text-muted-foreground">
                No results for &ldquo;{debouncedKeyword}&rdquo;.
              </div>
            )}

            {nodes?.data && nodes.data.length > 0 && (
              <ul role="listbox" className="max-h-96 divide-y overflow-auto">
                {nodes.data.map((node) => (
                  <li
                    key={node.id}
                    role="option"
                    aria-selected
                    tabIndex={0}
                    className="flex cursor-pointer items-center gap-3 p-3 hover:bg-accent focus:bg-accent focus:outline-none"
                    onClick={() => handleNodeNavigation(node)}
                  >
                    {getFileIcon(node.type, node.mime_type || "unknown")}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium">
                        {node.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <time dateTime={node.updated_at?.toString()}>
                          {formatDate(node.updated_at?.toString() || "")}
                        </time>
                        <span>·</span>
                        <span>{node.parent?.name ?? "My Drive"}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-center border-t px-4 py-1.5">
              <Link
                href={`/drive/search?q=${debouncedKeyword}`}
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant: "secondary",
                    className: "w-full",
                  })
                )}
              >
                <MaterialSymbolsSubdirectoryArrowLeft />
                Show All
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppSearch
