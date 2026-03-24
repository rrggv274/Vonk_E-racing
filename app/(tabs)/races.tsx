import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/utils/supabase';

// Type for Race
type Race = {
  id: number;
  name: string;
  created_at: string;
};

export default function RacesScreen() {
  const { darkMode, toggleDarkMode } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRaceModal, setShowNewRaceModal] = useState(false);
  const [newRaceName, setNewRaceName] = useState('');

  useEffect(() => {
    fetchRaces();
  }, []);

  async function fetchRaces() {
    const { data, error } = await supabase
      .from('races')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching races:', error);
      Alert.alert('Error', `Kon races niet laden: ${error.message}`);
    } else {
      setRaces(data ?? []);
    }
    setLoading(false);
  }

  async function createNewRace() {
    if (!newRaceName.trim()) {
      Alert.alert('Error', 'Voer een naam in voor de race.');
      return;
    }

    const { data, error } = await supabase
      .from('races')
      .insert([{ name: newRaceName }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewRaceName('');
      setShowNewRaceModal(false);
      fetchRaces(); // Refresh list
      // Optionally navigate to stats
      router.push(`/stats?race_id=${data.id}`);
    }
  }

  function viewRace(race: Race) {
    router.push(`/stats?race_id=${race.id}`);
  }

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setSettingsOpen((v) => !v)} style={[styles.settingsBtn, darkMode && styles.settingsBtnDark]}>
          <Text style={[styles.settingsBtnText, darkMode && styles.settingsBtnTextDark]}>⚙️</Text>
        </TouchableOpacity>
      </View>
      {settingsOpen && (
        <View style={[styles.dropdown, darkMode && styles.dropdownDark]}>
          <TouchableOpacity onPress={() => { toggleDarkMode(); setSettingsOpen(false) }} style={styles.dropdownItem}>
            <Text style={[styles.dropdownText, darkMode && styles.dropdownTextDark]}>{darkMode ? 'Schakel lichtmodus' : 'Schakel darkmode'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={[styles.dropdownItem, styles.dropdownItemMuted]}>
            <Text style={[styles.dropdownText, darkMode && styles.dropdownTextDark]}>Inloggen / Uitloggen (later)</Text>
          </TouchableOpacity>
        </View>
      )}
      <Image source={require('../../assets/images/Vonk_E-racing_logo.png')} style={styles.logo} />
      <Text style={[styles.title, darkMode && styles.titleDark]}>Races</Text>

      <TouchableOpacity style={styles.button} onPress={() => setShowNewRaceModal(true)}>
        <Text style={styles.buttonText}>Nieuwe Race Starten</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Alle Races:</Text>
      {loading ? (
        <Text style={styles.loadingText}>Laden...</Text>
      ) : races.length === 0 ? (
        <Text style={styles.noRacesText}>Geen races gevonden</Text>
      ) : (
        <FlatList
          data={races}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.raceItem} onPress={() => viewRace(item)}>
              <Text style={styles.raceText}>{item.name}</Text>
              <Text style={styles.raceDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* New Race Modal */}
      <Modal visible={showNewRaceModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nieuwe Race</Text>
            <TextInput
              style={styles.input}
              placeholder="Naam van de race (bijv. Lelystad)"
              value={newRaceName}
              onChangeText={setNewRaceName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowNewRaceModal(false)}>
                <Text style={styles.cancelText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={createNewRace}>
                <Text style={styles.confirmText}>Start Race</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFACD',
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 10,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#E4C669',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#C98C71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#C76C9F',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#CC9B64',
    marginBottom: 15,
  },
  loadingText: {
    color: '#A88045',
    textAlign: 'center',
  },
  noRacesText: {
    color: '#B06493',
    textAlign: 'center',
  },
  raceItem: {
    backgroundColor: '#E6D19B',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#C8A275',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  raceText: {
    color: '#7A4568',
    fontSize: 16,
    fontWeight: '700',
  },
  raceDate: {
    color: '#836D5F',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#FFFFFFaa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FCF8E5',
    padding: 20,
    borderRadius: 15,
    width: '80%',
    shadowColor: '#C7A38A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    color: '#FF1493',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFD700',
    color: '#FF1493',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
  },
  cancelText: {
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#FF1493',
    padding: 10,
    borderRadius: 10,
    flex: 1,
  },
  confirmText: {
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  toolbar: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  settingsBtn: {
    backgroundColor: '#ffed9a',
    borderRadius: 999,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  settingsBtnDark: {
    backgroundColor: '#1a1d24',
    borderColor: '#FFA500',
  },
  settingsBtnText: {
    color: '#1d2d50',
    fontSize: 16,
  },
  settingsBtnTextDark: {
    color: '#FFD700',
  },
  dropdown: {
    width: 240,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffd700',
    borderRadius: 10,
    marginBottom: 12,
    paddingVertical: 8,
  },
  dropdownDark: {
    backgroundColor: '#1d2235',
    borderColor: '#2e3562',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemMuted: {
    opacity: 0.7,
  },
  dropdownText: {
    color: '#1d2d50',
    fontSize: 14,
  },
  dropdownTextDark: {
    color: '#e6e8ff',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 20,
    color: '#333',
  },
  settingsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    padding: 8,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  settingsText: {
    fontSize: 16,
    color: '#FF1493',
  },
  containerDark: {
    backgroundColor: '#0b0c10',
  },
  titleDark: {
    color: '#f0f2f5',
  },
  headerTextDark: {
    color: '#fff',
  },
  settingsButtonDark: {
    backgroundColor: '#1a1d24',
    borderColor: '#FFA500',
  },
  settingsTextDark: {
    color: '#FFD700',
  },
});