import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { attendanceAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Clock, MapPin, CheckCircle, LogOut, History } from 'lucide-react-native';

const COLORS = {
  primary: '#0ea5e9',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
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
};

export default function AttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendance, setAttendance] = useState(null);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await attendanceAPI.getToday();
      if (res.success && res.data) {
        setAttendance({
          check_in: res.data.check_in,
          check_out: res.data.check_out,
          status: res.data.status,
          working_minutes: res.data.working_minutes,
          location: res.data.location
        });
      } else {
        setAttendance(null);
      }
    } catch (error) {
      console.error('Attendance error:', error);
      setAttendance(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceAPI.checkIn({});
      if (res.success) {
        Alert.alert(t('success'), t('attendanceMarked'));
        fetchAttendance();
      } else {
        Alert.alert(t('error'), res.message || t('error'));
      }
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    Alert.alert(
      t('checkOutBtn'),
      t('confirm') + '?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('checkOutBtn'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await attendanceAPI.checkOut({});
              if (res.success) {
                Alert.alert(t('success'), t('checkedOut'));
                fetchAttendance();
              } else {
                Alert.alert(t('error'), res.message || t('error'));
              }
            } catch (error) {
              Alert.alert(t('error'), error.response?.data?.message || t('error'));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const isCheckedIn = !!attendance?.check_in;
  const isCheckedOut = !!attendance?.check_out;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-6 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">{t('markAttendance')}</Text>
        <Text className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchAttendance();
          }} />
        }
      >
        <View className="px-5 py-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <View className="items-center mb-6">
              <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
                isCheckedIn && !isCheckedOut ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Clock size={40} color={isCheckedIn && !isCheckedOut ? COLORS.success : COLORS.gray[400]} />
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {isCheckedIn && !isCheckedOut ? t('checkedIn') : 
                 isCheckedOut ? t('completed') : t('notCheckedIn')}
              </Text>
            </View>

            <View className="flex-row justify-around mb-6">
              <View className="items-center">
                <Text className="text-sm text-gray-500 mb-1">{t('checkIn')}</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {formatTime(attendance?.check_in)}
                </Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center">
                <Text className="text-sm text-gray-500 mb-1">{t('checkOut')}</Text>
                <Text className="text-lg font-semibold text-gray-900">
                  {formatTime(attendance?.check_out)}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-center mb-4">
              <MapPin size={16} color={COLORS.gray[400]} />
              <Text className="text-gray-500 ml-2 text-sm">
                {attendance?.location || t('checkIn')}
              </Text>
            </View>

            {!isCheckedOut && (
              <TouchableOpacity
                className={`py-4 rounded-xl items-center ${
                  isCheckedIn ? 'bg-red-500' : 'bg-primary-600'
                }`}
                onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View className="flex-row items-center">
                    {isCheckedIn ? (
                      <>
                        <LogOut size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">{t('checkOutBtn')}</Text>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">{t('checkInBtn')}</Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm border border-gray-100"
            onPress={() => navigation.navigate('History')}
          >
            <View className="flex-row items-center">
              <View className="p-3 bg-blue-100 rounded-xl mr-4">
                <History size={24} color={COLORS.primary} />
              </View>
              <Text className="font-semibold text-gray-900">{t('attendanceHistory')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
