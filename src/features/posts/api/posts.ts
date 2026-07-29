import { supabase } from '@/lib/supabase'

export type Post = {
  id: string
  user_id: string
  title: string | null
  body: string
  status: string
  created_at: string
  updated_at: string
}

export type CreatePostInput = {
  title?: string
  body: string
}

export type UpdatePostInput = {
  title?: string
  body: string
}

export const getPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
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
    throw new Error(error.message)
  }

  return data as Post
}

export const getPostById = async (id: string): Promise<Post> => {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Post
}

export const updatePost = async (id: string, input: UpdatePostInput) => {
  const { data, error } = await supabase
    .from('posts')
    .update({
      title: input.title,
      body: input.body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Post
}

export const deletePost = async (id: string) => {
  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export const duplicatePost = async (id: string) => {
  const sourcePost = await getPostById(id)

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
      title: sourcePost.title ? `${sourcePost.title} コピー` : null,
      body: sourcePost.body,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Post
}
