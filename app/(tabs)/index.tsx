import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';

export default function HomeScreen() {
  const { darkMode, toggleDarkMode } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const themeStyles = darkMode ? darkStyles : styles

  return (
    <View style={themeStyles.container}>
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
      <Image source={require('../../assets/images/Vonk_E-racing_logo.png')} style={themeStyles.logo} />
      <Text style={themeStyles.title}>Vonk E-Racing</Text>
      <Text style={themeStyles.subtitle}>Welkom bij de karting lap timer</Text>

      <TouchableOpacity style={themeStyles.button} onPress={() => router.push('/races')}>
        <Text style={themeStyles.buttonText}>Races Beheren</Text>
      </TouchableOpacity>

      <TouchableOpacity style={themeStyles.button} onPress={() => router.push('/cars')}>
        <Text style={themeStyles.buttonText}>Cars</Text>
      </TouchableOpacity>

      <TouchableOpacity style={themeStyles.button} onPress={() => router.push('/stats')}>
        <Text style={themeStyles.buttonText}>Stats</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFACD', // Light lemon background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF1493', // Magenta
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFA500', // Orange
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FFD700', // Golden yellow
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '80%',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5, // For Android shadow
  },
  buttonText: {
    color: '#FF1493', // Magenta text on yellow button
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
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
    color: '#1f2a4d',
    fontSize: 16,
  },
  settingsBtnTextDark: {
    color: '#FFD700',
  },
  dropdown: {
    width: 220,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffd700',
    borderRadius: 10,
    marginBottom: 12,
    paddingVertical: 8,
  },
  dropdownDark: {
    backgroundColor: '#1c2235',
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
    color: '#1f2a4d',
    fontSize: 14,
  },
  dropdownTextDark: {
    color: '#e6e8ff',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#0b0c10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f0f2f5',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#d0d0d0',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1a1d24',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '80%',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toolbar: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  settingsBtn: {
    backgroundColor: '#2b2d33',
    borderRadius: 999,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  settingsBtnDark: {
    backgroundColor: '#141823',
    borderColor: '#FFA500',
  },
  settingsBtnText: {
    color: '#FFD700',
    fontSize: 16,
  },
  settingsBtnTextDark: {
    color: '#FFD700',
  },
  dropdown: {
    width: 220,
    backgroundColor: '#1d2235',
    borderWidth: 1,
    borderColor: '#2e3562',
    borderRadius: 10,
    marginBottom: 12,
    paddingVertical: 8,
  },
  dropdownDark: {
    backgroundColor: '#141823',
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
    color: '#e6e8ff',
    fontSize: 14,
  },
  dropdownTextDark: {
    color: '#e6e8ff',
  },
});