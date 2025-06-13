import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DigitCell from '../components/DigitCell';
import Keypad from '../components/KeyPad';
import { BACKEND_URL } from '../utils/config';
import { markDailyPuzzleCompleted, normalizeDifficulty, updateStatsAfterWin, updateStreak } from '../utils/statsStorage';

export default function SudokuBoard() {
    const { grid, isDailyPuzzle, difficulty } = useLocalSearchParams();
    
    const parsed = typeof grid === 'string' ? JSON.parse(grid) : grid;
    const [board, setBoard] = useState<number[][]>(parsed || Array(9).fill(Array(9).fill(0)));
    const [fixed, setFixed] = useState<boolean[][]>(
        Array(9).fill(null).map(() => Array(9).fill(false))
    );
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [stage, setStage] = useState<'edit' | 'solve'>(isDailyPuzzle === 'true' || difficulty ? 'solve' : 'edit');
    const [mistakes, setMistakes] = useState<boolean[][]>(
        Array(9).fill(null).map(() => Array(9).fill(false))
    );
    const [solution, setSolution] = useState<number[][] | null>(null);
    const [hintCount, setHintCount] = useState(3);
    const [timer, setTimer] = useState(0);
    const [intervalId, setIntervalId] = useState<number | null>(null);
    const [notesMode, setNotesMode] = useState(false);
    const [notes, setNotes] = useState<boolean[][][]>(
        Array(9).fill(null).map(() =>
            Array(9).fill(null).map(() =>
                Array(9).fill(false)
            )
        )
    );
    const screenWidth = Dimensions.get('window').width;
    const gridPadding = 32;
    const gridWidth = screenWidth - gridPadding;
    const cellSize = gridWidth / 9;
    const [actualDifficulty, setDifficulty] = useState(difficulty ? normalizeDifficulty(difficulty as string) : normalizeDifficulty('medium'));
    const [showControls, setShowControls] = useState(true);
    const [isDailyChallenge, setIsDailyChallenge] = useState(isDailyPuzzle === 'true');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (isDailyChallenge && !grid) {
            fetchDailyPuzzle();
        }
        
        // Auto-confirm if it's a daily or random puzzle
        if (isDailyPuzzle === 'true' || difficulty) {
            const confirmAndStart = async () => {
                try {
                    // Mark all non-zero cells as fixed
                    const newFixed = board.map(row => 
                        row.map(cell => cell !== 0)
                    );
                    setFixed(newFixed);
                    
                    // Start timer immediately
                    setTimer(0);
                    const id = setInterval(() => {
                        setTimer(t => t + 1);
                    }, 1000) as unknown as number;
                    setIntervalId(id);
                    
                    // For random puzzles, we need to analyze to get solution
                    if (difficulty) {
                        setIsAnalyzing(true);
                        try {
                            const response = await fetch(`${BACKEND_URL}/analyze`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ grid: board }),
                            });
                            
                            const data = await response.json();
                            if (data.solution) {
                                setSolution(data.solution);
                            }
                        } finally {
                            setIsAnalyzing(false);
                        }
                    }
                    
                } catch (err) {
                    console.error('Failed to auto-confirm puzzle', err);
                }
            };
            
            confirmAndStart();
        }
    }, []);

    const fetchDailyPuzzle = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/daily`);
            const data = await response.json();
            if (data.grid) {
                setBoard(data.grid);
                setDifficulty(normalizeDifficulty(data.difficulty || 'medium'));
            }
        } catch (error) {
            console.error('Failed to fetch daily puzzle', error);
            Alert.alert('Error', 'Could not load daily puzzle. Using fallback puzzle.');
            setBoard([
                [5, 3, 0, 0, 7, 0, 0, 0, 0],
                [6, 0, 0, 1, 9, 5, 0, 0, 0],
                [0, 9, 8, 0, 0, 0, 0, 6, 0],
                [8, 0, 0, 0, 6, 0, 0, 0, 3],
                [4, 0, 0, 8, 0, 3, 0, 0, 1],
                [7, 0, 0, 0, 2, 0, 0, 0, 6],
                [0, 6, 0, 0, 0, 0, 2, 8, 0],
                [0, 0, 0, 4, 1, 9, 0, 0, 5],
                [0, 0, 0, 0, 8, 0, 0, 7, 9]
            ]);
        }
    };

    const handleDigit = (digit: number) => {
        if (!selectedCell) return;

        if (stage === 'solve' && fixed[selectedCell.row][selectedCell.col]) return;

        if (notesMode) {
            const updatedNotes = [...notes];
            updatedNotes[selectedCell.row][selectedCell.col][digit - 1] =
                !updatedNotes[selectedCell.row][selectedCell.col][digit - 1];
            setNotes(updatedNotes);
        } else {
            const updated = [...board];
            updated[selectedCell.row][selectedCell.col] = digit;
            setBoard(updated);

            const updatedNotes = [...notes];
            updatedNotes[selectedCell.row][selectedCell.col] = Array(9).fill(false);
            setNotes(updatedNotes);
        }
    };

    const handleClear = () => {
        if (!selectedCell) return;

        if (stage === 'solve' && fixed[selectedCell.row][selectedCell.col]) return;

        if (notesMode) {
            const updatedNotes = [...notes];
            updatedNotes[selectedCell.row][selectedCell.col] = Array(9).fill(false);
            setNotes(updatedNotes);
        } else {
            const updated = [...board];
            updated[selectedCell.row][selectedCell.col] = 0;
            setBoard(updated);
        }
    };

    const confirmGrid = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grid: board }),
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                Alert.alert('Puzzle Not Valid', data.error || 'This Sudoku puzzle cannot be solved.');
                return;
            }

            const newFixed = board.map(row => row.map(cell => cell !== 0));
            setFixed(newFixed);

            setSolution(data.solution);
            setStage('solve');
            setTimer(0);
            const id = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000) as unknown as number;
            setIntervalId(id);

            setDifficulty(normalizeDifficulty(data.difficulty));
            Alert.alert('Puzzle Validated', `Difficulty: ${data.difficulty}`);
        } catch (err) {
            Alert.alert('Error', 'Failed to analyze puzzle.');
            console.error(err);
        }
    };

    const handlePuzzleComplete = async () => {
        if (intervalId) clearInterval(intervalId as unknown as NodeJS.Timeout);
        const solveTime = timer;

        await updateStatsAfterWin(actualDifficulty, solveTime);
        
        if (isDailyChallenge) {
            await updateStreak();
            await markDailyPuzzleCompleted();
        }

        const mins = Math.floor(solveTime / 60);
        const secs = solveTime % 60;

        Alert.alert(
            'Congratulations!',
            `Solved ${actualDifficulty} puzzle in ${mins}m ${secs < 10 ? '0' : ''}${secs}s!`,
            [{ text: 'OK', onPress: () => router.back() }]
        );
    };

    const checkMistakes = () => {
        if (!solution) return;
        const updated = board.map((row, r) =>
            row.map((val, c) => fixed[r][c] ? false : val !== 0 && val !== solution[r][c])
        );
        setMistakes(updated);

        const wrongs = updated.flat().filter(x => x).length;
        const empties = board.flat().filter((v, idx) => !fixed[Math.floor(idx / 9)][idx % 9] && v === 0).length;

        if (wrongs === 0 && empties === 0) {
            handlePuzzleComplete();
        }
    };

    const applyHint = () => {
        if (!solution) return;
        if (hintCount <= 0) {
            Alert.alert("No More Hints", "You have used all 3 hints for this round.");
            return;
        }

        if (!selectedCell) {
            Alert.alert("Select a Cell", "Please select an empty cell to get a hint.");
            return;
        }

        if (board[selectedCell.row][selectedCell.col] !== 0) {
            Alert.alert("Cell Not Empty", "Please select an empty cell to get a hint.");
            return;
        }

        const updated = [...board];
        updated[selectedCell.row][selectedCell.col] = solution[selectedCell.row][selectedCell.col];
        setBoard(updated);

        const updatedNotes = [...notes];
        updatedNotes[selectedCell.row][selectedCell.col] = Array(9).fill(false);
        setNotes(updatedNotes);

        setHintCount(prev => prev - 1);
    };

    const solveAll = () => {
        Alert.alert('Solve Puzzle', 'Are you sure you want to auto-solve the puzzle?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Solve',
                onPress: () => {
                    if (solution) {
                        setBoard(solution);
                        setFixed(Array(9).fill(null).map(() => Array(9).fill(true)));
                        if (intervalId) clearInterval(intervalId as unknown as NodeJS.Timeout);
                        setShowControls(false);
                    }
                },
            },
        ]);
    };

    const selectedVal = selectedCell ? board[selectedCell.row][selectedCell.col] : null;

    return (
        <View style={styles.fullScreen}>
            <View style={styles.container}>
                <View style={styles.topBar}>
                    <Text style={styles.title}>Sudoku Scan&Solve</Text>
                    <Text style={styles.timer}>
                        {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </Text>
                </View>

                {isAnalyzing && (
                    <View style={styles.loadingOverlay}>
                        <Text style={styles.loadingText}>Analyzing puzzle...</Text>
                    </View>
                )}

                {showControls && (stage === 'solve') && (
                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[styles.toggleButton, notesMode && styles.activeToggle]}
                            onPress={() => setNotesMode(!notesMode)}
                        >
                            <Text style={styles.toggleText}>Notes {notesMode ? 'ON' : 'OFF'}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.gridContainer}>
                    <View style={[styles.grid, { width: gridWidth }]}>
                        {board.map((row, rIdx) => (
                            <View key={rIdx} style={styles.row}>
                                {row.map((val, cIdx) => {
                                    const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
                                    const highlight = selectedVal !== 0 && val === selectedVal && !fixed[rIdx][cIdx];
                                    const highlightBorder = selectedVal !== 0 && val === selectedVal && fixed[rIdx][cIdx];

                                    return (
                                        <DigitCell
                                            key={`${rIdx}-${cIdx}`}
                                            value={val}
                                            notes={notes[rIdx][cIdx]}
                                            isFixed={fixed[rIdx][cIdx]}
                                            isSelected={isSelected}
                                            onPress={() => setSelectedCell({ row: rIdx, col: cIdx })}
                                            mistake={mistakes[rIdx][cIdx]}
                                            highlight={highlight}
                                            highlightBorder={highlightBorder}
                                            row={rIdx}
                                            col={cIdx}
                                            cellSize={cellSize}
                                        />
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Only show confirm button for scanned puzzles */}
                {stage === 'edit' && !isDailyPuzzle && !difficulty && (
                    <TouchableOpacity style={styles.confirmButton} onPress={confirmGrid}>
                        <Text style={styles.buttonText}>Confirm Grid</Text>
                    </TouchableOpacity>
                )}

                {/* Show solve controls for all puzzles */}
                {stage === 'solve' && showControls && (
                    <View style={styles.solveButtons}>
                        <TouchableOpacity style={[styles.controlButton, styles.hintButton]} onPress={applyHint}>
                            <Text style={styles.buttonText}>Hint ({hintCount})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlButton, styles.checkButton]} onPress={checkMistakes}>
                            <Text style={styles.buttonText}>Check</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlButton, styles.solveButton]} onPress={solveAll}>
                            <Text style={styles.buttonText}>Solve</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showControls && (stage === 'solve' || stage === 'edit') && (
                    <Keypad onDigit={handleDigit} onClear={handleClear} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, paddingBottom: 30, alignItems: 'center', backgroundColor: '#2a2a2a' },
    topBar: { width: '90%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    timer: { fontSize: 24, color: 'white' },
    row: { flexDirection: 'row' },
    modeToggle: {
        marginVertical: 10,
    },
    toggleButton: {
        padding: 10,
        marginBottom: 20,
        backgroundColor: '#ddd',
        borderRadius: 5,
    },
    activeToggle: {
        backgroundColor: '#4CAF50',
    },
    toggleText: {
        color: '#333',
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: 'green',
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
        marginBottom:10
    },
    controlButton: {
        alignItems: 'center',
        padding: 10,
        marginVertical: 15,
        borderRadius: 10,
    },
    hintButton: {
        width: 100,
        backgroundColor: '#3498db',
    },
    checkButton: {
        width: 100,
        backgroundColor: '#f39c12',
        marginLeft: 5
    },
    solveButton: {
        width: 100,
        backgroundColor: '#2ecc71',
        marginLeft: 5
    },
    buttonText: { color: 'white', fontSize: 16 },
    fullScreen: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        paddingTop: 20,
        paddingHorizontal: 10,
        paddingBottom: 10,
        justifyContent: 'space-between',
    },
    gridContainer: {
        flex: 1.6,
        aspectRatio: 1.1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    grid: {
        aspectRatio: 1,
        borderWidth: 0,
        borderColor: '#444',
        marginBottom: 10
    },
    solveButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 10,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 100,
    },
    loadingText: {
        color: 'white',
        fontSize: 18,
    },
});