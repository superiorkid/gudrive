"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useNode } from "@/hooks/apis/nodes/use-node"
import { useRenameNode } from "@/hooks/apis/nodes/use-rename-node"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { renameNodeSchema, TRenameNodeSchema } from "../schema"

type Props = {
  nodeId: string
  onUpdateSuccess?: () => void
}

const RenameNodeForm = ({ nodeId, onUpdateSuccess }: Props) => {
  const { data: node, isPending: nodePending } = useNode(nodeId)

  const form = useForm({
    resolver: standardSchemaResolver(renameNodeSchema),
    defaultValues: {
      newName: node?.data.name ?? "",
    },
  })

  const { mutate: renameNodeMutation, isPending: renameNodePending } =
    useRenameNode({ nodeId, onSuccess: () => onUpdateSuccess?.() })
  const onSubmit = (values: TRenameNodeSchema) => {
    renameNodeMutation(values.newName)
  }

  useEffect(() => {
    if (node?.data.name) {
      form.reset({
        newName: node.data.name,
      })
    }
  }, [node, form])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="newName"
        control={form.control}
        disabled={nodePending || renameNodePending}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="New name"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={nodePending || renameNodePending}>
          Save
        </Button>
      </div>
    </form>
  )
}

export default RenameNodeForm
