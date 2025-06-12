import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { canPlayDailyPuzzle, getNextPuzzleTime, loadPlayerStats } from "./utils/statsStorage";

const BACKEND_CONFIG = {
  IP: "192.168.1.132",
  PORT: "5000",
};

export default function HomeScreen() {
  const router = useRouter();
  const [showDailyPuzzle, setShowDailyPuzzle] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const loadStreak = async () => {
      const stats = await loadPlayerStats();
      setStreak(stats.streak.current);
    };
    loadStreak();
  }, []);

  useEffect(() => {
    const checkPuzzleStatus = async () => {
      const canPlay = await canPlayDailyPuzzle();
      setShowDailyPuzzle(canPlay);
      if (!canPlay) {
        const time = await getNextPuzzleTime();
        setTimeRemaining(time);
      }
    };

    checkPuzzleStatus();

    // Update timer every minute
    const interval = setInterval(async () => {
      if (!showDailyPuzzle) {
        const time = await getNextPuzzleTime();
        setTimeRemaining(time);
      }
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [router, showDailyPuzzle]);

  const navigateWithConfig = (screen: string, params?: any) => {
    router.push({
      pathname: `./screens/${screen}`,
      params: { backendConfig: JSON.stringify(BACKEND_CONFIG), ...params },
    });
  };

  const startDailyPuzzle = () => {
    router.push({
      pathname: './screens/SudokuBoard',
      params: {
        backendConfig: JSON.stringify(BACKEND_CONFIG),
        isDailyPuzzle: 'true'
      },
    });
  };

  const generateRandomPuzzle = async (difficulty: string) => {
    try {
      const response = await fetch(`http://${BACKEND_CONFIG.IP}:${BACKEND_CONFIG.PORT}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty }),
      });

      const data = await response.json();
      if (data.grid) {
        navigateWithConfig("SudokuBoard", {
          grid: JSON.stringify(data.grid),
          difficulty: data.difficulty
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate puzzle. Using fallback.');
      // Fallback puzzle
      navigateWithConfig("SudokuBoard", {
        grid: JSON.stringify([
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ]),
        difficulty: 'medium'
      });
    }
    setShowDifficultyModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Sudoku Scan&Solve</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigateWithConfig("PhotoPage")}
      >
        <MaterialIcons name="photo-camera" size={24} color="white" />
        <Text style={styles.buttonText}>Start Scanning</Text>
      </TouchableOpacity>

      {showDailyPuzzle ? (
        <TouchableOpacity
          style={[styles.button, styles.dailyButton]}
          onPress={startDailyPuzzle}
        >
          <MaterialIcons name="today" size={24} color="white" />
          <Text style={styles.buttonText}>Daily Puzzle</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            Daily Puzzle Completed!
          </Text>
          <Text style={styles.completedText}>
            Current Streak: {streak} day(s)
          </Text>
          <Text style={styles.timerText}>
            Next puzzle in: {timeRemaining.hours}h {timeRemaining.minutes}m
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, styles.randomButton]}
        onPress={() => setShowDifficultyModal(true)}
      >
        <MaterialIcons name="casino" size={24} color="white" />
        <Text style={styles.buttonText}>Random Puzzle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigateWithConfig("Profile")}
      >
        <MaterialIcons name="person" size={24} color="white" />
        <Text style={styles.buttonText}>Profile</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showDifficultyModal}
        onRequestClose={() => setShowDifficultyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Difficulty</Text>
            
            <TouchableOpacity 
              style={[styles.difficultyButton, styles.easyButton]}
              onPress={() => generateRandomPuzzle('easy')}
            >
              <Text style={styles.difficultyButtonText}>Easy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.difficultyButton, styles.mediumButton]}
              onPress={() => generateRandomPuzzle('medium')}
            >
              <Text style={styles.difficultyButtonText}>Medium</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.difficultyButton, styles.hardButton]}
              onPress={() => generateRandomPuzzle('hard')}
            >
              <Text style={styles.difficultyButtonText}>Hard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowDifficultyModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#2a2a2a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgb(90, 90, 90)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
  },
  dailyButton: {
    backgroundColor: '#2196F3',
  },
  randomButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  completedContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  timerText: {
    color: '#BDBDBD',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  difficultyButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  easyButton: {
    backgroundColor: '#4CAF50',
  },
  mediumButton: {
    backgroundColor: '#FFC107',
  },
  hardButton: {
    backgroundColor: '#F44336',
  },
  difficultyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
  },
  cancelButtonText: {
    color: '#BDBDBD',
    fontSize: 16,
  },
});