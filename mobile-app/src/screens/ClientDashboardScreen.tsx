import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, Item } from '../types';
import { itemsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDashboard'>;

const ClientDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { client, logout } = useAuth();

  const {
    data: itemsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['client-items', client?.id],
    queryFn: () => itemsApi.getItems(1, 100, client?.id),
    enabled: !!client?.id,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
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

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return `${amount.toFixed(2)} тг`;
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ClientItemDetail', { itemId: item.id })}
    >
      <View style={styles.itemHeader}>
        <View>
          <Text style={styles.productCode}>{item.productCode}</Text>
          <Text style={styles.arrivalDate}>
            Поступил: {formatDate(item.arrivalDate)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Количество:</Text>
          <Text style={styles.detailValue}>{item.quantity}</Text>
        </View>
        {item.weight && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Вес:</Text>
            <Text style={styles.detailValue}>{item.weight} кг</Text>
          </View>
        )}
        {item.priceUsd && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Цена:</Text>
            <Text style={styles.detailValue}>${item.priceUsd.toFixed(2)}</Text>
          </View>
        )}
        {item.amountKzt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>К оплате:</Text>
            <Text style={styles.amountText}>{formatCurrency(item.amountKzt)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const items = itemsData?.data || [];

  const totalAmount = items.reduce((sum, item) => sum + (item.amountKzt || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Добро пожаловать</Text>
          <Text style={styles.clientName}>{client?.name}</Text>
          <Text style={styles.clientCode}>Код: {client?.clientCode}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Всего товаров</Text>
          <Text style={styles.statValue}>{items.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Общая сумма</Text>
          <Text style={styles.statValue}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2596be" />
        </View>
      ) : (
        <FlatList
          data={items}
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
              <Text style={styles.emptyText}>У вас пока нет товаров</Text>
              <Text style={styles.emptySubtext}>
                Ваши товары появятся здесь после добавления
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  clientCode: {
    fontSize: 14,
    color: '#2596be',
    fontWeight: '600',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2596be',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  arrivalDate: {
    fontSize: 14,
    color: '#666',
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  amountText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default ClientDashboardScreen;
