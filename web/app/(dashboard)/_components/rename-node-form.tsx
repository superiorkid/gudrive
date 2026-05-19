"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useNode } from "@/hooks/apis/nodes/use-node"
import { useUpdateNode } from "@/hooks/apis/nodes/use-update-node"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { TUpdateNodeSchema, updateNodeSchema } from "../schema"

type Props = {
  nodeId: string
  onUpdateSuccess?: () => void
}

const RenameNodeForm = ({ nodeId, onUpdateSuccess }: Props) => {
  const { data: node, isPending: nodePending } = useNode(nodeId)

  const form = useForm({
    resolver: standardSchemaResolver(updateNodeSchema),
    defaultValues: {
      newName: node?.data.name ?? "",
    },
  })

  const { mutate: updateNodeMutation, isPending: updateNodePending } =
    useUpdateNode({ nodeId, onSuccess: () => onUpdateSuccess?.() })
  const onSubmit = (values: TUpdateNodeSchema) => {
    updateNodeMutation(values)
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
        disabled={nodePending || updateNodePending}
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
        <Button type="submit" disabled={nodePending || updateNodePending}>
          Save
        </Button>
      </div>
    </form>
  )
}

export default RenameNodeForm
