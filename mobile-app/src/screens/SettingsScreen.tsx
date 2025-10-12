import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, ExchangeRate } from '../types';
import { exchangeRatesApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [newRate, setNewRate] = useState('');
  const queryClient = useQueryClient();

  const { data: latestRate, isLoading } = useQuery({
    queryKey: ['latest-rate'],
    queryFn: () => exchangeRatesApi.getLatestRate(),
  });

  const { data: ratesHistory } = useQuery({
    queryKey: ['rates-history'],
    queryFn: () => exchangeRatesApi.getRates(10),
  });

  const updateRateMutation = useMutation({
    mutationFn: exchangeRatesApi.createRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-rate'] });
      queryClient.invalidateQueries({ queryKey: ['rates-history'] });
      Alert.alert('Успех', 'Курс валют обновлен');
      setNewRate('');
    },
    onError: (error: any) => {
      Alert.alert(
        'Ошибка',
        error.response?.data?.error || 'Не удалось обновить курс'
      );
    },
  });

  const handleUpdateRate = () => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Ошибка', 'Введите корректное значение курса');
      return;
    }

    updateRateMutation.mutate({
      currencyFrom: 'USD',
      currencyTo: 'KZT',
      rate,
      date: new Date().toISOString(),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Настройки</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Current Exchange Rate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Текущий курс валют</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2596be" />
          ) : latestRate ? (
            <View style={styles.currentRateCard}>
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>1 USD =</Text>
                <Text style={styles.rateValue}>{latestRate.rate} KZT</Text>
              </View>
              <Text style={styles.rateDate}>
                Обновлено: {formatDate(latestRate.date)}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Курс не установлен</Text>
            </View>
          )}
        </View>

        {/* Update Exchange Rate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Обновить курс валют</Text>
          <View style={styles.updateCard}>
            <Text style={styles.label}>Новый курс (1 USD = ? KZT)</Text>
            <TextInput
              style={styles.input}
              value={newRate}
              onChangeText={setNewRate}
              keyboardType="decimal-pad"
              placeholder="Например: 475.50"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[
                styles.updateButton,
                updateRateMutation.isPending && styles.updateButtonDisabled,
              ]}
              onPress={handleUpdateRate}
              disabled={updateRateMutation.isPending}
            >
              {updateRateMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.updateButtonText}>Обновить курс</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Новый курс будет применяться ко всем товарам, добавленным после обновления
            </Text>
          </View>
        </View>

        {/* Exchange Rate History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>История курсов</Text>
          {ratesHistory && ratesHistory.length > 0 ? (
            <View style={styles.historyCard}>
              {ratesHistory.map((rate: ExchangeRate) => (
                <View key={rate.id} style={styles.historyItem}>
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyRate}>
                      1 USD = {rate.rate} KZT
                    </Text>
                    <Text style={styles.historyDate}>
                      {formatDate(rate.date)}
                    </Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color="#999" />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>История пуста</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  currentRateCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rateLabel: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2596be',
  },
  rateDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  updateCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: '#2596be',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyRate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
    color: '#999',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default SettingsScreen;
