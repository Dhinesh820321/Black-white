import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export function SafeAreaProvider({ children }) {
  const { SafeAreaView } = require('react-native-safe-area-context');
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
}

export function StatusBar({ barStyle = 'dark-content', backgroundColor = 'white' }) {
  const { StatusBar: RNStatusBar } = require('react-native');
  return <RNStatusBar barStyle={barStyle} backgroundColor={backgroundColor} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
});

export default { SafeAreaProvider, StatusBar };
