/**
 * Speedrun Tab
 * Speedrun outreach view (placeholder for now)
 */

import { View, Text, StyleSheet } from 'react-native';

export default function SpeedrunScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speedrun</Text>
      <Text style={styles.subtitle}>Speedrun features coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

