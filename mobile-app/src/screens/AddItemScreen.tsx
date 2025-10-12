import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../types';
import { itemsApi, exchangeRatesApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItem'>;

const AddItemScreen: React.FC<Props> = ({ route, navigation }) => {
  const { clientId } = route.params;
  const [productCode, setProductCode] = useState('');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [weight, setWeight] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [margin, setMargin] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Get latest exchange rate
  const { data: latestRate } = useQuery({
    queryKey: ['exchangeRate', 'latest'],
    queryFn: () => exchangeRatesApi.getLatestRate('USD', 'KZT'),
  });

  // Auto-fill exchange rate when component mounts
  React.useEffect(() => {
    if (latestRate && !exchangeRate) {
      setExchangeRate(latestRate.rate.toString());
    }
  }, [latestRate]);

  // Auto-calculate amountKzt when priceUsd or exchangeRate changes
  const calculateAmountKzt = () => {
    const price = parseFloat(priceUsd);
    const rate = parseFloat(exchangeRate);
    if (!isNaN(price) && !isNaN(rate)) {
      return (price * rate).toFixed(2);
    }
    return '';
  };

  const createItemMutation = useMutation({
    mutationFn: itemsApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      Alert.alert('Успех', 'Товар успешно добавлен', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      console.error('Create item error:', error);
      Alert.alert(
        'Ошибка',
        error.response?.data?.error || error.message || 'Не удалось добавить товар'
      );
    },
  });

  const handleSave = () => {
    if (!clientId || !productCode || !arrivalDate || !quantity) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните обязательные поля');
      return;
    }

    const amountKzt = calculateAmountKzt();

    createItemMutation.mutate({
      clientId,
      productCode,
      arrivalDate,
      quantity: parseInt(quantity),
      weight: weight ? parseFloat(weight) : undefined,
      priceUsd: priceUsd ? parseFloat(priceUsd) : undefined,
      exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
      amountKzt: amountKzt ? parseFloat(amountKzt) : undefined,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      margin: margin ? parseFloat(margin) : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Новый товар</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createItemMutation.isPending}
          >
            <Text style={[
              styles.saveButton,
              createItemMutation.isPending && styles.saveButtonDisabled
            ]}>
              {createItemMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <Text style={styles.label}>Код товара *</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: PROD001"
              value={productCode}
              onChangeText={setProductCode}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Дата поступления *</Text>
            <TextInput
              style={styles.input}
              placeholder="ГГГГ-ММ-ДД"
              value={arrivalDate}
              onChangeText={setArrivalDate}
            />

            <Text style={styles.label}>Количество *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Вес (кг)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Цена ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={priceUsd}
              onChangeText={setPriceUsd}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Курс (тг/$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={exchangeRate}
              onChangeText={setExchangeRate}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>К оплате (тг)</Text>
            <View style={[styles.input, styles.calculatedInput]}>
              <Text style={styles.calculatedText}>
                {calculateAmountKzt() || '0.00'}
              </Text>
            </View>

            <Text style={styles.label}>Себестоимость (тг)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Маржа (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={margin}
              onChangeText={setMargin}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Заметки</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Дополнительная информация"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.note}>* Обязательные поля</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
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
  saveButton: {
    fontSize: 16,
    color: '#2596be',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  calculatedInput: {
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
  },
  calculatedText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  note: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default AddItemScreen;
