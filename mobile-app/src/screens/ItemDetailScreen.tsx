import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types';
import { itemsApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetails'>;

const ItemDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { itemId } = route.params;
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsApi.getItem(itemId),
  });

  const deleteItemMutation = useMutation({
    mutationFn: itemsApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      Alert.alert('Успех', 'Товар удален', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Ошибка',
        error.response?.data?.error || 'Не удалось удалить товар'
      );
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Удалить товар?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteItemMutation.mutate(itemId)
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Код товара:</Text>
            <Text style={styles.value}>{item.productCode}</Text>
          </View>

          {item.client && (
            <View style={styles.row}>
              <Text style={styles.label}>Клиент:</Text>
              <Text style={styles.value}>{item.client.name} ({item.client.clientCode})</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Дата поступления:</Text>
            <Text style={styles.value}>
              {new Date(item.arrivalDate).toLocaleDateString('ru-RU')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Количество:</Text>
            <Text style={styles.value}>{item.quantity}</Text>
          </View>

          {item.weight && (
            <View style={styles.row}>
              <Text style={styles.label}>Вес:</Text>
              <Text style={styles.value}>{item.weight} кг</Text>
            </View>
          )}

          {item.priceUsd && (
            <View style={styles.row}>
              <Text style={styles.label}>Цена:</Text>
              <Text style={styles.value}>${item.priceUsd.toFixed(2)}</Text>
            </View>
          )}

          {item.exchangeRate && (
            <View style={styles.row}>
              <Text style={styles.label}>Курс:</Text>
              <Text style={styles.value}>{item.exchangeRate} тг/$</Text>
            </View>
          )}

          {item.amountKzt && (
            <View style={styles.row}>
              <Text style={styles.label}>К оплате:</Text>
              <Text style={[styles.value, styles.highlight]}>
                {item.amountKzt.toFixed(2)} тг
              </Text>
            </View>
          )}

          {item.costPrice && (
            <View style={styles.row}>
              <Text style={styles.label}>Себестоимость:</Text>
              <Text style={styles.value}>{item.costPrice.toFixed(2)} тг</Text>
            </View>
          )}

          {item.margin && (
            <View style={styles.row}>
              <Text style={styles.label}>Маржа:</Text>
              <Text style={[styles.value, styles.success]}>
                {item.margin.toFixed(2)}%
              </Text>
            </View>
          )}

          {item.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Заметки:</Text>
              <Text style={styles.value}>{item.notes}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Создано:</Text>
            <Text style={styles.valueSmall}>
              {new Date(item.createdAt).toLocaleString('ru-RU')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Обновлено:</Text>
            <Text style={styles.valueSmall}>
              {new Date(item.updatedAt).toLocaleString('ru-RU')}
            </Text>
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
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  highlight: {
    color: '#007AFF',
    fontSize: 18,
  },
  success: {
    color: '#34C759',
  },
});

export default ItemDetailScreen;
