import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_STATS, Difficulty, PlayerStats } from '../types/stats';

export const loadPlayerStats = async (): Promise<PlayerStats> => {
    try {
        const json = await AsyncStorage.getItem('@playerStats');
        return json ? JSON.parse(json) : DEFAULT_STATS;
    } catch (e) {
        console.error('Failed to load stats', e);
        return DEFAULT_STATS;
    }
};

export const normalizeDifficulty = (difficulty: string): Difficulty => {
    const lower = difficulty.toLowerCase();
    switch (lower) {
        case 'easy':
        case 'medium':
        case 'hard':
            return lower;
        default:
            return 'hard';
    }
};

export const savePlayerStats = async (stats: PlayerStats): Promise<void> => {
    try {
        await AsyncStorage.setItem('@playerStats', JSON.stringify(stats));
    } catch (e) {
        console.error('Failed to save stats', e);
    }
};

export const updateStatsAfterWin = async (
    difficulty: string,
    solveTime: number
  ): Promise<void> => {
    const normalizedDiff = normalizeDifficulty(difficulty);
    const currentStats = await loadPlayerStats();
    
    const updatedStats: PlayerStats = {
        puzzlesCompleted: {
            ...currentStats.puzzlesCompleted,
            [normalizedDiff]: currentStats.puzzlesCompleted[normalizedDiff] + 1
        },
        averageTimes: {
            ...currentStats.averageTimes,
            [normalizedDiff]: [...currentStats.averageTimes[normalizedDiff], solveTime]
        }
    };
  
    await savePlayerStats(updatedStats);
  };

  export const saveUsername = async (username: string): Promise<void> => {
    try {
        await AsyncStorage.setItem('@username', username);
    } catch (e) {
        console.error('Failed to save username', e);
    }
};

export const loadUsername = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem('@username');
    } catch (e) {
        console.error('Failed to load username', e);
        return null;
    }
};