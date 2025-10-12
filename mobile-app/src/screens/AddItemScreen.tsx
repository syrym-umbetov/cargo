import React, { useState, useRef } from 'react';
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

  // Refs for input fields
  const productCodeRef = useRef<TextInput>(null);
  const arrivalDateRef = useRef<TextInput>(null);
  const quantityRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);
  const priceUsdRef = useRef<TextInput>(null);
  const exchangeRateRef = useRef<TextInput>(null);
  const costPriceRef = useRef<TextInput>(null);
  const marginRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.form}>
            <View onLayout={(event) => {
              if (productCodeRef.current) {
                (productCodeRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Код товара *</Text>
              <TextInput
                ref={productCodeRef}
                style={styles.input}
                placeholder="Например: PROD001"
                value={productCode}
                onChangeText={setProductCode}
                autoCapitalize="characters"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (productCodeRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => arrivalDateRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (arrivalDateRef.current) {
                (arrivalDateRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Дата поступления *</Text>
              <TextInput
                ref={arrivalDateRef}
                style={styles.input}
                placeholder="ГГГГ-ММ-ДД"
                value={arrivalDate}
                onChangeText={setArrivalDate}
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (arrivalDateRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => quantityRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (quantityRef.current) {
                (quantityRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Количество *</Text>
              <TextInput
                ref={quantityRef}
                style={styles.input}
                placeholder="0"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (quantityRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => weightRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (weightRef.current) {
                (weightRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Вес (кг)</Text>
              <TextInput
                ref={weightRef}
                style={styles.input}
                placeholder="0.00"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (weightRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => priceUsdRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (priceUsdRef.current) {
                (priceUsdRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Цена ($)</Text>
              <TextInput
                ref={priceUsdRef}
                style={styles.input}
                placeholder="0.00"
                value={priceUsd}
                onChangeText={setPriceUsd}
                keyboardType="decimal-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (priceUsdRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => exchangeRateRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (exchangeRateRef.current) {
                (exchangeRateRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Курс (тг/$)</Text>
              <TextInput
                ref={exchangeRateRef}
                style={styles.input}
                placeholder="0.00"
                value={exchangeRate}
                onChangeText={setExchangeRate}
                keyboardType="decimal-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (exchangeRateRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => costPriceRef.current?.focus()}
              />
            </View>

            <Text style={styles.label}>К оплате (тг)</Text>
            <View style={[styles.input, styles.calculatedInput]}>
              <Text style={styles.calculatedText}>
                {calculateAmountKzt() || '0.00'}
              </Text>
            </View>

            <View onLayout={(event) => {
              if (costPriceRef.current) {
                (costPriceRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Себестоимость (тг)</Text>
              <TextInput
                ref={costPriceRef}
                style={styles.input}
                placeholder="0.00"
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="decimal-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (costPriceRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => marginRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (marginRef.current) {
                (marginRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Маржа (%)</Text>
              <TextInput
                ref={marginRef}
                style={styles.input}
                placeholder="0.00"
                value={margin}
                onChangeText={setMargin}
                keyboardType="decimal-pad"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (marginRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => notesRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (notesRef.current) {
                (notesRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Заметки</Text>
              <TextInput
                ref={notesRef}
                style={[styles.input, styles.textArea]}
                placeholder="Дополнительная информация"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                blurOnSubmit={true}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (notesRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
              />
            </View>

            <Text style={styles.note}>* Обязательные поля</Text>
            <View style={{ height: 100 }} />
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
