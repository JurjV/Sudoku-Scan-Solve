export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlayerStats {
    puzzlesCompleted: {
      easy: number;
      medium: number;
      hard: number;
    };
    averageTimes: {
      easy: number[];
      medium: number[];
      hard: number[];
    };
    streak: {
      current: number;
      longest: number;
      lastCompletedDate: string | null;
    };
  }
  
  export const DEFAULT_STATS: PlayerStats = {
    puzzlesCompleted: { easy: 0, medium: 0, hard: 0 },
    averageTimes: { easy: [], medium: [], hard: [] },
    streak: {
      current: 0,
      longest: 0,
      lastCompletedDate: null
    }
  };