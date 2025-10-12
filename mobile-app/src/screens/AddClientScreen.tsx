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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types';
import { clientsApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'AddClient'>;

const AddClientScreen: React.FC<Props> = ({ navigation }) => {
  const [clientCode, setClientCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: clientsApi.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      Alert.alert('Успех', 'Клиент успешно добавлен', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      console.error('Create client error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      Alert.alert(
        'Ошибка',
        error.response?.data?.error || error.message || 'Не удалось добавить клиента'
      );
    },
  });

  const handleSave = () => {
    console.log('Saving client:', { clientCode, name, phone, email, address });

    if (!clientCode || !name || !phone) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните обязательные поля');
      return;
    }

    console.log('Validation passed, calling mutate');
    createClientMutation.mutate({
      clientCode,
      name,
      phone,
      email: email || undefined,
      address: address || undefined,
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
          <Text style={styles.headerTitle}>Новый клиент</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={createClientMutation.isPending}
          >
            <Text style={[
              styles.saveButton,
              createClientMutation.isPending && styles.saveButtonDisabled
            ]}>
              {createClientMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <Text style={styles.label}>Код клиента *</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: CL001"
              value={clientCode}
              onChangeText={setClientCode}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Имя *</Text>
            <TextInput
              style={styles.input}
              placeholder="ФИО или название компании"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Телефон *</Text>
            <TextInput
              style={styles.input}
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Адрес</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Адрес доставки"
              value={address}
              onChangeText={setAddress}
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
    color: '#007AFF',
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

export default AddClientScreen;
