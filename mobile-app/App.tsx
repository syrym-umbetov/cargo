import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RootStackParamList, MainTabParamList } from './src/types';
import { Colors } from './src/constants/colors';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import ItemsScreen from './src/screens/ItemsScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AddClientScreen from './src/screens/AddClientScreen';
import EditClientScreen from './src/screens/EditClientScreen';
import ClientDetailScreen from './src/screens/ClientDetailScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import EditItemScreen from './src/screens/EditItemScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function LogoTitle() {
  return (
    <Image
      source={require('./assets/logo.png')}
      style={{ width: 40, height: 40 }}
      resizeMode="contain"
    />
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Clients':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Items':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Scanner':
              iconName = focused ? 'scan' : 'scan-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerLeft: () => <LogoTitle />,
      })}
    >
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ title: 'Клиенты' }}
      />
      <Tab.Screen
        name="Items"
        component={ItemsScreen}
        options={{ title: 'Товары' }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ title: 'Сканер' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Show loading screen here if needed
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="ClientDetails"
              component={ClientDetailScreen}
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="AddClient"
              component={AddClientScreen}
              options={{
                headerShown: false,
                presentation: 'modal'
              }}
            />
            <Stack.Screen
              name="EditClient"
              component={EditClientScreen}
              options={{
                headerShown: false,
                presentation: 'modal'
              }}
            />
            <Stack.Screen
              name="AddItem"
              component={AddItemScreen}
              options={{
                headerShown: false,
                presentation: 'modal'
              }}
            />
            <Stack.Screen
              name="EditItem"
              component={EditItemScreen}
              options={{
                headerShown: false,
                presentation: 'modal'
              }}
            />
            <Stack.Screen
              name="ItemDetails"
              component={ItemDetailScreen}
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="Scanner"
              component={ScannerScreen}
              options={{
                headerShown: false,
                presentation: 'modal'
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
