/**
 * Convert technical / English API errors into short Japanese messages for UI.
 */
export const toUserErrorMessage = (error: unknown): string => {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '不明なエラーが発生しました'

  const message = raw.trim()
  if (!message) {
    return '不明なエラーが発生しました'
  }

  const lower = message.toLowerCase()

  if (/could not find the table/i.test(message) || /relation .* does not exist/i.test(message)) {
    const table =
      message.match(/'public\.(\w+)'/i)?.[1] ?? message.match(/table ['"]([\w.]+)['"]/i)?.[1]
    return table
      ? `テーブル「${table.replace(/^public\./, '')}」が見つかりません。Supabaseでテーブル作成SQLを実行してください。`
      : '必要なテーブルが見つかりません。Supabaseでテーブル作成SQLを実行してください。'
  }

  if (/could not find the .* column/i.test(message) || /column .* does not exist/i.test(message)) {
    if (/recurrence_|next_run_at|end_at/i.test(message)) {
      return '繰り返し予約用のカラムがありません。Supabaseで schedules のカラム追加SQLを実行してください。'
    }
    return '必要なカラムが見つかりません。Supabaseで最新のSQLマイグレーションを実行してください。'
  }

  if (/schema cache/i.test(message)) {
    return 'データベースのスキーマが古い可能性があります。SupabaseでSQLを実行したあと、少し待って再試行してください。'
  }

  if (
    /user is not authenticated/i.test(message) ||
    /jwt/i.test(lower) ||
    /not authenticated/i.test(lower)
  ) {
    return 'ログインの有効期限が切れている可能性があります。再度ログインしてください。'
  }

  if (/network request failed/i.test(message) || /failed to fetch/i.test(message)) {
    return 'ネットワークエラーです。接続を確認して再試行してください。'
  }

  if (/duplicate key|unique constraint/i.test(message)) {
    return 'すでに同じデータが存在します。'
  }

  if (/violates row-level security|permission denied|rls/i.test(message)) {
    return 'この操作を行う権限がありません。'
  }

  if (/invalid input|invalid api key|invalid jwt/i.test(message)) {
    return '入力内容または認証情報に問題があります。'
  }

  // Already Japanese (or app-thrown Japanese)
  if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(message)) {
    return message
  }

  // Fallback: keep technical detail but prefix in Japanese
  return `エラーが発生しました: ${message}`
}
