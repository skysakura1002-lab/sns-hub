import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

type ScheduleTimingFieldsProps = {
  isScheduled: boolean
  onChangeIsScheduled: (value: boolean) => void
  scheduledAtText: string
  onChangeScheduledAtText: (value: string) => void
}

export function ScheduleTimingFields({
  isScheduled,
  onChangeIsScheduled,
  scheduledAtText,
  onChangeScheduledAtText,
}: ScheduleTimingFieldsProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>投稿タイミング</Text>

      <Pressable style={styles.option} onPress={() => onChangeIsScheduled(false)}>
        <Text style={styles.radio}>{isScheduled ? '○' : '●'}</Text>
        <Text style={styles.optionLabel}>今すぐ</Text>
      </Pressable>

      <Pressable style={styles.option} onPress={() => onChangeIsScheduled(true)}>
        <Text style={styles.radio}>{isScheduled ? '●' : '○'}</Text>
        <Text style={styles.optionLabel}>日時指定</Text>
      </Pressable>

      {isScheduled ? (
        <View style={styles.field}>
          <Text style={styles.hint}>Asia/Tokyo（例: 2026/08/10 20:00）</Text>
          <TextInput
            placeholder="2026/08/10 20:00"
            style={styles.input}
            value={scheduledAtText}
            onChangeText={onChangeScheduledAtText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : null}
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    fontSize: 18,
    width: 24,
  },
  optionLabel: {
    fontSize: 16,
    color: '#111',
  },
  field: {
    gap: 6,
  },
  hint: {
    fontSize: 13,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
})
