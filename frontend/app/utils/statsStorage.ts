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
        ...currentStats,
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

  export const updateStreak = async (): Promise<void> => {
    const currentStats = await loadPlayerStats();
    const today = new Date().toISOString().split('T')[0];
    
    if (currentStats.streak.lastCompletedDate === today) {
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const isConsecutive = currentStats.streak.lastCompletedDate === yesterdayStr;
    
    const updatedStats: PlayerStats = {
        ...currentStats,
        streak: {
            current: isConsecutive ? currentStats.streak.current + 1 : 1,
            longest: Math.max(
                currentStats.streak.longest,
                isConsecutive ? currentStats.streak.current + 1 : 1
            ),
            lastCompletedDate: today
        }
    };

    await savePlayerStats(updatedStats);
};

export const markDailyPuzzleCompleted = async (): Promise<void> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem('@lastDailyPuzzleDate', today);
    } catch (e) {
        console.error('Failed to mark daily puzzle as completed', e);
    }
};

export const canPlayDailyPuzzle = async (): Promise<boolean> => {
    try {
        const lastDate = await AsyncStorage.getItem('@lastDailyPuzzleDate');
        const today = new Date().toISOString().split('T')[0];
        return lastDate !== today;
    } catch (e) {
        console.error('Failed to check daily puzzle status', e);
        return true;
    }
};

export const getNextPuzzleTime = async (): Promise<{hours: number, minutes: number}> => {
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diff = tomorrow.getTime() - now.getTime();
        return {
            hours: Math.floor(diff / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        };
    } catch (e) {
        console.error('Failed to calculate next puzzle time', e);
        return { hours: 0, minutes: 0 };
    }
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