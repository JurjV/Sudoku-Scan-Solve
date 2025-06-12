import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DEFAULT_STATS, PlayerStats } from '../types/stats';
import { loadPlayerStats, loadUsername, saveUsername } from '../utils/statsStorage';

export default function ProfileScreen() {
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedStats, loadedUsername] = await Promise.all([
          loadPlayerStats(),
          loadUsername()
        ]);
        setStats(loadedStats);
        setUsername(loadedUsername);
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateAverage = (times: number[]) => {
    if (!times.length) return 0;
    const sum = times.reduce((a, b) => a + b, 0);
    return Math.floor(sum / times.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    await saveUsername(newUsername);
    setUsername(newUsername);
    setNewUsername('');
    setEditModalVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.usernameContainer}>
        <Text style={styles.usernameText}>{username || 'No username set'}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            setNewUsername(username || '');
            setEditModalVisible(true);
          }}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statCard}>
        <Text style={styles.difficultyHeader}>Streaks</Text>
        <View style={styles.statRow}>
          <Text>Current Streak:</Text>
          <Text style={styles.statValue}>{stats.streak.current} days</Text>
        </View>
        <View style={styles.statRow}>
          <Text>Longest Streak:</Text>
          <Text style={styles.statValue}>{stats.streak.longest} days</Text>
        </View>
      </View>

      {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
        <View key={difficulty} style={styles.statCard}>
          <Text style={styles.difficultyHeader}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Puzzles
          </Text>
          <View style={styles.statRow}>
            <Text>Completed:</Text>
            <Text style={styles.statValue}>
              {stats.puzzlesCompleted[difficulty]}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text>Average Time:</Text>
            <Text style={styles.statValue}>
              {formatTime(calculateAverage(stats.averageTimes[difficulty]))}
            </Text>
          </View>
        </View>
      ))}

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Username</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new username"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveUsername}
              >
                <Text style={styles.buttonText}>Save</Text>
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
    backgroundColor: '#2a2a2a',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  usernameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statValue: {
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});