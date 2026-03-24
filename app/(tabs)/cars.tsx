import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from '../../src/context/ThemeContext';

export default function Cars() {
  const { darkMode, toggleDarkMode } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <View style={[s.container, darkMode && s.containerDark]}>
      <View style={s.toolbar}>
        <TouchableOpacity onPress={() => setSettingsOpen((v) => !v)} style={[s.settingsBtn, darkMode && s.settingsBtnDark]}>
          <Text style={[s.settingsBtnText, darkMode && s.settingsBtnTextDark]}>⚙️</Text>
        </TouchableOpacity>
      </View>
      {settingsOpen && (
        <View style={[s.dropdown, darkMode && s.dropdownDark]}>
          <TouchableOpacity onPress={() => { toggleDarkMode(); setSettingsOpen(false) }} style={s.dropdownItem}>
            <Text style={[s.dropdownText, darkMode && s.dropdownTextDark]}>{darkMode ? 'Schakel lichtmodus' : 'Schakel darkmode'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={[s.dropdownItem, s.dropdownItemMuted]}>
            <Text style={[s.dropdownText, darkMode && s.dropdownTextDark]}>Inloggen / Uitloggen (later)</Text>
          </TouchableOpacity>
        </View>
      )}
      <Image source={require('../../assets/images/Vonk_E-racing_logo.png')} style={s.logo} />
      <Text style={s.title}>🏎️ KARTS</Text>
      <Text style={s.subtitle}>Kart management coming soon...</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFACD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
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
  containerDark: {
    backgroundColor: '#0b0c10',
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