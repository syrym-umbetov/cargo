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
import { clientsApi, itemsApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientDetails'>;

const ClientDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { clientId } = route.params;
  const queryClient = useQueryClient();

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getClient(clientId),
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['items', clientId],
    queryFn: () => itemsApi.getItems(1, 100, clientId),
  });

  const deleteClientMutation = useMutation({
    mutationFn: clientsApi.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      Alert.alert('Успех', 'Клиент удален', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Ошибка',
        error.response?.data?.error || 'Не удалось удалить клиента'
      );
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Удалить клиента?',
      'Это действие нельзя отменить. Все товары клиента также будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => deleteClientMutation.mutate(clientId)
        }
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditClient', { clientId });
  };

  if (clientLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2596be" />
        </View>
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Клиент не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = itemsData?.data || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{client.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Ionicons name="create-outline" size={24} color="#2596be" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Client Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Код клиента:</Text>
            <Text style={styles.infoValue}>{client.clientCode}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Телефон:</Text>
            <Text style={styles.infoValue}>{client.phone}</Text>
          </View>
          {client.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{client.email}</Text>
            </View>
          )}
          {client.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Адрес:</Text>
              <Text style={styles.infoValue}>{client.address}</Text>
            </View>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Товары ({items.length})</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('Scanner', { clientId })}
            >
              <Ionicons name="scan-outline" size={20} color="#2596be" />
              <Text style={styles.scanButtonText}>Отсканировать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddItem', { clientId })}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Добавить</Text>
            </TouchableOpacity>
          </View>
        </View>

        {itemsLoading ? (
          <ActivityIndicator size="large" color="#2596be" style={{ marginTop: 20 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Нет товаров</Text>
            <Text style={styles.emptySubtext}>
              Добавьте первый товар для этого клиента
            </Text>
          </View>
        ) : (
          <ScrollView horizontal style={styles.tableContainer}>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.tableHeader, { width: 120 }]}>
                  <Text style={styles.tableHeaderText}>КОД клиента</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 120 }]}>
                  <Text style={styles.tableHeaderText}>Дата поступления товара</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 120 }]}>
                  <Text style={styles.tableHeaderText}>Товара за числа</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 80 }]}>
                  <Text style={styles.tableHeaderText}>Вес</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 100 }]}>
                  <Text style={styles.tableHeaderText}>Цена $</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 100 }]}>
                  <Text style={styles.tableHeaderText}>Курс в тг</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 100 }]}>
                  <Text style={styles.tableHeaderText}>К оплате тг</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 120 }]}>
                  <Text style={styles.tableHeaderText}>семестоимость</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 100 }]}>
                  <Text style={styles.tableHeaderText}>Маржа</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeader, { width: 120 }]}>
                  <Text style={styles.tableHeaderText}>свои</Text>
                </View>
              </View>

              {/* Table Body */}
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.tableRow}
                  onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
                >
                  <View style={[styles.tableCell, { width: 120 }]}>
                    <Text style={styles.tableCellText}>{client.clientCode}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: 120 }]}>
                    <Text style={styles.tableCellText}>
                      {new Date(item.arrivalDate).toLocaleDateString('ru-RU')}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, { width: 120 }]}>
                    <Text style={styles.tableCellText}>{item.productCode}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: 80 }]}>
                    <Text style={styles.tableCellText}>{item.weight || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: 100 }]}>
                    <Text style={styles.tableCellText}>
                      {item.priceUsd ? `$${item.priceUsd.toFixed(2)}` : '-'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, { width: 100 }]}>
                    <Text style={styles.tableCellText}>{item.exchangeRate || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: 100 }]}>
                    <Text style={styles.tableCellText}>
                      {item.amountKzt ? `${item.amountKzt.toFixed(2)}` : '-'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, { width: 120 }]}>
                    <Text style={styles.tableCellText}>
                      {item.costPrice ? `${item.costPrice.toFixed(2)}` : '-'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, { width: 100 }]}>
                    <Text style={styles.tableCellText}>
                      {item.margin ? `${item.margin.toFixed(2)}%` : '-'}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, { width: 120 }]}>
                    <Text style={styles.tableCellText}>{item.notes || '-'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    paddingTop: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 6,
  },
  content: {
    flex: 1,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2596be',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2596be',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scanButtonText: {
    color: '#2596be',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2596be',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2596be',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
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
  },
  tableContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center',
  },
  tableHeader: {
    backgroundColor: '#f8f8f8',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  tableCellText: {
    fontSize: 13,
    color: '#333',
  },
});

export default ClientDetailScreen;
