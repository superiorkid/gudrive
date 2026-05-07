"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import axiosInstance from "@/lib/axios"
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { useParams } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { createFolderSchema, TCreateFolderSchema } from "../schema"

const CreateFolderForm = () => {
  const { folderId } = useParams<{ folderId: string }>()

  const form = useForm<TCreateFolderSchema>({
    resolver: standardSchemaResolver(createFolderSchema),
    defaultValues: {
      name: "Untitled Folder",
      parentId: folderId,
    },
  })

  const onSubmit = async (values: TCreateFolderSchema) => {
    await axiosInstance.post("/v1/nodes", {
      name: values.name,
      parent_id: values.parentId ?? null,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Input
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="Folder Name"
              autoFocus
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex justify-end">
        <Button type="submit">Create</Button>
      </div>
    </form>
  )
}

export default CreateFolderForm
