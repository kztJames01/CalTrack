import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter, Href } from 'expo-router';
import { apiClient } from '../../lib/apiClient';

let VisionCamera: any = null;
try {
  VisionCamera = require('react-native-vision-camera');
} catch {
  VisionCamera = null;
}

const Camera = VisionCamera?.Camera;

export default function CameraScreen() {
  const router = useRouter();
  const device = VisionCamera?.useCameraDevice?.('back') ?? null;
  const permissionState = VisionCamera?.useCameraPermission?.() ?? {
    hasPermission: false,
    requestPermission: async () => false,
  };
  const { hasPermission, requestPermission } = permissionState;
  const camera = useRef<any>(null);
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!hasPermission) {
      requestCameraPermission();
    }
  }, [hasPermission]);

  const requestCameraPermission = async () => {
    const permission = await requestPermission();
    if (!permission) {
      Alert.alert(
        'Camera Permission Required',
        'Savor needs access to your camera to capture food photos for nutritional analysis.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const capturePhoto = async () => {
    if (!camera.current) return;

    try {
      const photo = await camera.current.takePhoto({
        flash: 'off',
      });

      // Compress the image
      const compressedPhoto = await compressImage(photo.path);
      setCapturedPhoto(compressedPhoto.uri);
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const compressImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        `file://${uri}`,
        [{ resize: { width: 1920 } }], // Resize to max width 1920px
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipResult;
    } catch (error) {
      console.error('Failed to compress image:', error);
      return { uri: `file://${uri}` };
    }
  };

  const uploadPhoto = async () => {
    if (!capturedPhoto) return;

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', {
        uri: capturedPhoto,
        type: 'image/jpeg',
        name: `food_${Date.now()}.jpg`,
      } as any);

      // Upload to backend
      const response = await apiClient.post('/upload/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const photoUrl = response.data.photoUrl || response.data.url;
      if (!photoUrl) {
        throw new Error('Upload response missing photo URL');
      }

      // Navigate to food detection screen with photo URL
      router.push(`/(tabs)/camera/detect?photoUrl=${encodeURIComponent(photoUrl)}` as Href);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      Alert.alert('Upload Failed', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to capture food photos
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera module is unavailable in this build. Use `expo run:ios` development build.
        </Text>
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto }} style={styles.preview} />
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retakeButton]}
            onPress={retakePhoto}
            disabled={isUploading}
          >
            <Text style={styles.actionButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.usePhotoButton]}
            onPress={uploadPhoto}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Use Photo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Position food in frame</Text>
        </View>

        <View style={styles.captureContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 16,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  captureContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  retakeButton: {
    backgroundColor: '#64748b',
  },
  usePhotoButton: {
    backgroundColor: '#2563eb',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
