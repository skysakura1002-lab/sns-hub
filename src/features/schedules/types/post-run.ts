export type PostRunStatus = 'pending' | 'running' | 'success' | 'failed'

export type PostRun = {
  id: string
  post_id: string
  schedule_id: string | null
  user_id: string
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  status: PostRunStatus
  error_message: string | null
  created_at: string
}

export const POST_RUN_STATUS_LABELS: Record<PostRunStatus, string> = {
  pending: '待機中',
  running: '実行中',
  success: '成功',
  failed: '失敗',
}
