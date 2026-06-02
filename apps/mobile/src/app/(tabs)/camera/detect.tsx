import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';

interface DetectedFood {
  foodName: string;
  confidence: number;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export default function FoodDetectionScreen() {
  const { photoUrl } = useLocalSearchParams<{ photoUrl: string }>();
  const router = useRouter();
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [selectedFood, setSelectedFood] = useState<DetectedFood | null>(null);
  const [portionSize, setPortionSize] = useState('1');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DetectedFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    analyzePhoto();
  }, [photoUrl]);

  const analyzePhoto = async () => {
    if (!photoUrl) {
      Alert.alert('Error', 'No photo URL provided');
      router.back();
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiClient.post('/nutrition/analyze-photo', {
        photoUrl,
      });

      const foods = response.data.detectedFoods || [];
      
      if (foods.length === 0) {
        Alert.alert(
          'No Foods Detected',
          'We couldn\'t detect any foods in this photo. Would you like to search manually?',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Search', onPress: () => setShowSearchModal(true) },
          ]
        );
      } else {
        setDetectedFoods(foods);
      }
    } catch (error) {
      console.error('Failed to analyze photo:', error);
      Alert.alert(
        'Analysis Failed',
        'Failed to analyze the photo. Would you like to search manually?',
        [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Search', onPress: () => setShowSearchModal(true) },
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFoodSelect = (food: DetectedFood) => {
    setSelectedFood(food);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await apiClient.get('/nutrition/search', {
        params: { query: searchQuery, limit: 15 },
      });
      setSearchResults(response.data.foods || []);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Failed to search for foods');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = (food: DetectedFood) => {
    setSelectedFood(food);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddToMeal = () => {
    if (!selectedFood) return;

    const portion = parseFloat(portionSize) || 1;
    const foodData = {
      ...selectedFood,
      servingSize: (selectedFood.servingSize || 1) * portion,
      calories: (selectedFood.calories || 0) * portion,
      protein: (selectedFood.protein || 0) * portion,
      carbs: (selectedFood.carbs || 0) * portion,
      fat: (selectedFood.fat || 0) * portion,
      detectionMethod: 'photo_ai',
      confidenceScore: selectedFood.confidence,
      photoUrl,
    };

    router.push(`/(tabs)/log-meal?foodData=${encodeURIComponent(JSON.stringify(foodData))}` as Href);
  };

  const renderFoodItem = ({ item }: { item: DetectedFood }) => (
    <TouchableOpacity
      style={[
        styles.foodItem,
        selectedFood?.foodName === item.foodName && styles.foodItemSelected,
      ]}
      onPress={() => handleFoodSelect(item)}
    >
      <View style={styles.foodItemHeader}>
        <Text style={styles.foodName}>{item.foodName}</Text>
        <View style={[
          styles.confidenceBadge,
          item.confidence >= 0.7 ? styles.confidenceHigh :
          item.confidence >= 0.4 ? styles.confidenceMedium :
          styles.confidenceLow
        ]}>
          <Text style={styles.confidenceText}>
            {Math.round(item.confidence * 100)}%
          </Text>
        </View>
      </View>
      
      {item.calories && (
        <View style={styles.foodNutrition}>
          <Text style={styles.nutritionText}>
            {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isAnalyzing) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUrl }} style={styles.photo} />
        <TouchableOpacity style={styles.backButtonOverlay} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Analyzing photo...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButtonOverlay} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <Image source={{ uri: photoUrl }} style={styles.photoPreview} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Detected Foods</Text>
          <Text style={styles.subtitle}>
            Select the correct food from the list below
          </Text>
        </View>

        <FlatList
          data={detectedFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item, index) => `${item.foodName}-${index}`}
          style={styles.foodList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No foods detected</Text>
            </View>
          }
        />

        {selectedFood && (
          <View style={styles.portionSection}>
            <Text style={styles.portionLabel}>Portion size:</Text>
            <View style={styles.portionControl}>
              <TextInput
                style={styles.portionInput}
                value={portionSize}
                onChangeText={setPortionSize}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={styles.portionUnit}>
                {selectedFood.servingUnit || 'serving(s)'}
              </Text>
            </View>

            <View style={styles.macroPreview}>
              <Text style={styles.macroPreviewLabel}>Nutrition preview:</Text>
              <Text style={styles.macroPreviewText}>
                Calories: {Math.round((selectedFood.calories || 0) * parseFloat(portionSize))} |{' '}
                P: {Math.round((selectedFood.protein || 0) * parseFloat(portionSize))}g |{' '}
                C: {Math.round((selectedFood.carbs || 0) * parseFloat(portionSize))}g |{' '}
                F: {Math.round((selectedFood.fat || 0) * parseFloat(portionSize))}g
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.searchButton]}
            onPress={() => setShowSearchModal(true)}
          >
            <Text style={styles.searchButtonText}>Search Manually</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.addButton,
              !selectedFood && styles.addButtonDisabled,
            ]}
            onPress={handleAddToMeal}
            disabled={!selectedFood}
          >
            <Text style={styles.addButtonText}>Add to Meal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Foods</Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for food..."
              onSubmitEditing={handleSearch}
              autoFocus
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {isSearching ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSearchResultSelect(item)}
                >
                  <Text style={styles.foodName}>{item.foodName}</Text>
                  {item.calories && (
                    <Text style={styles.nutritionText}>
                      {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `search-${item.foodName}-${index}`}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No results found' : 'Enter a search term'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff33',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  foodList: {
    flex: 1,
    marginBottom: 16,
  },
  foodItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  foodItemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceHigh: {
    backgroundColor: '#dcfce7',
  },
  confidenceMedium: {
    backgroundColor: '#fef3c7',
  },
  confidenceLow: {
    backgroundColor: '#fee2e2',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  foodNutrition: {
    marginTop: 4,
  },
  nutritionText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  portionSection: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  portionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  portionControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  portionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 12,
  },
  portionUnit: {
    fontSize: 14,
    color: '#64748b',
  },
  macroPreview: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  macroPreviewLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  macroPreviewText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#e2e8f0',
  },
  searchButtonText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2563eb',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
});
