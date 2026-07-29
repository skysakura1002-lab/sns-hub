import { supabase } from '@/lib/supabase'

import type { CreateTemplateInput, Template } from '@/features/templates/types'

export type { CreateTemplateInput, Template }

export const createTemplate = async ({ name, title, body }: CreateTemplateInput) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User is not authenticated')
  }

  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: user.id,
      name,
      title,
      body,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Template
}

export const getTemplates = async (): Promise<Template[]> => {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as Template[]) ?? []
}

export const getTemplateById = async (id: string): Promise<Template> => {
  const { data, error } = await supabase.from('templates').select('*').eq('id', id).single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Template
}
