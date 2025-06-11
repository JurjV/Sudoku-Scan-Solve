import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DigitCellProps {
    value: number;
    notes: boolean[];
    isFixed: boolean;
    isSelected: boolean;
    mistake: boolean;
    highlight: boolean;
    highlightBorder: boolean;
    row: number;
    col: number;
    cellSize: number;
    onPress: () => void;
}

export default function DigitCell({
    value,
    notes,
    isFixed,
    isSelected,
    mistake,
    highlight,
    highlightBorder,
    row,
    col,
    cellSize,
    onPress,
}: DigitCellProps) {
    const borderStyle = {
        borderTopWidth: row % 3 === 0 ? 2 : 1,
        borderBottomWidth: row === 8 ? 2 : 1,
        borderLeftWidth: col % 3 === 0 ? 2 : 1,
        borderRightWidth: col === 8 ? 2 : 1,
        borderColor: highlightBorder ? '#007aff' : '#999',
        backgroundColor: mistake
            ? '#e74c3c'
            : highlight
                ? '#d0f0ff'
                : isFixed
                    ? '#eee'
                    : 'white',
    };

    return (
        <TouchableOpacity
            style={[
                {
                    width: cellSize,
                    height: cellSize,
                },
                styles.cell,
                borderStyle,
                isFixed && styles.fixedCell,
                isSelected && styles.selectedCell,
            ]}
            onPress={onPress}
            disabled={isFixed}
        >
            {value !== 0 ? (
                <Text style={[{ fontSize: cellSize * 0.5 }, isFixed && styles.fixedText]}>
                    {value}
                </Text>
            ) : (
                <View style={styles.notesContainer}>
                    {notes.map((hasNote, index) => (
                        hasNote && (
                            <Text key={index} style={[styles.noteText, { fontSize: cellSize * 0.2 }]}>
                                {index + 1}
                            </Text>
                        )
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    fixedCell: {},
    selectedCell: {
        borderColor: 'blue',
        borderWidth: 2,
    },
    cellText: {
        fontSize: 20,
    },
    fixedText: {
        fontWeight: 'bold',
        color: '#333',
    },
    notesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    noteText: {
        fontSize: 8,
        width: '33.33%',
        textAlign: 'center',
        color: '#555',
    },
});