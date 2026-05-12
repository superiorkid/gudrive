"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useCreateNode } from "@/hooks/apis/nodes/use-create-node"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useParams } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { createFolderSchema, TCreateFolderSchema } from "../schema"

type Props = {
  onSuccess?: () => void
}

const CreateFolderForm = ({ onSuccess }: Props) => {
  const { folderId } = useParams<{ folderId: string }>()

  const form = useForm<TCreateFolderSchema>({
    resolver: standardSchemaResolver(createFolderSchema),
    defaultValues: {
      name: "Untitled Folder",
      parentId: folderId,
    },
  })

  const { mutate: createFolderMutation, isPending } = useCreateNode()
  const onSubmit = async (values: TCreateFolderSchema) => {
    createFolderMutation({
      name: values.name,
      parentId: values.parentId,
    })
    onSuccess?.()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        disabled={isPending}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Folder Name"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  )
}

export default CreateFolderForm
