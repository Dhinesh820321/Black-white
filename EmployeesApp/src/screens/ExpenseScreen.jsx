import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { expensesAPI } from '../api/api';
import { DollarSign, FileText, Clock, CreditCard, Wallet, QrCode } from 'lucide-react-native';

const COLORS = {
  primary: '#0ea5e9',
  success: '#22c55e',
  danger: '#ef4444',
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

const PAYMENT_MODES = [
  { id: 'CASH', label: 'Cash', icon: Wallet },
  { id: 'UPI', label: 'UPI', icon: QrCode },
];

export default function ExpenseScreen() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    payment_mode: 'CASH',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('enterTitle');
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t('validAmount');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await expensesAPI.create({
        title: formData.title.trim(),
        amount: parseFloat(formData.amount),
        payment_mode: formData.payment_mode,
        notes: formData.notes.trim(),
      });

      if (res.success) {
        Alert.alert(t('success'), t('expenseSaved'), [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                title: '',
                amount: '',
                payment_mode: 'CASH',
                notes: '',
              });
              setErrors({});
            },
          },
        ]);
      } else {
        Alert.alert(t('error'), res.message || t('error'));
      }
    } catch (error) {
      console.error('Expense error:', error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       t('error');
      Alert.alert(t('error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-6 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">{t('addExpense')}</Text>
        <Text className="text-gray-500 mt-1">{t('recordExpensePage')}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">{t('expenseTitle')} *</Text>
              <View className={`flex-row items-center rounded-xl px-4 border ${
                errors.title ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <FileText size={20} color={COLORS.gray[400]} />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900"
                  placeholder={t('titlePlaceholder')}
                  value={formData.title}
                  onChangeText={(text) => {
                    setFormData({ ...formData, title: text });
                    if (errors.title) setErrors({ ...errors, title: null });
                  }}
                  editable={!loading}
                />
              </View>
              {errors.title && (
                <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
              )}
            </View>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">{t('amount')} *</Text>
              <View className={`flex-row items-center rounded-xl px-4 border ${
                errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}>
                <DollarSign size={20} color={COLORS.gray[400]} />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={formData.amount}
                  onChangeText={(text) => {
                    setFormData({ ...formData, amount: text });
                    if (errors.amount) setErrors({ ...errors, amount: null });
                  }}
                  editable={!loading}
                />
              </View>
              {errors.amount && (
                <Text className="text-red-500 text-sm mt-1">{errors.amount}</Text>
              )}
            </View>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">{t('paymentMode')}</Text>
              <View className="flex-row gap-3">
                {PAYMENT_MODES.map(mode => {
                  const modeLabel = mode.id === 'CASH' ? t('cash') : t('upi');
                  const IconComponent = mode.icon;
                  const isActive = formData.payment_mode === mode.id;
                  const activeColor = mode.id === 'CASH' ? '#28a745' : '#007bff';
                  const activeBg = mode.id === 'CASH' ? '#e6f9ed' : '#e6f0ff';
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={isActive ? { borderColor: activeColor, backgroundColor: activeBg } : {}}
                      className={`flex-1 py-3 rounded-xl items-center border ${
                        isActive ? '' : 'border-gray-200 bg-gray-50'
                      }`}
                      onPress={() => setFormData({ ...formData, payment_mode: mode.id })}
                      disabled={loading}
                    >
                      <IconComponent
                        size={20}
                        color={isActive ? activeColor : COLORS.gray[400]}
                      />
                      <Text
                        style={isActive ? { color: activeColor } : {}}
                        className={`mt-1 text-sm font-semibold ${
                          isActive ? '' : 'text-gray-500'
                        }`}
                      >
                        {modeLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-sm font-semibold text-gray-700 mb-2">{t('notes')}</Text>
              <View className="flex-row items-start rounded-xl px-4 border border-gray-200 bg-gray-50">
                <Clock size={20} color={COLORS.gray[400]} style={{ marginTop: 14 }} />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900 min-h-[80]"
                  placeholder={t('notesPlaceholder')}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            className={`py-4 rounded-xl items-center mt-6 ${
              loading ? 'bg-gray-400' : 'bg-primary-600'
            }`}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">{t('recordExpenseBtn')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
