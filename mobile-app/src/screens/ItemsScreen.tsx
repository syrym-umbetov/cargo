import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, Item } from '../types';
import { itemsApi } from '../services/api';

type Props = BottomTabScreenProps<MainTabParamList, 'Items'>;

const ItemsScreen: React.FC<Props> = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: itemsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['items', page, search],
    queryFn: () => itemsApi.getItems(page, 20, undefined, search || undefined),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setPage(1);
      await refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount: number | undefined, currency = 'USD') => {
    if (!amount) return '-';
    return `${amount.toFixed(2)} ${currency}`;
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.productCode}>{item.productCode}</Text>
        <Text style={styles.arrivalDate}>{formatDate(item.arrivalDate)}</Text>
      </View>

      {item.client && (
        <Text style={styles.clientName}>{item.client.name}</Text>
      )}

      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>
          Количество: {item.quantity}
        </Text>
        {item.weight && (
          <Text style={styles.detailText}>
            Вес: {item.weight} кг
          </Text>
        )}
        {item.priceUsd && (
          <Text style={styles.detailText}>
            Цена: {formatCurrency(item.priceUsd)}
          </Text>
        )}
        {item.amountKzt && (
          <Text style={styles.amountText}>
            К оплате: {formatCurrency(item.amountKzt, 'тг')}
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск товаров..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Ionicons name="scan" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={itemsData?.data || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2596be"
            colors={['#2596be']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Товары не найдены</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Scanner')}
            >
              <Text style={styles.emptyButtonText}>Добавить товар</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 8,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#2596be',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  arrivalDate: {
    fontSize: 14,
    color: '#666',
  },
  clientName: {
    fontSize: 14,
    color: '#2596be',
    marginBottom: 8,
    fontWeight: '500',
  },
  itemDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  amountText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 16,
  },
  emptyButton: {
    backgroundColor: '#2596be',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ItemsScreen;