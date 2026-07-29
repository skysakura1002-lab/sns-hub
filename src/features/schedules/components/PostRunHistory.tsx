import { StyleSheet, Text, View } from 'react-native'

import type { PostRun } from '@/features/schedules/types/post-run'
import { POST_RUN_STATUS_LABELS } from '@/features/schedules/types/post-run'
import { formatTokyoDateTime } from '@/features/schedules/utils/tokyo-datetime'

type PostRunHistoryProps = {
  runs: PostRun[]
}

export function PostRunHistory({ runs }: PostRunHistoryProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>実行履歴</Text>

      {runs.length === 0 ? (
        <Text style={styles.empty}>まだ実行履歴はありません</Text>
      ) : (
        runs.map((run) => {
          const when = run.scheduled_for ?? run.started_at ?? run.created_at
          const statusLabel = POST_RUN_STATUS_LABELS[run.status]

          return (
            <View key={run.id} style={styles.item}>
              <View style={styles.row}>
                <Text style={styles.when}>{formatTokyoDateTime(new Date(when))}</Text>
                <Text
                  style={[
                    styles.status,
                    run.status === 'success' && styles.statusSuccess,
                    run.status === 'failed' && styles.statusFailed,
                    run.status === 'running' && styles.statusRunning,
                    run.status === 'pending' && styles.statusPending,
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
              {run.error_message ? <Text style={styles.error}>{run.error_message}</Text> : null}
            </View>
          )
        })
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  empty: {
    fontSize: 14,
    color: '#888',
  },
  item: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  when: {
    fontSize: 14,
    color: '#333',
    flexShrink: 1,
  },
  status: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusSuccess: {
    color: '#1b7f3a',
  },
  statusFailed: {
    color: '#b00020',
  },
  statusRunning: {
    color: '#0a7aff',
  },
  statusPending: {
    color: '#888',
  },
  error: {
    fontSize: 13,
    color: '#b00020',
  },
})
