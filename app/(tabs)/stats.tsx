/**
 * HomeScreen — Karting Lap Timer
 *
 * 💾 LOCAL STORAGE — Gebruikt AsyncStorage voor lokale opslag
 * Geen database nodig - alles wordt lokaal opgeslagen
 *
 * Tijdformaat: m:ss.hh  bijv. 1:32.45
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeEntry = {
  id: number
  time: string
  lap: number
  kart: number
  race_id: number
}

type Race = {
  id: number
  created_at: string
}

type SortMode = 'lap' | 'fastest'

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  bg: '#0b0c10',
  surface: '#13151a',
  card: '#1a1d24',
  border: '#252830',
  accent: '#e8ff00',
  fastest: '#00e676',
  fastestBg: '#00e67614',
  slowest: '#ff3d5a',
  slowestBg: '#ff3d5a14',
  best: '#ffd600',
  textPrimary: '#f0f2f5',
  textSecondary: '#6b7280',
  textMuted: '#3d4049',
  positive: '#00e676',
  negative: '#ff3d5a',
  neutral: '#6b7280',
  delete: '#ff3d5a',
  edit: '#60a5fa',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToSeconds(t: string): number {
  const parts = t.split(':')
  if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
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

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

function ConfirmModal({
  visible,
  lapNumber,
  onConfirm,
  onCancel,
}: {
  visible: boolean
  lapNumber: number | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Pressable style={mS.backdrop} onPress={onCancel}>
        <Pressable style={mS.box} onPress={() => {}}>
          <Text style={mS.icon}>🗑</Text>
          <Text style={mS.title}>Ronde verwijderen?</Text>
          <Text style={mS.body}>
            Wil je{' '}
            <Text style={mS.highlight}>Ronde {lapNumber}</Text>{' '}
            echt verwijderen?{'\n'}Dit kan niet ongedaan gemaakt worden.
          </Text>
          <View style={mS.btnRow}>
            <TouchableOpacity style={mS.cancelBtn} onPress={onCancel}>
              <Text style={mS.cancelText}>Annuleren</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mS.confirmBtn} onPress={onConfirm}>
              <Text style={mS.confirmText}>Verwijderen</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const mS = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000dd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  icon: { fontSize: 36, marginBottom: 12 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  highlight: {
    color: C.accent,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: C.card,
  },
  cancelText: { color: C.textSecondary, fontWeight: '700', fontSize: 14 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: C.delete,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 14 },
})

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  visible,
  entry,
  onSave,
  onCancel,
}: {
  visible: boolean
  entry: TimeEntry | null
  onSave: (id: number, time: string, kart: number) => void
  onCancel: () => void
}) {
  const [editTime, setEditTime] = useState('')
  const [editKart, setEditKart] = useState('')

  useEffect(() => {
    if (entry) {
      setEditTime(entry.time)
      setEditKart(String(entry.kart))
    }
  }, [entry])

  const canSave = editTime.trim() !== '' && editKart.trim() !== ''

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={eS.backdrop} onPress={onCancel}>
        <Pressable style={eS.sheet} onPress={() => {}}>
          <View style={eS.handle} />
          <Text style={eS.title}>✏️  Ronde {entry?.lap} bewerken</Text>

          <Text style={eS.fieldLabel}>Kart nummer</Text>
          <TextInput
            style={eS.input}
            value={editKart}
            onChangeText={setEditKart}
            keyboardType="numeric"
            placeholderTextColor={C.textMuted}
            placeholder="Kart #"
          />

          <Text style={eS.fieldLabel}>Ronde tijd</Text>
          <TextInput
            style={eS.input}
            value={editTime}
            onChangeText={setEditTime}
            placeholderTextColor={C.textMuted}
            placeholder="bv. 1:32.45"
          />

          <View style={eS.btnRow}>
            <TouchableOpacity style={eS.cancelBtn} onPress={onCancel}>
              <Text style={eS.cancelText}>Annuleren</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[eS.saveBtn, !canSave && eS.saveBtnDisabled]}
              disabled={!canSave}
              onPress={() =>
                entry && onSave(entry.id, editTime.trim(), parseInt(editKart))
              }
            >
              <Text style={eS.saveText}>Opslaan</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const eS = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: C.textPrimary,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
    marginBottom: 16,
  },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: C.card,
  },
  cancelText: { color: C.textSecondary, fontWeight: '700', fontSize: 14 },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: C.edit,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: C.border },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 14 },
})

// ─── Main (Racing) Screen ─────────────────────────────────────────────────────

export default function HomeScreen() {
  const [currentRace, setCurrentRace] = useState<Race | null>(null)
  const [times, setTimes] = useState<TimeEntry[]>([])
  const [kartInput, setKartInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('lap')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null)
  const [editTarget, setEditTarget] = useState<TimeEntry | null>(null)
  const [nextRaceId, setNextRaceId] = useState(1)
  const [nextTimeId, setNextTimeId] = useState(1)

  const flashAnim = useRef(new Animated.Value(0)).current

  // ── Initialize on mount ──────────────────────────────────────────────────

  useEffect(() => {
    initializeApp()
  }, [])

  async function initializeApp() {
    await loadIds()
    await startNewRace()
  }

  async function loadIds() {
    try {
      const raceId = await AsyncStorage.getItem('nextRaceId')
      const timeId = await AsyncStorage.getItem('nextTimeId')
      if (raceId) setNextRaceId(parseInt(raceId))
      if (timeId) setNextTimeId(parseInt(timeId))
    } catch (e) {
      console.log('Error loading IDs:', e)
    }
  }

  async function saveIds() {
    try {
      await AsyncStorage.setItem('nextRaceId', String(nextRaceId))
      await AsyncStorage.setItem('nextTimeId', String(nextTimeId))
    } catch (e) {
      console.log('Error saving IDs:', e)
    }
  }

  async function fetchTimes(raceId: number) {
    try {
      const allTimes = await AsyncStorage.getItem('times')
      const parsed = allTimes ? JSON.parse(allTimes) : []
      const filtered = parsed.filter((t: TimeEntry) => t.race_id === raceId)
      setTimes(filtered)
    } catch (e) {
      console.log('Error fetching times:', e)
      setTimes([])
    }
  }

  async function getAllTimes(): Promise<TimeEntry[]> {
    try {
      const allTimes = await AsyncStorage.getItem('times')
      return allTimes ? JSON.parse(allTimes) : []
    } catch (e) {
      console.log('Error getting all times:', e)
      return []
    }
  }

  // ── Start new race ─────────────────────────────────────────────────────────

  async function startNewRace() {
    const newRace: Race = {
      id: nextRaceId,
      created_at: new Date().toISOString(),
    }
    setCurrentRace(newRace)
    setTimes([])
    setKartInput('')
    setTimeInput('')
    setNextRaceId(nextRaceId + 1)
    await AsyncStorage.setItem('nextRaceId', String(nextRaceId + 1))
  }

  // ── Auto-compute next lap per kart ────────────────────────────────────────

  function getNextLap(kartNum: number): number {
    const entries = times.filter((t) => t.kart === kartNum)
    if (entries.length === 0) return 1
    return Math.max(...entries.map((t) => t.lap)) + 1
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function saveData() {
    if (!kartInput || !timeInput || !currentRace) return
    const kartNum = parseInt(kartInput)
    const nextLap = getNextLap(kartNum)
    setSaving(true)

    try {
      const allTimes = await getAllTimes()
      const newEntry: TimeEntry = {
        id: nextTimeId,
        time: timeInput,
        lap: nextLap,
        kart: kartNum,
        race_id: currentRace.id,
      }
      allTimes.push(newEntry)
      await AsyncStorage.setItem('times', JSON.stringify(allTimes))
      setNextTimeId(nextTimeId + 1)
      await AsyncStorage.setItem('nextTimeId', String(nextTimeId + 1))
      
      setSaving(false)
      setTimeInput('')
      fetchTimes(currentRace.id)
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start()
    } catch (e) {
      console.log('Error saving data:', e)
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      const allTimes = await getAllTimes()
      const filtered = allTimes.filter((t) => t.id !== deleteTarget.id)
      await AsyncStorage.setItem('times', JSON.stringify(filtered))
      if (currentRace) fetchTimes(currentRace.id)
    } catch (e) {
      console.log('Error deleting:', e)
    }
    setDeleteTarget(null)
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  async function saveEdit(id: number, time: string, kart: number) {
    try {
      const allTimes = await getAllTimes()
      const updated = allTimes.map((t) =>
        t.id === id ? { ...t, time, kart } : t
      )
      await AsyncStorage.setItem('times', JSON.stringify(updated))
      if (currentRace) fetchTimes(currentRace.id)
    } catch (e) {
      console.log('Error updating:', e)
    }
    setEditTarget(null)
  }

  // ── Sort + stats ──────────────────────────────────────────────────────────

  const sortedTimes = [...times].sort((a, b) =>
    sortMode === 'lap'
      ? a.lap - b.lap || a.kart - b.kart
      : timeToSeconds(a.time) - timeToSeconds(b.time)
  )

  const allSec = times.map((t) => timeToSeconds(t.time))
  const fastestSec = allSec.length ? Math.min(...allSec) : null
  const slowestSec = allSec.length ? Math.max(...allSec) : null

  const bestPerKart: Record<number, number> = {}
  times.forEach((t) => {
    const s = timeToSeconds(t.time)
    if (bestPerKart[t.kart] === undefined || s < bestPerKart[t.kart]) {
      bestPerKart[t.kart] = s
    }
  })

  function getDelta(entry: TimeEntry): number | null {
    const prev = [...times]
      .filter((t) => t.kart === entry.kart && t.lap < entry.lap)
      .sort((a, b) => b.lap - a.lap)[0]
    if (!prev) return null
    return timeToSeconds(entry.time) - timeToSeconds(prev.time)
  }

  const kartNum = parseInt(kartInput)
  const nextLapPreview = kartInput && !isNaN(kartNum) ? getNextLap(kartNum) : null

  // ── Row ───────────────────────────────────────────────────────────────────

  function renderRow({ item }: { item: TimeEntry }) {
    const sec = timeToSeconds(item.time)
    const isFastest = sec === fastestSec
    const isSlowest = sec === slowestSec && times.length > 1
    const isBestForKart = sec === bestPerKart[item.kart]
    const delta = getDelta(item)
    const rowBg = isFastest ? C.fastestBg : isSlowest ? C.slowestBg : undefined
    const timeColor = isFastest ? C.fastest : isSlowest ? C.slowest : C.textPrimary
    const deltaColor =
      delta === null ? C.neutral : delta < 0 ? C.positive : delta > 0 ? C.negative : C.neutral

    return (
      <View style={[s.row, rowBg ? { backgroundColor: rowBg } : null]}>
        <View style={s.lapCell}>
          <Text style={s.lapLabel}>RND</Text>
          <Text style={s.lapNumber}>{item.lap}</Text>
        </View>

        <View style={s.rowDivider} />

        <View style={s.kartCell}>
          <Text style={s.cellLabel}>KART</Text>
          <View style={s.kartBadge}>
            <Text style={s.kartBadgeText}>#{item.kart}</Text>
          </View>
        </View>

        <View style={s.timeCell}>
          <Text style={s.cellLabel}>TIJD</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isBestForKart && <Text style={s.bestStar}>★</Text>}
            <Text style={[s.timeValue, { color: timeColor }]}>{item.time}</Text>
          </View>
        </View>

        <View style={s.deltaCell}>
          <Text style={s.cellLabel}>VERSCHIL</Text>
          <Text style={[s.deltaValue, { color: deltaColor }]}>
            {delta === null ? '—' : formatDelta(delta)}
          </Text>
        </View>

        <View style={s.actionBtns}>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => setEditTarget(item)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={s.editBtnText}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => setDeleteTarget(item)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Text style={s.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const ListHeader = (
    <View>
      <View style={s.columnHeader}>
        <Text style={[s.colHeaderText, { width: 52 }]}>RND</Text>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Text style={[s.colHeaderText, { flex: 0.9 }]}>KART</Text>
          <Text style={[s.colHeaderText, { flex: 1.4 }]}>TIJD</Text>
          <Text style={[s.colHeaderText, { flex: 1.2 }]}>VERSCHIL</Text>
        </View>
      </View>
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.fastest }]} />
          <Text style={s.legendText}>Snelste</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: C.slowest }]} />
          <Text style={s.legendText}>Traagste</Text>
        </View>
        <View style={s.legendItem}>
          <Text style={{ color: C.best, fontSize: 11 }}>★</Text>
          <Text style={s.legendText}>Beste / kart</Text>
        </View>
      </View>
    </View>
  )

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Title bar */}
      <View style={s.titleBar}>
        <Text style={s.title}>
          🏁 LAP TIMER
        </Text>
        <Text style={s.titleCount}>
          {times.length} {times.length === 1 ? 'ronde' : 'rondes'}
        </Text>
      </View>

      {/* Input form */}
      <Animated.View
          style={[
            s.form,
            {
              opacity: flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.35],
              }),
            },
          ]}
        >
          <View style={s.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Kart #</Text>
              <TextInput
                placeholder="bv. 10"
                placeholderTextColor={C.textMuted}
                value={kartInput}
                onChangeText={setKartInput}
                keyboardType="numeric"
                style={s.textInput}
              />
            </View>

            <View style={{ width: 10 }} />

            <View style={{ flex: 1.6 }}>
              <Text style={s.fieldLabel}>Ronde Tijd</Text>
              <TextInput
                placeholder="bv. 1:32.45"
                placeholderTextColor={C.textMuted}
                value={timeInput}
                onChangeText={setTimeInput}
                style={s.textInput}
              />
            </View>

            <View style={s.nextLapBadgeWrapper}>
              <Text style={s.fieldLabel}>Ronde</Text>
              <View style={s.nextLapBadge}>
                <Text style={s.nextLapText}>
                  {nextLapPreview !== null ? nextLapPreview : '—'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[s.saveBtn, (!kartInput || !timeInput) && s.saveBtnDisabled]}
            onPress={saveData}
            disabled={saving || !kartInput || !timeInput}
            activeOpacity={0.8}
          >
            <Text style={s.saveBtnText}>
              {saving ? 'OPSLAAN…' : `+ RONDE ${nextLapPreview ?? ''} TOEVOEGEN`}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      {/* Sort bar */}
      <View style={s.sortBar}>
        <TouchableOpacity
          style={[s.sortBtn, sortMode === 'lap' && s.sortBtnActive]}
          onPress={() => setSortMode('lap')}
        >
          <Text style={[s.sortBtnText, sortMode === 'lap' && s.sortBtnTextActive]}>
            Op Ronde
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.sortBtn, sortMode === 'fastest' && s.sortBtnActive]}
          onPress={() => setSortMode('fastest')}
        >
          <Text style={[s.sortBtnText, sortMode === 'fastest' && s.sortBtnTextActive]}>
            Snelste Eerst
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {times.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>🏎</Text>
          <Text style={s.emptyText}>Nog geen rondes ingevoerd</Text>
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

      <ConfirmModal
        visible={deleteTarget !== null}
        lapNumber={deleteTarget?.lap ?? null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <EditModal
        visible={editTarget !== null}
        entry={editTarget}
        onSave={saveEdit}
        onCancel={() => setEditTarget(null)}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingTop: Platform.OS === 'android' ? 40 : 52,
    paddingHorizontal: 14,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: 2,
    fontFamily:
      Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
  },
  titleCount: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: C.textPrimary,
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  nextLapBadgeWrapper: { marginLeft: 10, alignItems: 'center' },
  nextLapBadge: {
    backgroundColor: C.accent + '20',
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minWidth: 52,
    alignItems: 'center',
  },
  nextLapText: {
    color: C.accent,
    fontSize: 18,
    fontWeight: '900',
    fontFamily:
      Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
  },
  saveBtn: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: C.border },
  saveBtnText: {
    color: C.bg,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sortBar: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  sortBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: C.surface,
  },
  sortBtnActive: {
    borderColor: C.accent,
    backgroundColor: C.accent + '18',
  },
  sortBtnText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sortBtnTextActive: { color: C.accent },
  columnHeader: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  colHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.textMuted,
    textTransform: 'uppercase',
  },
  legend: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, color: C.textSecondary, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  rowDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.border,
    marginHorizontal: 8,
  },
  lapCell: { width: 44, alignItems: 'center' },
  lapLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  lapNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: C.accent,
    fontFamily:
      Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-condensed',
    lineHeight: 24,
  },
  kartCell: { flex: 0.9, alignItems: 'flex-start' },
  timeCell: { flex: 1.4, alignItems: 'flex-start' },
  deltaCell: { flex: 1.2, alignItems: 'flex-start' },
  cellLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: C.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kartBadge: {
    backgroundColor: C.card,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  kartBadgeText: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bestStar: { color: C.best, fontSize: 11 },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  deltaValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionBtns: { flexDirection: 'row', gap: 6, marginLeft: 4 },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.edit + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { color: C.edit, fontSize: 14, fontWeight: '700' },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.delete + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { color: C.delete, fontSize: 11, fontWeight: '800' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    opacity: 0.5,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
})