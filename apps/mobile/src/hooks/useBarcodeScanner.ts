import { useEffect, useState, useCallback } from 'react';
import { useCameraDevice } from 'react-native-vision-camera';

// Define Barcode type locally if not available from a package
interface Barcode {
  rawValue: string;
}
import * as Haptics from 'expo-haptics';
import { apiClient } from '../lib/apiClient';

interface BarcodeData {
  upc: string;
  foodName?: string;
  brandName?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export const useBarcodeScanner = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<BarcodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBarcodeDetected = useCallback(async (barcodes: Barcode[]) => {
    if (barcodes.length === 0 || isLoading) return;

    const barcode = barcodes[0];
    const upc = barcode.rawValue;

    if (!upc || upc === scannedCode) return;

    // Vibrate device for haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setScannedCode(upc);
    setIsLoading(true);
    setError(null);

    try {
      // Call backend API to get nutritional info
      const response = await apiClient.get(`/nutrition/barcode/${upc}`);
      setNutritionData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch barcode data:', err);
      setError(
        err.response?.data?.message ||
        'Failed to find nutritional information for this barcode'
      );
      setNutritionData(null);
    } finally {
      setIsLoading(false);
    }
  }, [scannedCode, isLoading]);

  const resetScanner = useCallback(() => {
    setScannedCode(null);
    setNutritionData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const searchByUPC = useCallback(async (upc: string) => {
    setIsLoading(true);
    setError(null);
    setScannedCode(upc);

    try {
      const response = await apiClient.get(`/nutrition/barcode/${upc}`);
      setNutritionData(response.data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Failed to fetch barcode data:', err);
      setError(
        err.response?.data?.message ||
        'Failed to find nutritional information for this UPC code'
      );
      setNutritionData(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    scannedCode,
    nutritionData,
    isLoading,
    error,
    handleBarcodeDetected,
    resetScanner,
    searchByUPC,
  };
};
