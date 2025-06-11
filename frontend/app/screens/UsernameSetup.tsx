import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { saveUsername } from '../utils/statsStorage';

export default function UsernameSetup() {
    const [username, setUsername] = useState('');
    const router = useRouter();

    const handleSetUsername = () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username cannot be empty');
            return;
        }

        Alert.alert(
            'Confirm Username',
            `Are you sure you want to set your username to "${username}"?`,
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: async () => {
                        await saveUsername(username);
                        router.replace('/');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Sudoku Scan&Solve</Text>
            <Text style={styles.subtitle}>Please set your username to continue</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                maxLength={20}
            />
            <TouchableOpacity style={styles.button} onPress={handleSetUsername}>
                <Text style={styles.buttonText}>Set Username</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#2a2a2a',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'white',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        color: 'white',
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#555',
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
        backgroundColor: 'white',
    },
    button: {
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});