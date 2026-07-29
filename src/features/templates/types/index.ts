export type Template = {
  id: string
  user_id: string
  name: string
  title: string | null
  body: string
  created_at: string
  updated_at: string
}

export type CreateTemplateInput = {
  name: string
  title?: string
  body: string
}
