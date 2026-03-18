import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
  I18nManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const STORAGE_KEY = 'bookings_data';
const DELETE_PASSWORD = 'Hussain2020@';

interface Booking {
  id: string;
  queueNumber: number;
  clientName: string;
  expectedTime: string;
  createdAt: string;
}

// Colors from design system
const COLORS = {
  primary: '#5DADE2',
  primaryLight: '#AED6F1',
  primaryDark: '#3498DB',
  bgMain: '#FDFBF7',
  bgPaper: '#FFFFFF',
  bgSubtle: '#F4F1EA',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textDisabled: '#BDC3C7',
  textInverse: '#FFFFFF',
  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  borderLight: '#E5E7E9',
  borderMedium: '#D7DBDD',
};

export default function Index() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null); // null = all, id = specific
  const [clientName, setClientName] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Load bookings from storage
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setBookings(JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to load bookings', e);
    }
  };

  const saveBookings = async (newBookings: Booking[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newBookings));
      setBookings(newBookings);
    } catch (e) {
      console.error('Failed to save bookings', e);
    }
  };

  const getNextQueueNumber = (): number => {
    if (bookings.length === 0) return 1;
    const maxQueue = Math.max(...bookings.map((b) => b.queueNumber));
    return maxQueue + 1;
  };

  const handleAddBooking = () => {
    if (!clientName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم العميل');
      return;
    }
    const newBooking: Booking = {
      id: Date.now().toString(),
      queueNumber: getNextQueueNumber(),
      clientName: clientName.trim(),
      expectedTime: expectedTime.trim() || 'غير محدد',
      createdAt: new Date().toISOString(),
    };
    const updated = [...bookings, newBooking];
    saveBookings(updated);
    setClientName('');
    setExpectedTime('');
    setShowAddModal(false);
  };

  const handleEditBooking = () => {
    if (!editingBooking || !clientName.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم العميل');
      return;
    }
    const updated = bookings.map((b) =>
      b.id === editingBooking.id
        ? { ...b, clientName: clientName.trim(), expectedTime: expectedTime.trim() || 'غير محدد' }
        : b
    );
    saveBookings(updated);
    setClientName('');
    setExpectedTime('');
    setEditingBooking(null);
    setShowEditModal(false);
  };

  const openEditModal = (booking: Booking) => {
    setEditingBooking(booking);
    setClientName(booking.clientName);
    setExpectedTime(booking.expectedTime === 'غير محدد' ? '' : booking.expectedTime);
    setShowEditModal(true);
  };

  const openDeleteModal = (bookingId: string | null) => {
    setDeleteTarget(bookingId);
    setPassword('');
    setPasswordError(false);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (password !== DELETE_PASSWORD) {
      setPasswordError(true);
      return;
    }
    if (deleteTarget === null) {
      // Delete all
      saveBookings([]);
    } else {
      // Delete specific
      const updated = bookings.filter((b) => b.id !== deleteTarget);
      saveBookings(updated);
    }
    setPassword('');
    setPasswordError(false);
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const openAddModal = () => {
    setClientName('');
    setExpectedTime('');
    setShowAddModal(true);
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <View style={styles.card} testID={`booking-card-${item.id}`}>
      <View style={styles.cardHeader}>
        <View style={styles.queueBadge}>
          <Text style={styles.queueNumber}>{item.queueNumber}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.timeText}> {item.expectedTime}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          testID={`edit-booking-${item.id}`}
          style={styles.editBtn}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          testID={`delete-booking-${item.id}`}
          style={styles.deleteBtn}
          onPress={() => openDeleteModal(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer} testID="empty-list">
      <Ionicons name="calendar-outline" size={80} color={COLORS.primaryLight} />
      <Text style={styles.emptyTitle}>لا توجد حجوزات</Text>
      <Text style={styles.emptySubtitle}>اضغط على زر الإضافة لحجز موعد جديد</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>قائمة المواعيد المحجوزه</Text>
          <View style={styles.counterContainer}>
            <View style={styles.counterBadge}>
              <Text style={styles.counterNumber}>{bookings.length}</Text>
            </View>
            <Text style={styles.counterLabel}>عدد الحجوزات</Text>
          </View>
        </View>

        {/* Delete All Button */}
        {bookings.length > 0 && (
          <TouchableOpacity
            testID="delete-all-btn"
            style={styles.deleteAllBtn}
            onPress={() => openDeleteModal(null)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={styles.deleteAllText}> حذف جميع الحجوزات</Text>
          </TouchableOpacity>
        )}

        {/* Bookings List */}
        <FlatList
          testID="bookings-list"
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            bookings.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />

        {/* FAB - Add Button */}
        <TouchableOpacity
          testID="add-booking-fab"
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color={COLORS.textInverse} />
        </TouchableOpacity>

        {/* Add Booking Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setShowAddModal(false); }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKAV}
              >
                <Pressable style={styles.modalContent} testID="add-booking-modal" onPress={(e) => e.stopPropagation()}>
                  <Text style={styles.modalTitle}>حجز موعد جديد</Text>

                  <Text style={styles.inputLabel}>اسم العميل</Text>
                  <TextInput
                    testID="input-client-name"
                    style={styles.input}
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder="أدخل اسم العميل"
                    placeholderTextColor={COLORS.textDisabled}
                    textAlign="right"
                  />

                  <Text style={styles.inputLabel}>الوقت المتوقع</Text>
                  <TextInput
                    testID="input-expected-time"
                    style={styles.input}
                    value={expectedTime}
                    onChangeText={setExpectedTime}
                    placeholder="مثال: 3:00 مساءً"
                    placeholderTextColor={COLORS.textDisabled}
                    textAlign="right"
                  />

                  <Text style={styles.queuePreview}>
                    رقم الدور: <Text style={styles.queuePreviewNumber}>{getNextQueueNumber()}</Text>
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      testID="confirm-add-btn"
                      style={styles.primaryBtn}
                      onPress={handleAddBooking}
                    >
                      <Text style={styles.primaryBtnText}>إضافة الحجز</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="cancel-add-btn"
                      style={styles.secondaryBtn}
                      onPress={() => setShowAddModal(false)}
                    >
                      <Text style={styles.secondaryBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </KeyboardAvoidingView>
          </Pressable>
        </Modal>

        {/* Edit Booking Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setShowEditModal(false); setEditingBooking(null); }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKAV}
              >
                <Pressable style={styles.modalContent} testID="edit-booking-modal" onPress={(e) => e.stopPropagation()}>
                  <Text style={styles.modalTitle}>تعديل الحجز</Text>

                  <Text style={styles.inputLabel}>اسم العميل</Text>
                  <TextInput
                    testID="input-edit-client-name"
                    style={styles.input}
                    value={clientName}
                    onChangeText={setClientName}
                    placeholder="أدخل اسم العميل"
                    placeholderTextColor={COLORS.textDisabled}
                    textAlign="right"
                  />

                  <Text style={styles.inputLabel}>الوقت المتوقع</Text>
                  <TextInput
                    testID="input-edit-expected-time"
                    style={styles.input}
                    value={expectedTime}
                    onChangeText={setExpectedTime}
                    placeholder="مثال: 3:00 مساءً"
                    placeholderTextColor={COLORS.textDisabled}
                    textAlign="right"
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      testID="confirm-edit-btn"
                      style={styles.primaryBtn}
                      onPress={handleEditBooking}
                    >
                      <Text style={styles.primaryBtnText}>حفظ التعديل</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="cancel-edit-btn"
                      style={styles.secondaryBtn}
                      onPress={() => {
                        setShowEditModal(false);
                        setEditingBooking(null);
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </KeyboardAvoidingView>
          </Pressable>
        </Modal>

        {/* Delete Confirmation Modal with Password */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setShowDeleteModal(false); setPassword(''); setPasswordError(false); }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalKAV}
              >
                <Pressable style={styles.modalContent} testID="delete-modal" onPress={(e) => e.stopPropagation()}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={48}
                    color={COLORS.error}
                    style={styles.deleteIcon}
                  />
                  <Text style={styles.modalTitle}>
                    {deleteTarget === null ? 'حذف جميع الحجوزات' : 'حذف الحجز'}
                  </Text>
                  <Text style={styles.deleteWarning}>
                    {deleteTarget === null
                      ? 'سيتم حذف جميع الحجوزات. هذا الإجراء لا يمكن التراجع عنه.'
                      : 'سيتم حذف هذا الحجز. هذا الإجراء لا يمكن التراجع عنه.'}
                  </Text>

                  <Text style={styles.inputLabel}>كلمة السر</Text>
                  <TextInput
                    testID="input-password"
                    style={[styles.input, passwordError && styles.inputError]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError(false);
                    }}
                    placeholder="أدخل كلمة السر"
                    placeholderTextColor={COLORS.textDisabled}
                    secureTextEntry
                    textAlign="right"
                  />
                  {passwordError && (
                    <Text style={styles.errorText} testID="password-error">
                      كلمة السر غير صحيحة
                    </Text>
                  )}

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      testID="confirm-delete-btn"
                      style={styles.dangerBtn}
                      onPress={handleDelete}
                    >
                      <Text style={styles.primaryBtnText}>تأكيد الحذف</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="cancel-delete-btn"
                      style={styles.secondaryBtn}
                      onPress={() => {
                        setShowDeleteModal(false);
                        setPassword('');
                        setPasswordError(false);
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </KeyboardAvoidingView>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.textInverse,
    textAlign: 'center',
    marginBottom: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  counterBadge: {
    backgroundColor: COLORS.textInverse,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  counterLabel: {
    fontSize: 16,
    color: COLORS.textInverse,
    fontWeight: '500',
  },
  // Delete All Button
  deleteAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteAllText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  // List
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  // Card
  card: {
    backgroundColor: COLORS.bgPaper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.bgSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  queueBadge: {
    backgroundColor: COLORS.primaryLight,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
  },
  cardInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'left',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#EBF5FB',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textDisabled,
    marginTop: 8,
    textAlign: 'center',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKAV: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.bgPaper,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Input
  inputLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORS.bgMain,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  queuePreview: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.bgSubtle,
    padding: 12,
    borderRadius: 12,
  },
  queuePreviewNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  // Buttons
  modalButtons: {
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderMedium,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerBtn: {
    backgroundColor: COLORS.error,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Delete modal extras
  deleteIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  deleteWarning: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 12,
  },
});

