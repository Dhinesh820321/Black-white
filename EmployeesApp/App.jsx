import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth, AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Home, Clock, Receipt, DollarSign, User } from 'lucide-react-native';

import './src/i18n/i18n';
import i18n from './src/i18n/i18n';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import BillingScreen from './src/screens/BillingScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CollectionScreen from './src/screens/CollectionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#0ea5e9',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#22c55e',
  danger: '#ef4444',
};

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function TabIcon({ name, color, size }) {
  const icons = {
    Home: Home,
    Attendance: Clock,
    Billing: Receipt,
    Expense: DollarSign,
    Profile: User,
  };
  const Icon = icons[name] || Home;
  return <Icon size={size} color={color} />;
}

function MainTabs() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      key={i18n.language}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <TabIcon name={route.name} color={color} size={size} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: COLORS.gray[200],
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{ tabBarLabel: t('home') }}
      />
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceScreen}
        options={{ tabBarLabel: t('markAttendance') }}
      />
      <Tab.Screen 
        name="Billing" 
        component={BillingScreen}
        options={{ tabBarLabel: t('newBilling') }}
      />
      <Tab.Screen 
        name="Expense" 
        component={ExpenseScreen}
        options={{ tabBarLabel: t('addExpense') }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              headerShown: true,
              headerTitle: i18n.t('profile'),
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: 'white' },
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerTitle: i18n.t('settings'),
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: 'white' },
            }}
          />
          <Stack.Screen 
            name="History" 
            component={HistoryScreen}
            options={{
              headerShown: true,
              headerTitle: 'History',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: 'white' },
            }}
          />
          <Stack.Screen 
            name="Collection" 
            component={CollectionScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}
