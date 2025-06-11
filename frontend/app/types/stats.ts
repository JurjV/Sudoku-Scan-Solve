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
  }
  
  export const DEFAULT_STATS: PlayerStats = {
    puzzlesCompleted: { easy: 0, medium: 0, hard: 0 },
    averageTimes: { easy: [], medium: [], hard: [] }
  };