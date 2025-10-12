import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { analyticsApi } from '../services/api';

const AnalyticsScreen: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>('all');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());

  const {
    data: analytics,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['analytics', startDate, endDate],
    queryFn: () => analyticsApi.getAnalytics(startDate || undefined, endDate || undefined),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' \u20B8';
  };

  const formatWeight = (weight: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(weight) + ' кг';
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const applyPeriodFilter = (period: 'all' | 'month' | 'quarter' | 'year' | 'custom') => {
    if (period === 'custom') {
      setSelectedPeriod('custom');
      return; // Don't close modal, let user pick dates
    }

    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = '';

    switch (period) {
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        start = monthAgo.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
        start = quarterAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        start = yearAgo.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        start = '';
        break;
    }

    setStartDate(start);
    setEndDate(period === 'all' ? '' : end);
    setSelectedPeriod(period);
    setShowFilterModal(false);
  };

  const applyCustomDates = () => {
    const start = tempStartDate.toISOString().split('T')[0];
    const end = tempEndDate.toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
    setShowFilterModal(false);
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempStartDate(selectedDate);
      if (Platform.OS === 'android') {
        setStartDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempEndDate(selectedDate);
      if (Platform.OS === 'android') {
        setEndDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'custom' && startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    switch (selectedPeriod) {
      case 'month':
        return 'За месяц';
      case 'quarter':
        return 'За квартал';
      case 'year':
        return 'За год';
      case 'custom':
        return 'Выбрать даты';
      default:
        return 'Все время';
    }
  };

  if (isLoading && !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="analytics" size={64} color="#2596be" />
        <Text style={styles.loadingText}>Загрузка аналитики...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Аналитика</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#2596be" />
          <Text style={styles.filterButtonText}>{getPeriodLabel()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2596be"
            colors={['#2596be']}
          />
        }
      >
        {/* Main Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.profitCard]}>
            <View style={styles.cardIcon}>
              <Ionicons name="trending-up" size={24} color="#34C759" />
            </View>
            <Text style={styles.cardLabel}>Прибыль</Text>
            <Text style={[styles.cardValue, { color: '#34C759' }]}>
              {formatCurrency(analytics?.summary.totalProfit || 0)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.revenueCard]}>
            <View style={styles.cardIcon}>
              <Ionicons name="cash" size={24} color="#2596be" />
            </View>
            <Text style={styles.cardLabel}>Выручка</Text>
            <Text style={[styles.cardValue, { color: '#2596be' }]}>
              {formatCurrency(analytics?.summary.totalRevenue || 0)}
            </Text>
          </View>
        </View>

        {/* Secondary Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Ionicons name="cart" size={20} color="#666" />
              <Text style={styles.metricLabel}>Товаров</Text>
              <Text style={styles.metricValue}>{analytics?.summary.totalItems || 0}</Text>
            </View>

            <View style={styles.metricCard}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.metricLabel}>Клиентов</Text>
              <Text style={styles.metricValue}>{analytics?.summary.uniqueClients || 0}</Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Ionicons name="scale" size={20} color="#666" />
              <Text style={styles.metricLabel}>Общий вес</Text>
              <Text style={styles.metricValue}>
                {formatWeight(analytics?.summary.totalWeight || 0)}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Ionicons name="stats-chart" size={20} color="#666" />
              <Text style={styles.metricLabel}>Средняя маржа</Text>
              <Text style={styles.metricValue}>
                {(analytics?.summary.averageMargin || 0).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Top Clients */}
        {analytics?.topClients && analytics.topClients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Топ-5 клиентов</Text>
            {analytics.topClients.map((client, index) => (
              <View key={client.clientId} style={styles.clientCard}>
                <View style={styles.clientRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{client.clientName}</Text>
                  <Text style={styles.clientCode}>{client.clientCode}</Text>
                </View>
                <View style={styles.clientStats}>
                  <Text style={styles.clientRevenue}>
                    {formatCurrency(client.revenue)}
                  </Text>
                  <Text style={styles.clientItems}>
                    {client.itemsCount} товаров
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Monthly Data */}
        {analytics?.monthlyData && analytics.monthlyData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Динамика по месяцам</Text>
            {analytics.monthlyData.map((month) => (
              <View key={month.month} style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthLabel}>{month.month}</Text>
                  <Text style={styles.monthItems}>{month.itemsCount} товаров</Text>
                </View>
                <View style={styles.monthStats}>
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatLabel}>Выручка</Text>
                    <Text style={styles.monthStatValue}>
                      {formatCurrency(month.revenue)}
                    </Text>
                  </View>
                  <View style={styles.monthStat}>
                    <Text style={styles.monthStatLabel}>Прибыль</Text>
                    <Text style={[styles.monthStatValue, { color: '#34C759' }]}>
                      {formatCurrency(month.profit)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Выберите период</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {[
                { value: 'all', label: 'Все время' },
                { value: 'month', label: 'За последний месяц' },
                { value: 'quarter', label: 'За последний квартал' },
                { value: 'year', label: 'За последний год' },
                { value: 'custom', label: 'Выбрать даты' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    selectedPeriod === option.value && styles.filterOptionActive,
                  ]}
                  onPress={() => applyPeriodFilter(option.value as any)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedPeriod === option.value && styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedPeriod === option.value && (
                    <Ionicons name="checkmark" size={20} color="#2596be" />
                  )}
                </TouchableOpacity>
              ))}

              {selectedPeriod === 'custom' && (
                <View style={styles.customDateContainer}>
                  <View style={styles.datePickerRow}>
                    <Text style={styles.dateLabel}>Дата начала:</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={18} color="#2596be" />
                      <Text style={styles.dateButtonText}>
                        {formatDate(startDate) || formatDate(tempStartDate.toISOString().split('T')[0])}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.datePickerRow}>
                    <Text style={styles.dateLabel}>Дата окончания:</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={18} color="#2596be" />
                      <Text style={styles.dateButtonText}>
                        {formatDate(endDate) || formatDate(tempEndDate.toISOString().split('T')[0])}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={applyCustomDates}
                  >
                    <Text style={styles.applyButtonText}>Применить</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showStartDatePicker && (
                <DateTimePicker
                  value={tempStartDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onStartDateChange}
                  maximumDate={new Date()}
                />
              )}

              {showEndDatePicker && (
                <DateTimePicker
                  value={tempEndDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onEndDateChange}
                  maximumDate={new Date()}
                  minimumDate={tempStartDate}
                />
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#2596be',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  revenueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2596be',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  clientRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2596be',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  clientCode: {
    fontSize: 12,
    color: '#666',
  },
  clientStats: {
    alignItems: 'flex-end',
  },
  clientRevenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2596be',
    marginBottom: 2,
  },
  clientItems: {
    fontSize: 12,
    color: '#666',
  },
  monthCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  monthItems: {
    fontSize: 12,
    color: '#666',
  },
  monthStats: {
    flexDirection: 'row',
    gap: 16,
  },
  monthStat: {
    flex: 1,
  },
  monthStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  monthStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2596be',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#e8f4f8',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  filterOptionTextActive: {
    color: '#2596be',
    fontWeight: '600',
  },
  customDateContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  datePickerRow: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  applyButton: {
    backgroundColor: '#2596be',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnalyticsScreen;
