import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Client, Item } from '../types';
import { clientsApi, itemsApi, exchangeRatesApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

const ScannerScreen: React.FC<Props> = ({ route }) => {
  console.log('DEBUG: Scanner opened with params:', route.params);
  const clientIdFromRoute = route.params?.clientId;
  console.log('DEBUG: clientIdFromRoute:', clientIdFromRoute);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [scannedCode, setScannedCode] = useState('');

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
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93"],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instructions}>
          Наведите камеру на штрих-код товара
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetForm}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Добавить товар</Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text style={styles.saveText}>Сохранить</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
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
            <Text style={styles.label}>Дата поступления</Text>
            <TextInput
              style={styles.input}
              value={formData.arrivalDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, arrivalDate: text }))}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Количество</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
              keyboardType="numeric"
              placeholder="1"
            />

            <Text style={styles.label}>Вес (кг)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
              keyboardType="decimal-pad"
              placeholder="0.0"
            />

            <Text style={styles.label}>Цена (USD)</Text>
            <TextInput
              style={styles.input}
              value={formData.priceUsd}
              onChangeText={(text) => setFormData(prev => ({ ...prev, priceUsd: text }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <Text style={styles.label}>Себестоимость</Text>
            <TextInput
              style={styles.input}
              value={formData.costPrice}
              onChangeText={(text) => setFormData(prev => ({ ...prev, costPrice: text }))}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <Text style={styles.label}>Примечания</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
              placeholder="Дополнительная информация"
            />

            {latestRate && (
              <Text style={styles.exchangeRateText}>
                Курс: 1 USD = {latestRate.rate} KZT
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
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