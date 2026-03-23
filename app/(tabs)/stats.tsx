import React, { useEffect, useState } from 'react'
import { Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../utils/supabase'

type TimeEntry = {
  id: number
  time: string
  lap: number
}

export default function HomeScreen() {
  const [time, setTime] = useState('')
  const [lap, setLap] = useState('')
  const [times, setTimes] = useState<TimeEntry[]>([])
  const [sortMode, setSortMode] = useState<'lap' | 'fastest'>('lap')

  // 🔹 Fetch data
  async function fetchTimes() {
    const { data, error } = await supabase
      .from('times')
      .select('*')

    if (error) {
      console.log('Fetch error:', error.message)
    } else {
      setTimes(data ?? [])
    }
  }

  useEffect(() => {
    fetchTimes()
  }, [])

  // 🔹 Save data
  async function saveData() {
    if (!time || !lap) return

    const { error } = await supabase.from('times').insert([
      {
        time: time,
        lap: parseInt(lap),
      },
    ])

    if (error) {
      console.log('Error:', error.message)
    } else {
      setTime('')
      setLap('')
      fetchTimes() // refresh list
    }
  }

  // 🔹 Convert time string to seconds (for sorting)
  function timeToSeconds(t: string) {
    const parts = t.split(':')
    if (parts.length === 2) {
      const minutes = parseFloat(parts[0])
      const seconds = parseFloat(parts[1])
      return minutes * 60 + seconds
    }
    return parseFloat(t) || 0
  }

  // 🔹 Sorting logic
  const sortedTimes = [...times].sort((a, b) => {
    if (sortMode === 'lap') {
      return a.lap - b.lap
    } else {
      return timeToSeconds(a.time) - timeToSeconds(b.time)
    }
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Lap Time</Text>

      <TextInput
        placeholder="Time (e.g. 1:32.45)"
        value={time}
        onChangeText={setTime}
        style={styles.input}
      />

      <TextInput
        placeholder="Lap number (e.g. 1)"
        value={lap}
        onChangeText={setLap}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button title="Save" onPress={saveData} />

      {/* 🔹 Sort buttons */}
      <View style={{ marginTop: 20 }}>
        <Button title="Sort by Lap" onPress={() => setSortMode('lap')} />
        <Button title="Sort by Fastest Time" onPress={() => setSortMode('fastest')} />
      </View>

      {/* 🔹 List */}
      <FlatList
        data={sortedTimes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            Lap {item.lap} - {item.time}
          </Text>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  item: {
    fontSize: 16,
    marginTop: 10,
  },
})