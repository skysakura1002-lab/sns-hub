import { supabase } from '@/lib/supabase'

export type CreatePostInput = {
  title?: string
  body: string
}

export const createPost = async ({ title, body }: CreatePostInput) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User is not authenticated')
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      title,
      body,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
