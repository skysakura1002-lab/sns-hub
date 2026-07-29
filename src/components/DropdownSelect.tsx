import { useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'

export type DropdownOption<T extends string | number> = {
  label: string
  value: T
}

type DropdownSelectProps<T extends string | number> = {
  label?: string
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  flex?: number
}

export function DropdownSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  flex,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <View style={[styles.wrapper, flex != null ? { flex } : null]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{selected?.label ?? '選択'}</Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label ?? '選択'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(item.value)
                      setOpen(false)
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                )
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  trigger: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  triggerText: {
    fontSize: 16,
    color: '#111',
    flexShrink: 1,
  },
  chevron: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '70%',
    paddingTop: 12,
    overflow: 'hidden',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  optionActive: {
    backgroundColor: '#111',
  },
  optionText: {
    fontSize: 16,
    color: '#111',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
})
