import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { DropdownSelect } from '@/components/DropdownSelect'
import type { RecurrenceType, ScheduleMode } from '@/features/schedules/types/schedule'
import { WEEKDAY_LABELS } from '@/features/schedules/types/schedule'
import { getTokyoWeekday } from '@/features/schedules/utils/next-run-at'
import {
  buildTokyoDate,
  getDaysInMonth,
  getDefaultScheduledAt,
  getTokyoDateTimeParts,
  type TokyoDateTimeParts,
} from '@/features/schedules/utils/tokyo-datetime'

type ScheduleTimingFieldsProps = {
  scheduleMode: ScheduleMode
  onChangeScheduleMode: (value: ScheduleMode) => void
  scheduledAt: Date | null
  onChangeScheduledAt: (value: Date | null) => void
  recurrenceType: RecurrenceType
  onChangeRecurrenceType: (value: RecurrenceType) => void
  recurrenceInterval: number
  onChangeRecurrenceInterval: (value: number) => void
  recurrenceWeekday: number | null
  onChangeRecurrenceWeekday: (value: number | null) => void
  recurrenceDayOfMonth: number | null
  onChangeRecurrenceDayOfMonth: (value: number | null) => void
  endAt: Date | null
  onChangeEndAt: (value: Date | null) => void
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index)

export function ScheduleTimingFields({
  scheduleMode,
  onChangeScheduleMode,
  scheduledAt,
  onChangeScheduledAt,
  recurrenceType,
  onChangeRecurrenceType,
  recurrenceInterval,
  onChangeRecurrenceInterval,
  recurrenceWeekday,
  onChangeRecurrenceWeekday,
  recurrenceDayOfMonth,
  onChangeRecurrenceDayOfMonth,
  endAt,
  onChangeEndAt,
}: ScheduleTimingFieldsProps) {
  const parts = useMemo<TokyoDateTimeParts>(() => {
    return getTokyoDateTimeParts(scheduledAt ?? getDefaultScheduledAt())
  }, [scheduledAt])

  const endParts = useMemo<TokyoDateTimeParts>(() => {
    return getTokyoDateTimeParts(endAt ?? getDefaultScheduledAt())
  }, [endAt])

  const yearOptions = useMemo(() => {
    const currentYear = getTokyoDateTimeParts(new Date()).year
    return range(currentYear, currentYear + 5).map((year) => ({
      label: `${year}年`,
      value: year,
    }))
  }, [])

  const monthOptions = useMemo(
    () =>
      range(1, 12).map((month) => ({
        label: `${month}月`,
        value: month,
      })),
    [],
  )

  const dayOptions = useMemo(
    () =>
      range(1, getDaysInMonth(parts.year, parts.month)).map((day) => ({
        label: `${day}日`,
        value: day,
      })),
    [parts.year, parts.month],
  )

  const endDayOptions = useMemo(
    () =>
      range(1, getDaysInMonth(endParts.year, endParts.month)).map((day) => ({
        label: `${day}日`,
        value: day,
      })),
    [endParts.year, endParts.month],
  )

  const hourOptions = useMemo(
    () =>
      range(0, 23).map((hour) => ({
        label: `${String(hour).padStart(2, '0')}時`,
        value: hour,
      })),
    [],
  )

  const minuteOptions = useMemo(
    () =>
      range(0, 59).map((minute) => ({
        label: `${String(minute).padStart(2, '0')}分`,
        value: minute,
      })),
    [],
  )

  const weekdayOptions = useMemo(
    () =>
      WEEKDAY_LABELS.map((label, value) => ({
        label: `${label}曜日`,
        value,
      })),
    [],
  )

  const dayOfMonthOptions = useMemo(
    () =>
      range(1, 31).map((day) => ({
        label: `${day}日`,
        value: day,
      })),
    [],
  )

  const intervalOptions = useMemo(
    () =>
      range(1, 30).map((days) => ({
        label: `${days}日ごと`,
        value: days,
      })),
    [],
  )

  const ensureScheduledAt = () => scheduledAt ?? getDefaultScheduledAt()

  const updateParts = (next: Partial<TokyoDateTimeParts>) => {
    const merged = { ...parts, ...next }
    const maxDay = getDaysInMonth(merged.year, merged.month)
    if (merged.day > maxDay) {
      merged.day = maxDay
    }
    onChangeScheduledAt(buildTokyoDate(merged))
  }

  const updateEndParts = (next: Partial<TokyoDateTimeParts>) => {
    const merged = { ...endParts, ...next }
    const maxDay = getDaysInMonth(merged.year, merged.month)
    if (merged.day > maxDay) {
      merged.day = maxDay
    }
    // End of selected Tokyo day
    onChangeEndAt(
      buildTokyoDate({
        ...merged,
        hour: 23,
        minute: 59,
      }),
    )
  }

  const handleModeChange = (value: ScheduleMode) => {
    onChangeScheduleMode(value)

    if (value === 'now') {
      onChangeScheduledAt(null)
      onChangeEndAt(null)
      return
    }

    const next = ensureScheduledAt()
    onChangeScheduledAt(next)

    if (value === 'recurring') {
      const tokyo = getTokyoDateTimeParts(next)
      if (recurrenceWeekday == null) {
        onChangeRecurrenceWeekday(getTokyoWeekday(next))
      }
      if (recurrenceDayOfMonth == null) {
        onChangeRecurrenceDayOfMonth(tokyo.day)
      }
      if (recurrenceType === 'none') {
        onChangeRecurrenceType('weekly')
      }
    }
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>投稿タイミング</Text>

      <DropdownSelect
        label="タイミング"
        value={scheduleMode}
        options={[
          { label: '今すぐ', value: 'now' },
          { label: '日時指定', value: 'once' },
          { label: '繰り返し', value: 'recurring' },
        ]}
        onChange={handleModeChange}
      />

      {scheduleMode === 'once' ? (
        <View style={styles.block}>
          <Text style={styles.hint}>Asia/Tokyo</Text>
          <View style={styles.row}>
            <DropdownSelect
              label="年"
              flex={1.3}
              value={parts.year}
              options={yearOptions}
              onChange={(year) => updateParts({ year })}
            />
            <DropdownSelect
              label="月"
              flex={1}
              value={parts.month}
              options={monthOptions}
              onChange={(month) => updateParts({ month })}
            />
            <DropdownSelect
              label="日"
              flex={1}
              value={parts.day}
              options={dayOptions}
              onChange={(day) => updateParts({ day })}
            />
          </View>
          <View style={styles.row}>
            <DropdownSelect
              label="時"
              flex={1}
              value={parts.hour}
              options={hourOptions}
              onChange={(hour) => updateParts({ hour })}
            />
            <DropdownSelect
              label="分"
              flex={1}
              value={parts.minute}
              options={minuteOptions}
              onChange={(minute) => updateParts({ minute })}
            />
          </View>
        </View>
      ) : null}

      {scheduleMode === 'recurring' ? (
        <View style={styles.block}>
          <DropdownSelect
            label="頻度"
            value={recurrenceType === 'none' ? 'weekly' : recurrenceType}
            options={[
              { label: '毎日', value: 'daily' },
              { label: '毎週', value: 'weekly' },
              { label: '毎月', value: 'monthly' },
              { label: '○日ごと', value: 'interval' },
            ]}
            onChange={(value) => onChangeRecurrenceType(value)}
          />

          {recurrenceType === 'weekly' || recurrenceType === 'none' ? (
            <DropdownSelect
              label="曜日"
              value={recurrenceWeekday ?? getTokyoWeekday(ensureScheduledAt())}
              options={weekdayOptions}
              onChange={(value) => onChangeRecurrenceWeekday(value)}
            />
          ) : null}

          {recurrenceType === 'monthly' ? (
            <DropdownSelect
              label="日付"
              value={recurrenceDayOfMonth ?? parts.day}
              options={dayOfMonthOptions}
              onChange={(value) => onChangeRecurrenceDayOfMonth(value)}
            />
          ) : null}

          {recurrenceType === 'interval' ? (
            <DropdownSelect
              label="間隔"
              value={recurrenceInterval}
              options={intervalOptions}
              onChange={(value) => onChangeRecurrenceInterval(value)}
            />
          ) : null}

          <Text style={styles.sectionLabel}>時間（Asia/Tokyo）</Text>
          <View style={styles.row}>
            <DropdownSelect
              label="時"
              flex={1}
              value={parts.hour}
              options={hourOptions}
              onChange={(hour) => updateParts({ hour })}
            />
            <DropdownSelect
              label="分"
              flex={1}
              value={parts.minute}
              options={minuteOptions}
              onChange={(minute) => updateParts({ minute })}
            />
          </View>

          <DropdownSelect
            label="終了"
            value={endAt ? 'until' : 'none'}
            options={[
              { label: '終了なし', value: 'none' },
              { label: '終了日を指定', value: 'until' },
            ]}
            onChange={(value) => {
              if (value === 'none') {
                onChangeEndAt(null)
                return
              }
              const base = endAt ?? getDefaultScheduledAt()
              const tokyo = getTokyoDateTimeParts(base)
              onChangeEndAt(
                buildTokyoDate({
                  year: tokyo.year,
                  month: tokyo.month,
                  day: tokyo.day,
                  hour: 23,
                  minute: 59,
                }),
              )
            }}
          />

          {endAt ? (
            <View style={styles.row}>
              <DropdownSelect
                label="年"
                flex={1.3}
                value={endParts.year}
                options={yearOptions}
                onChange={(year) => updateEndParts({ year })}
              />
              <DropdownSelect
                label="月"
                flex={1}
                value={endParts.month}
                options={monthOptions}
                onChange={(month) => updateEndParts({ month })}
              />
              <DropdownSelect
                label="日"
                flex={1}
                value={endParts.day}
                options={endDayOptions}
                onChange={(day) => updateEndParts({ day })}
              />
            </View>
          ) : null}
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
  hint: {
    fontSize: 13,
    color: '#666',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  block: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
})
