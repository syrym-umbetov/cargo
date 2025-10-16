import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Client, Item } from '../types';
import { clientsApi, itemsApi, exchangeRatesApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

const ScannerScreen: React.FC<Props> = ({ route, navigation }) => {
  console.log('DEBUG: Scanner opened with params:', route.params);
  const clientIdFromRoute = route.params?.clientId;
  console.log('DEBUG: clientIdFromRoute:', clientIdFromRoute);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef<any>(null);

  // Refs for input fields
  const arrivalDateRef = useRef<TextInput>(null);
  const quantityRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);
  const priceUsdRef = useRef<TextInput>(null);
  const costPriceRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Form data
  const [formData, setFormData] = useState({
    arrivalDate: new Date().toISOString().split('T')[0],
    quantity: '1',
    weight: '',
    priceUsd: '',
    costPrice: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getClients(1, 100),
  });

  const { data: latestRate } = useQuery({
    queryKey: ['latest-rate'],
    queryFn: () => exchangeRatesApi.getLatestRate(),
  });

  // Auto-select client if clientId is provided from route
  useEffect(() => {
    console.log('DEBUG: useEffect triggered');
    console.log('DEBUG: clientIdFromRoute:', clientIdFromRoute);
    console.log('DEBUG: clientsData:', clientsData?.data);
    if (clientIdFromRoute && clientsData?.data) {
      const client = clientsData.data.find(c => c.id === clientIdFromRoute);
      console.log('DEBUG: Found client:', client);
      if (client) {
        setSelectedClient(client);
        console.log('DEBUG: Set selected client:', client.name);
      }
    }
  }, [clientIdFromRoute, clientsData]);

  const createItemMutation = useMutation({
    mutationFn: itemsApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      Alert.alert('Успех', 'Товар успешно добавлен');
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert(
        'Ошибка',
        error.response?.data?.error || 'Не удалось добавить товар'
      );
    },
  });


  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setScannedCode(data);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setScannedCode('');
    setSelectedClient(null);
    setFormData({
      arrivalDate: new Date().toISOString().split('T')[0],
      quantity: '1',
      weight: '',
      priceUsd: '',
      costPrice: '',
      notes: '',
    });
    setScanned(false);
  };

  const handleCancel = () => {
    resetForm();
    navigation.navigate('MainTabs', { screen: 'Clients' });
  };

  const handleAddItem = () => {
    if (!selectedClient) {
      Alert.alert('Ошибка', 'Выберите клиента');
      return;
    }

    const itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'client'> = {
      clientId: selectedClient.id,
      productCode: scannedCode,
      arrivalDate: formData.arrivalDate,
      quantity: parseInt(formData.quantity) || 1,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      priceUsd: formData.priceUsd ? parseFloat(formData.priceUsd) : undefined,
      exchangeRate: latestRate?.rate,
      amountKzt: formData.priceUsd && latestRate?.rate
        ? parseFloat(formData.priceUsd) * latestRate.rate
        : undefined,
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      margin: undefined,
      notes: formData.notes || undefined,
    };

    if (itemData.amountKzt && itemData.costPrice) {
      itemData.margin = itemData.amountKzt - itemData.costPrice;
    }

    createItemMutation.mutate(itemData);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Нет доступа к камере</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Запросить разрешение</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "aztec",
            "ean13",
            "ean8",
            "qr",
            "pdf417",
            "upc_e",
            "datamatrix",
            "code39",
            "code93",
            "itf14",
            "codabar",
            "code128",
            "upc_a"
          ],
        }}
        facing="back"
        enableTorch={torch}
        zoom={zoom}
        autofocus="on"
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.torchButton}
          onPress={() => setTorch(!torch)}
        >
          <Ionicons
            name={torch ? "flashlight" : "flashlight-outline"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.max(0, zoom - 0.1))}
          disabled={zoom <= 0}
        >
          <Ionicons name="remove" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => setZoom(Math.min(1, zoom + 0.1))}
          disabled={zoom >= 1}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instructions}>
          {scanned
            ? "Код успешно отсканирован!"
            : "Поместите штрих-код в зеленую рамку"}
        </Text>
      </View>

      {scanned && (
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Сканировать заново</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Item Modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Добавить товар</Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text style={styles.saveText}>Сохранить</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.scannedCodeText}>
              Штрих-код: {scannedCode}
            </Text>

            {/* Client Selection - только если clientId не передан */}
            {!clientIdFromRoute ? (
              <>
                <Text style={styles.label}>Клиент *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.clientSelector}
                >
                  {clientsData?.data.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={[
                        styles.clientChip,
                        selectedClient?.id === client.id && styles.clientChipSelected
                      ]}
                      onPress={() => setSelectedClient(client)}
                    >
                      <Text style={[
                        styles.clientChipText,
                        selectedClient?.id === client.id && styles.clientChipTextSelected
                      ]}>
                        {client.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : selectedClient && (
              <View style={styles.selectedClientInfo}>
                <Text style={styles.label}>Клиент</Text>
                <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View onLayout={(event) => {
              if (arrivalDateRef.current) {
                (arrivalDateRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Дата поступления</Text>
              <TextInput
                ref={arrivalDateRef}
                style={styles.input}
                value={formData.arrivalDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, arrivalDate: text }))}
                placeholder="YYYY-MM-DD"
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
              <Text style={styles.label}>Количество</Text>
              <TextInput
                ref={quantityRef}
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
                keyboardType="numeric"
                placeholder="1"
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
                value={formData.weight}
                onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
                keyboardType="decimal-pad"
                placeholder="0.0"
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
              <Text style={styles.label}>Цена (USD)</Text>
              <TextInput
                ref={priceUsdRef}
                style={styles.input}
                value={formData.priceUsd}
                onChangeText={(text) => setFormData(prev => ({ ...prev, priceUsd: text }))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (priceUsdRef.current as any)?._offsetY || 0;
                    scrollViewRef.current?.scrollTo({ y: offsetY - 20, animated: true });
                  }, 100);
                }}
                onSubmitEditing={() => costPriceRef.current?.focus()}
              />
            </View>

            <View onLayout={(event) => {
              if (costPriceRef.current) {
                (costPriceRef.current as any)._offsetY = event.nativeEvent.layout.y;
              }
            }}>
              <Text style={styles.label}>Себестоимость</Text>
              <TextInput
                ref={costPriceRef}
                style={styles.input}
                value={formData.costPrice}
                onChangeText={(text) => setFormData(prev => ({ ...prev, costPrice: text }))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                returnKeyType="next"
                blurOnSubmit={false}
                onFocus={() => {
                  setTimeout(() => {
                    const offsetY = (costPriceRef.current as any)?._offsetY || 0;
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
              <Text style={styles.label}>Примечания</Text>
              <TextInput
                ref={notesRef}
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
                placeholder="Дополнительная информация"
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

            {latestRate && (
              <Text style={styles.exchangeRateText}>
                Курс: 1 USD = {latestRate.rate} KZT
              </Text>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  torchButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  zoomText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 300,
    height: 300,
    borderWidth: 3,
    borderColor: '#00ff00',
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rescanButton: {
    backgroundColor: '#2596be',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2596be',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  saveText: {
    fontSize: 16,
    color: '#2596be',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  scannedCodeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  clientSelector: {
    marginBottom: 16,
  },
  clientChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  clientChipSelected: {
    backgroundColor: '#2596be',
  },
  clientChipText: {
    color: '#333',
  },
  clientChipTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  exchangeRateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  selectedClientInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2596be',
    marginBottom: 16,
  },
  selectedClientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2596be',
    marginTop: 4,
  },
});

export default ScannerScreen;