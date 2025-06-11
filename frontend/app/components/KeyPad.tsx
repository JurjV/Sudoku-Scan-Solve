import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface KeypadProps {
  onDigit: (digit: number) => void;
  onClear: () => void;
}

const Keypad: React.FC<KeypadProps> = ({ onDigit, onClear }) => {
  return (
    <View style={styles.keypadWrapper}>
      <View style={styles.keypadGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <TouchableOpacity key={n} style={styles.key} onPress={() => onDigit(n)}>
            <Text style={styles.keyText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.clearButton} onPress={onClear}>
        <Text style={styles.clearText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Keypad;

const styles = StyleSheet.create({
  keypadWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  key: {
    backgroundColor: 'rgb(90, 90, 90)',
    paddingVertical: 10,
    width: 50,
    alignItems: 'center',
    borderRadius: 8,
    margin: 4,
  },
  keyText: {
    fontSize: 18,
    color:'white'
  },
  clearButton: {
    marginTop: 7,
    backgroundColor: '#e74c3c',
    paddingVertical: 7,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  clearText: {
    fontSize: 18,
    color: 'white',
  },
});
