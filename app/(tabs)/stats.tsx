/**
 * HomeScreen — Karting Lap Timer
 *
 * ⚠️  SUPABASE: voeg een 'kart' kolom toe aan je 'times' tabel:
 *     ALTER TABLE times ADD COLUMN kart integer NOT NULL DEFAULT 0;
 *
 * Tijdformaat: m:ss.hh  bijv. 1:32.45
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { supabase } from '../../utils/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeEntry = {
  id: number
  time: string
  lap: number
  kart: number
}

type SortMode = 'lap' | 'fastest'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LAPS = 50
const COLORS = {
  bg: '#0b0c10',
  surface: '#13151a',
  card: '#1a1d24',
  border: '#252830',
  accent: '#e8ff00',
  accentDim: '#b8cc00',
  fastest: '#00e676',
  fastestBg: '#00e67614',
  slowest: '#ff3d5a',
  slowestBg: '#ff3d5a14',
  best: '#ffd600',
  bestBg: '#ffd60014',
  textPrimary: '#f0f2f5',
  textSecondary: '#6b7280',
  textMuted: '#3d4049',
  positive: '#00e676',
  negative: '#ff3d5a',
  neutral: '#6b7280',
  delete: '#ff3d5a',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToSeconds(t: string): number {
  const parts = t.split(':')
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  }
  return parseFloat(t) || 0
}

function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '-'
  const abs = Math.abs(delta)
  const mins = Math.floor(abs / 60)
  const secs = (abs % 60).toFixed(3)
  return mins > 0
    ? `${sign}${mins}:${secs.padStart(6, '0')}`
    : `${sign}${parseFloat(secs).toFixed(3)}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropdownPicker({
  value,
  placeholder,
  items,
  onSelect,
  label,
}: {
  value: number | null
  placeholder: string
  items: number[]
  onSelect: (v: number) => void
  label: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <View style={pickerStyles.wrapper}>
        <Text style={pickerStyles.label}>{label}</Text>
        <TouchableOpacity
          style={pickerStyles.trigger}
          onPress={() => setOpen(true)}
          activeOpacity={0.75}
        >
          <Text style={value !== null ? pickerStyles.valueText : pickerStyles.placeholder}>
            {value !== null ? String(value) : placeholder}
          </Text>
          <Text style={pickerStyles.chevron}>▾</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={pickerStyles.backdrop} onPress={() => setOpen(false)}>
          <View style={pickerStyles.sheet}>
            <Text style={pickerStyles.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    pickerStyles.option,
                    value === item && pickerStyles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                >
                  <Text
                    style={[
                      pickerStyles.optionText,
                      value === item && pickerStyles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const pickerStyles = StyleSheet.create({
  wrapper: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  placeholder: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  chevron: { color: COLORS.textSecondary, fontSize: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    width: 220,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 2,
  },
  optionSelected: {
    backgroundColor: COLORS.accentDim + '22',
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [kartInput, setKartInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [selectedLap, setSelectedLap] = useState<number | null>(null)
  const [times, setTimes] = useState<TimeEntry[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('lap')
  const [saving, setSaving] = useState(false)

  const flashAnim = useRef(new Animated.Value(0)).current

  // ── Fetch ─────────────────────────────────────────────────────────────────

  async function fetchTimes() {
    const { data, error } = await supabase.from('times').select('*')
    if (!error) setTimes(data ?? [])
  }

  useEffect(() => {
    fetchTimes()
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────

  async function saveData() {
    if (!kartInput || !timeInput || selectedLap === null) return
    setSaving(true)

    const { error } = await supabase.from('times').insert([
      { time: timeInput, lap: selectedLap, kart: parseInt(kartInput) },
    ])

    setSaving(false)
    if (!error) {
      setKartInput('')
      setTimeInput('')
      setSelectedLap(null)
      fetchTimes()
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start()
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function deleteEntry(id: number) {
    const { error } = await supabase.from('times').delete().eq('id', id)
    if (!error) fetchTimes()
  }

  // ── Sorting ───────────────────────────────────────────────────────────────

  const sortedTimes = [...times].sort((a, b) =>
    sortMode === 'lap'
      ? a.lap - b.lap
      : timeToSeconds(a.time) - timeToSeconds(b.time)
  )

  // ── Derived stats ─────────────────────────────────────────────────────────

  const allSeconds = times.map((t) => timeToSeconds(t.time))
  const fastestSec = allSeconds.length ? Math.min(...allSeconds) : null
  const slowestSec = allSeconds.length ? Math.max(...allSeconds) : null

  // Best lap per kart
  const bestPerKart: Record<number, number> = {}
  times.forEach((t) => {
    const s = timeToSeconds(t.time)
    if (bestPerKart[t.kart] === undefined || s < bestPerKart[t.kart]) {
      bestPerKart[t.kart] = s
    }
  })

  function getDelta(entry: TimeEntry): number | null {
    const prevSameKart = sortedTimes
      .filter((t) => t.kart === entry.kart && t.lap < entry.lap)
      .sort((a, b) => b.lap - a.lap)[0]

    if (!prevSameKart) return null
    return timeToSeconds(entry.time) - timeToSeconds(prevSameKart.time)
  }

  // ── Lap options (exclude already-entered laps) ────────────────────────────

  const usedLaps = new Set(times.map((t) => t.lap))
  const lapOptions = Array.from({ length: MAX_LAPS }, (_, i) => i + 1).filter(
    (l) => !usedLaps.has(l)
  )

  // ─── Render row ───────────────────────────────────────────────────────────

  function renderRow({ item }: { item: TimeEntry }) {
    const sec = timeToSeconds(item.time)
    const isFastest = sec === fastestSec
    const isSlowest = sec === slowestSec && times.length > 1
    const isBestForKart = sec === bestPerKart[item.kart]
    const delta = getDelta(item)

    const rowBg = isFastest
      ? COLORS.fastestBg
      : isSlowest
      ? COLORS.slowestBg
      : undefined

    const timeColor = isFastest
      ? COLORS.fastest
      : isSlowest
      ? COLORS.slowest
      : COLORS.textPrimary

    const deltaColor =
      delta === null
        ? COLORS.neutral
        : delta < 0
        ? COLORS.positive
        : delta > 0
        ? COLORS.negative
        : COLORS.neutral

    return (
      <View style={[styles.row, rowBg ? { backgroundColor: rowBg } : null]}>
        {/* Left: lap number */}
        <View style={styles.lapCell}>
          <Text style={styles.lapLabel}>RONDE</Text>
          <Text style={styles.lapNumber}>{item.lap}</Text>
        </View>

        <View style={styles.rowDivider} />

        {/* Kart */}
        <View style={styles.kartCell}>
          <Text style={styles.cellLabel}>KART</Text>
          <View style={styles.kartBadge}>
            <Text style={styles.kartBadgeText}>#{item.kart}</Text>
          </View>
        </View>

        {/* Time */}
        <View style={styles.timeCell}>
          <Text style={styles.cellLabel}>TIJD</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isBestForKart && <Text style={styles.bestStar}>★</Text>}
            <Text style={[styles.timeValue, { color: timeColor }]}>{item.time}</Text>
          </View>
        </View>

        {/* Delta */}
        <View style={styles.deltaCell}>
          <Text style={styles.cellLabel}>VERSCHIL</Text>
          <Text style={[styles.deltaValue, { color: deltaColor }]}>
            {delta === null ? '—' : formatDelta(delta)}
          </Text>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteEntry(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ─── Header ───────────────────────────────────────────────────────────────

  const ListHeader = (
    <View>
      {/* Column labels */}
      <View style={styles.columnHeader}>
        <Text style={[styles.colHeaderText, { width: 64 }]}>RONDE</Text>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Text style={[styles.colHeaderText, { flex: 1 }]}>KART</Text>
          <Text style={[styles.colHeaderText, { flex: 1.4 }]}>TIJD</Text>
          <Text style={[styles.colHeaderText, { flex: 1.3 }]}>VERSCHIL</Text>
        </View>
      </View>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.fastest }]} />
          <Text style={styles.legendText}>Snelste</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.slowest }]} />
          <Text style={styles.legendText}>Traagste</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={{ color: COLORS.best, fontSize: 12 }}>★</Text>
          <Text style={styles.legendText}>Beste per kart</Text>
        </View>
      </View>
    </View>
  )

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── Title bar ── */}
      <View style={styles.titleBar}>
        <Text style={styles.titleAccent}>🏁</Text>
        <Text style={styles.title}>LAP TIMER</Text>
        <Text style={styles.titleCount}>
          {times.length} {times.length === 1 ? 'ronde' : 'rondes'}
        </Text>
      </View>

      {/* ── Input form ── */}
      <Animated.View style={[styles.form, { opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }) }]}>
        <View style={styles.formRow}>
          {/* Kart nummer */}
          <View style={{ flex: 1 }}>
            <Text style={pickerStyles.label}>Kart #</Text>
            <TextInput
              placeholder="bv. 7"
              placeholderTextColor={COLORS.textMuted}
              value={kartInput}
              onChangeText={setKartInput}
              keyboardType="numeric"
              style={styles.textInput}
            />
          </View>

          <View style={{ width: 10 }} />

          {/* Ronde tijd */}
          <View style={{ flex: 1.4 }}>
            <Text style={pickerStyles.label}>Ronde Tijd</Text>
            <TextInput
              placeholder="bv. 1:32.45"
              placeholderTextColor={COLORS.textMuted}
              value={timeInput}
              onChangeText={setTimeInput}
              style={styles.textInput}
            />
          </View>

          <View style={{ width: 10 }} />

          {/* Ronde nummer dropdown */}
          <DropdownPicker
            label="Ronde #"
            value={selectedLap}
            placeholder="Kies"
            items={lapOptions}
            onSelect={setSelectedLap}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!kartInput || !timeInput || selectedLap === null) && styles.saveBtnDisabled,
          ]}
          onPress={saveData}
          disabled={saving || !kartInput || !timeInput || selectedLap === null}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'OPSLAAN…' : '+ TOEVOEGEN'}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Sort buttons ── */}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={[styles.sortBtn, sortMode === 'lap' && styles.sortBtnActive]}
          onPress={() => setSortMode('lap')}
        >
          <Text style={[styles.sortBtnText, sortMode === 'lap' && styles.sortBtnTextActive]}>
            Op Ronde
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortBtn, sortMode === 'fastest' && styles.sortBtnActive]}
          onPress={() => setSortMode('fastest')}
        >
          <Text style={[styles.sortBtnText, sortMode === 'fastest' && styles.sortBtnTextActive]}>
            Snelste Eerst
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── List ── */}
      {times.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏎</Text>
          <Text style={styles.emptyText}>Nog geen rondes ingevoerd</Text>
        </View>
      ) : (
        <FlatList
          data={sortedTimes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRow}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? 40 : 52,
    paddingHorizontal: 14,
  },

  // Title
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
  },
  titleAccent: { fontSize: 20 },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
  },
  titleCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Form
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  saveBtnText: {
    color: COLORS.bg,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // Sort bar
  sortBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  sortBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent + '18',
  },
  sortBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sortBtnTextActive: {
    color: COLORS.accent,
  },

  // Column header
  columnHeader: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  colHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  rowDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },

  // Lap cell (left)
  lapCell: {
    width: 48,
    alignItems: 'center',
  },
  lapLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  lapNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.accent,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
    lineHeight: 26,
  },

  // Content cells
  kartCell: { flex: 0.9, alignItems: 'flex-start' },
  timeCell: { flex: 1.4, alignItems: 'flex-start' },
  deltaCell: { flex: 1.2, alignItems: 'flex-start' },

  cellLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  kartBadge: {
    backgroundColor: COLORS.card,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kartBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  bestStar: {
    color: COLORS.best,
    fontSize: 12,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deltaValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Delete button
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.delete + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  deleteBtnText: {
    color: COLORS.delete,
    fontSize: 11,
    fontWeight: '800',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    opacity: 0.5,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
})