import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../lib/apiClient';
import { theme } from '../../styles/theme';
import type { FoodSearchResult, FoodSearchProps } from '../../types';

let searchTimeout: ReturnType<typeof setTimeout>;

export default function FoodSearch({ onSelect, placeholder }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await apiClient.get('/nutrition/search', {
        params: {
          query: searchQuery,
          limit: 20,
        },
      });

      const foods = response.data.foods || [];
      setResults(
        foods.map((f: any) => ({
          id: f.foodName || f.food_name || String(Math.random()),
          name: f.foodName || f.food_name,
          calories: f.calories ?? f.nf_calories ?? 0,
          protein: f.protein ?? f.nf_protein ?? 0,
          carbs: f.carbs ?? f.nf_total_carbohydrate ?? 0,
          fat: f.fat ?? f.nf_total_fat ?? 0,
          servingSize: f.servingSize ?? f.serving_qty,
          servingUnit: f.servingUnit ?? f.serving_unit,
        })),
      );
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      searchFoods(query);
    }, 300);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [query, searchFoods]);

  const handleSelect = (food: FoodSearchResult) => {
    onSelect(food);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const renderFoodItem = ({ item }: { item: FoodSearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.resultInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        {item.brandName && (
          <Text style={styles.brandName}>{item.brandName}</Text>
        )}
        <Text style={styles.servingInfo}>
          Per {item.servingSize} {item.servingUnit}
        </Text>
      </View>
      <View style={styles.nutritionSummary}>
        <Text style={styles.calories}>{item.calories} cal</Text>
        <Text style={styles.macros}>
          Protein: {item.protein}g | Carbs: {item.carbs}g | Fat: {item.fat}g
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder || 'Search for food...'}
        placeholderTextColor={theme.colors.mutedForeground}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {showResults && (
        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderFoodItem}
              keyExtractor={(item, index) => 
                item.id || `${item.name}-${index}`
              }
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            />
          ) : query.trim() ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No foods found</Text>
              <Text style={styles.emptySubtext}>
                Try a different search term
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.foreground,
  },
  resultsContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 300,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.mutedForeground,
    fontSize: theme.typography.fontSize.sm,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.muted,
  },
  resultInfo: {
    marginBottom: theme.spacing.sm,
  },
  foodName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: 2,
  },
  brandName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  servingInfo: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  nutritionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calories: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.secondary,
  },
  macros: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.mutedForeground,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
});
