import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../utils/supabase'; // adjust path if utils is elsewhere

// Type for TypeScript
type Todo = {
  id: number
  name: string
}

export default function HomeScreen() {
  // State to hold the fetched todos
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  // useEffect runs once when the component loads
  useEffect(() => {
    async function fetchTodos() {
      const { data, error } = await supabase
        .from('todos')
        .select('*')

      console.log('DATA:', data)
      console.log('ERROR:', error)

      setTodos(data ?? [])
      setLoading(false)
    }

    fetchTodos()
  }, []) // Empty dependency array = run once on mount

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Todos from Supabase:</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : todos.length === 0 ? (
        <Text>No todos found</Text>
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <Text style={styles.todo}>{item.id} {item.name}</Text>}
        />
      )}
    </View>
  )
}

// Optional styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  todo: {
    fontSize: 16,
    marginBottom: 5,
  },
})