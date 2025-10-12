import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../types';
import { itemsApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientItemDetail'>;

const ClientItemDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { itemId } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const { data: item, isLoading, refetch } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.getItem(itemId),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleShare = async () => {
    if (!item) return;

    try {
      let message = `📦 Товар: ${item.productCode}\n\n`;
      message += `📅 Дата поступления: ${new Date(item.arrivalDate).toLocaleDateString('ru-RU')}\n`;
      message += `📊 Количество: ${item.quantity}\n`;

      if (item.weight) {
        message += `⚖️ Вес: ${item.weight} кг\n`;
      }

      if (item.priceUsd) {
        message += `💵 Цена: $${item.priceUsd.toFixed(2)}\n`;
      }

      if (item.exchangeRate) {
        message += `💱 Курс: ${item.exchangeRate} тг/$\n`;
      }

      if (item.amountKzt) {
        message += `💰 К оплате: ${item.amountKzt.toFixed(2)} тг\n`;
      }

      if (item.notes) {
        message += `\n📝 Заметки: ${item.notes}`;
      }

      await Share.share({
        message: message,
        title: `Товар: ${item.productCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2596be" />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Товар не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Детали товара</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color="#2596be" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2596be"
            colors={['#2596be']}
          />
        }
      >
        <View style={styles.card}>
          <View style={styles.mainInfo}>
            <Text style={styles.productCode}>{item.productCode}</Text>
            <View style={styles.badge}>
              <Ionicons name="cube" size={16} color="#2596be" />
              <Text style={styles.badgeText}>Товар в наличии</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Дата поступления</Text>
            <Text style={styles.value}>
              {new Date(item.arrivalDate).toLocaleDateString('ru-RU')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Количество</Text>
            <Text style={styles.value}>{item.quantity}</Text>
          </View>

          {item.weight && (
            <View style={styles.row}>
              <Text style={styles.label}>Вес</Text>
              <Text style={styles.value}>{item.weight} кг</Text>
            </View>
          )}

          <View style={styles.divider} />

          {item.priceUsd && (
            <View style={styles.row}>
              <Text style={styles.label}>Цена</Text>
              <Text style={styles.value}>${item.priceUsd.toFixed(2)}</Text>
            </View>
          )}

          {item.exchangeRate && (
            <View style={styles.row}>
              <Text style={styles.label}>Курс</Text>
              <Text style={styles.value}>{item.exchangeRate} тг/$</Text>
            </View>
          )}

          {item.amountKzt && (
            <View style={[styles.row, styles.highlightRow]}>
              <Text style={styles.highlightLabel}>К оплате</Text>
              <Text style={styles.highlightValue}>
                {item.amountKzt.toFixed(2)} тг
              </Text>
            </View>
          )}

          {item.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.notesSection}>
                <Text style={styles.label}>Заметки</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.timestampSection}>
            <View style={styles.timestampRow}>
              <Ionicons name="time-outline" size={16} color="#999" />
              <Text style={styles.timestampText}>
                Создано: {new Date(item.createdAt).toLocaleString('ru-RU')}
              </Text>
            </View>
            <View style={styles.timestampRow}>
              <Ionicons name="sync-outline" size={16} color="#999" />
              <Text style={styles.timestampText}>
                Обновлено: {new Date(item.updatedAt).toLocaleString('ru-RU')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  card: {
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
  mainInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productCode: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    color: '#2596be',
    fontWeight: '600',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  highlightRow: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  highlightLabel: {
    fontSize: 18,
    color: '#166534',
    fontWeight: '600',
  },
  highlightValue: {
    fontSize: 24,
    color: '#16a34a',
    fontWeight: '700',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginTop: 8,
    lineHeight: 24,
  },
  timestampSection: {
    gap: 8,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestampText: {
    fontSize: 13,
    color: '#999',
  },
});

export default ClientItemDetailScreen;
