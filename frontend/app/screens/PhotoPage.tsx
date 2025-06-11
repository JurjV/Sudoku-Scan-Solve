import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LandingPage() {

  const { backendConfig } = useLocalSearchParams();
  const config = backendConfig ? JSON.parse(backendConfig as string) : { IP: "192.168.1.132", PORT: "5000" };

  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [showInstructions, setShowInstructions] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
  };

  const showInstructionDialog = () => {
    setShowInstructions(true);
  };

  const hideInstructionDialog = () => {
    setShowInstructions(false);
  };

  const sendImageToBackend = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'sudoku.jpg',
      } as any);

      const response = await fetch(`http://${config.IP}:${config.PORT}/recognise`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.grid) {
        router.push({
          pathname: '/screens/SudokuBoard',
          params: { grid: JSON.stringify(result.grid) },
        });
      } else {
        Alert.alert('No Sudoku Found', result.error || 'Try another image.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not send image to backend.');
      console.error(error);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const rawPhoto = await cameraRef.current.takePictureAsync({
        quality: 1,              
        skipProcessing: false,   
      });
  
      const fixedPhoto = await ImageManipulator.manipulateAsync(
        rawPhoto.uri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
  
      console.log('Fixed photo:', fixedPhoto.uri);
      sendImageToBackend(fixedPhoto.uri);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission denied', 'Gallery access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('Picked:', uri);
      sendImageToBackend(uri);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera access is required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        autofocus="on"
        flash={flashMode}
        ref={cameraRef}
      />

      <TouchableOpacity 
        style={styles.instructionsButton} 
        onPress={showInstructionDialog}
      >
        <Text style={styles.instructionsLabel}>First time?</Text>
        <Text style={styles.instructionsText}>Instructions</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={pickFromGallery}>
          <Text style={styles.text}>Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={toggleFlash}>
          <Text style={styles.text}>
            Flash {flashMode === 'on' ? 'on ' : 'off'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showInstructions}
        transparent={true}
        animationType="slide"
        onRequestClose={hideInstructionDialog}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How to take a good Sudoku photo</Text>
            <Text style={styles.modalText}>
              1. Place the Sudoku puzzle on a flat surface{"\n"}
              2. Ensure good lighting (use flash if needed){"\n"}
              3. Hold your phone parallel to the puzzle{"\n"}
              4. Make sure all numbers are clearly visible{"\n"}
              5. Tap the capture button when ready{"\n\n"}
              Tip: For best results, avoid shadows and glare
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={hideInstructionDialog}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  camera: { flex: 1 },
  buttonContainer: {
    backgroundColor: 'rgb(90, 90, 90)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  instructionsButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#ffffff33',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionsLabel: {
    fontSize: 14,
    color: 'white',
    marginRight: 8,
    fontStyle: 'italic',
  },
  instructionsText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#ffffff33',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  captureButton: {
    backgroundColor: '#ffffff33',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  text: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});