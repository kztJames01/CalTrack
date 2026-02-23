import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useRouter, Href } from 'expo-router';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualUPC, setManualUPC] = useState('');
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [portionSize, setPortionSize] = useState('1');

  const {
    scannedCode,
    nutritionData,
    isLoading,
    error,
    handleBarcodeDetected,
    resetScanner,
    searchByUPC,
  } = useBarcodeScanner();

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39'],
    onCodeScanned: (codes) => {
      handleBarcodeDetected(codes);
    },
  });

  const handleManualSearch = () => {
    if (manualUPC.trim()) {
      searchByUPC(manualUPC.trim());
      setShowManualEntry(false);
    }
  };

  const handleAddToMeal = () => {
    if (!nutritionData) return;

    const portion = parseFloat(portionSize) || 1;
    const foodData = {
      ...nutritionData,
      servingSize: (nutritionData.servingSize || 1) * portion,
      calories: (nutritionData.calories || 0) * portion,
      protein: (nutritionData.protein || 0) * portion,
      carbs: (nutritionData.carbs || 0) * portion,
      fat: (nutritionData.fat || 0) * portion,
      fiber: (nutritionData.fiber || 0) * portion,
      sugar: (nutritionData.sugar || 0) * portion,
      sodium: (nutritionData.sodium || 0) * portion,
      detectionMethod: 'barcode',
    };

    router.push({
      pathname: '/(tabs)/log-meal' as Href,
      params: { foodData: JSON.stringify(foodData) },
    });
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!nutritionData && !showManualEntry}
        codeScanner={codeScanner}
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Scan Barcode</Text>
          <TouchableOpacity onPress={() => setShowManualEntry(true)}>
            <Text style={styles.manualEntryLink}>Enter manually</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanInstruction}>
            Position barcode within frame
          </Text>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Looking up nutrition data...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={resetScanner}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {nutritionData && (
          <View style={styles.resultContainer}>
            <ScrollView style={styles.resultScroll}>
              <Text style={styles.resultTitle}>{nutritionData.foodName}</Text>
              {nutritionData.brandName && (
                <Text style={styles.resultBrand}>{nutritionData.brandName}</Text>
              )}

              <View style={styles.nutritionInfo}>
                <Text style={styles.nutritionLabel}>Per serving ({nutritionData.servingSize} {nutritionData.servingUnit})</Text>
                
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionItem}>Calories: {nutritionData.calories}</Text>
                </View>
                <View style={styles.nutritionRow}>
                  <Text style={styles.nutritionItem}>Protein: {nutritionData.protein}g</Text>
                  <Text style={styles.nutritionItem}>Carbs: {nutritionData.carbs}g</Text>
                  <Text style={styles.nutritionItem}>Fat: {nutritionData.fat}g</Text>
                </View>
              </View>

              <View style={styles.portionControl}>
                <Text style={styles.portionLabel}>Number of servings:</Text>
                <TextInput
                  style={styles.portionInput}
                  value={portionSize}
                  onChangeText={setPortionSize}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={resetScanner}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => setShowPortionModal(true)}
                >
                  <Text style={styles.buttonText}>Add to Meal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Manual UPC Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        transparent
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter UPC Code</Text>
            <TextInput
              style={styles.modalInput}
              value={manualUPC}
              onChangeText={setManualUPC}
              placeholder="Enter UPC code"
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowManualEntry(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleManualSearch}
              >
                <Text style={styles.buttonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Portion Size Confirmation Modal */}
      <Modal
        visible={showPortionModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPortionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Portion</Text>
            <Text style={styles.portionPreview}>
              {nutritionData?.foodName} x {portionSize} servings
            </Text>
            <View style={styles.macroPreview}>
              <Text style={styles.macroPreviewText}>
                Calories: {Math.round((nutritionData?.calories || 0) * parseFloat(portionSize || '1'))}
              </Text>
              <Text style={styles.macroPreviewText}>
                P: {Math.round((nutritionData?.protein || 0) * parseFloat(portionSize || '1'))}g | 
                C: {Math.round((nutritionData?.carbs || 0) * parseFloat(portionSize || '1'))}g | 
                F: {Math.round((nutritionData?.fat || 0) * parseFloat(portionSize || '1'))}g
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setShowPortionModal(false)}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleAddToMeal}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  overlay: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 16,
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  manualEntryLink: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderWidth: 3,
    borderColor: '#2563eb',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstruction: {
    color: '#fff',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  resultScroll: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  resultBrand: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  nutritionInfo: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutritionItem: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  portionControl: {
    marginBottom: 20,
  },
  portionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  portionInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  portionPreview: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 16,
  },
  macroPreview: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  macroPreviewText: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
});
