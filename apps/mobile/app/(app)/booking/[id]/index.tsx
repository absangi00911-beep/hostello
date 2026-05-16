import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Alert, SafeAreaView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { apiRequest } from '../../../../src/services/api';
import type { HostelWithDetails } from '@hostello/shared';

/* -- Types -- */
interface Room {
  id: string;
  name: string;
  capacity: number;
  pricePerMonth: number;
  available: number;
}

type PaymentMethod = 'safepay' | 'jazzcash' | 'easypaisa';

type Step = 'details' | 'confirm';

/* -- Helpers -- */
function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthsBetween(start: Date, end: Date): number {
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()),
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; desc: string }[] = [
  { id: 'safepay',   label: 'Safepay',   desc: 'Visa / Mastercard / Bank' },
  { id: 'jazzcash',  label: 'JazzCash',  desc: 'Mobile wallet' },
  { id: 'easypaisa', label: 'EasyPaisa', desc: 'Mobile wallet' },
];

/* -- DatePicker row --------------------------------------- */
interface DateRowProps {
  label: string;
  date: Date;
  minDate: Date;
  onChange: (date: Date) => void;
}

function DateRow({ label, date, minDate, onChange }: DateRowProps) {
  const [show, setShow] = useState(false);

  function handleChange(_: DateTimePickerEvent, selected?: Date) {
    setShow(Platform.OS === 'ios');
    if (selected) onChange(selected);
  }

  return (
    <View style={styles.dateRow}>
      <Text style={styles.dateLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(date)}. Tap to change.`}
      >
        <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
        <Text style={styles.dateChevron}>›</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          value={date}
          minimumDate={minDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

/* -- Main Screen ------------------------------------------ */
export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  /* -- State -------------------------------------------- */
  const [hostel, setHostel]         = useState<HostelWithDetails | null>(null);
  const [rooms, setRooms]           = useState<Room[]>([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [step, setStep]             = useState<Step>('details');

  const today     = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultCheckOut = addMonths(today, 1);

  const [checkIn,        setCheckIn]        = useState<Date>(today);
  const [checkOut,       setCheckOut]       = useState<Date>(defaultCheckOut);
  const [guests,         setGuests]         = useState(1);
  const [selectedRoom,   setSelectedRoom]   = useState<Room | null>(null);
  const [paymentMethod,  setPaymentMethod]  = useState<PaymentMethod>('safepay');

  /* -- Fetch hostel + rooms ----------------------------- */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    apiRequest<{ data: HostelWithDetails & { rooms_rel?: Room[] } }>(`/hostels/${id}`)
      .then((res) => {
        const h = res.data;
        setHostel(h);
        const availableRooms = (h.rooms_rel ?? []).filter((r) => r.available > 0);
        setRooms(availableRooms);
        if (availableRooms.length > 0) setSelectedRoom(availableRooms[0]);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  /* -- Derived values ----------------------------------- */
  const months       = monthsBetween(checkIn, checkOut);
  const pricePerMonth = selectedRoom?.pricePerMonth ?? hostel?.pricePerMonth ?? 0;
  const total         = pricePerMonth * months;

  /* -- Validation --------------------------------------- */
  const validate = useCallback((): string | null => {
    if (checkOut <= checkIn)    return 'Check-out must be after check-in.';
    if (months < 1)             return 'Minimum stay is 1 month.';
    if (guests < 1 || guests > 4) return 'Guests must be between 1 and 4.';
    return null;
  }, [checkIn, checkOut, months, guests]);

  /* -- Submit ------------------------------------------- */
  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Check your booking', validationError);
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          hostelId: id,
          roomId:   selectedRoom?.id,
          checkIn:  checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests,
          paymentMethod,
        }),
      });
      router.replace('/(app)/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed. Please try again.';
      Alert.alert('Booking failed', message);
    } finally {
      setSubmitting(false);
    }
  }, [id, selectedRoom, checkIn, checkOut, guests, paymentMethod, validate]);

  /* -- Handle checkIn change — push checkOut forward --- */
  function handleCheckInChange(date: Date) {
    setCheckIn(date);
    if (checkOut <= date) setCheckOut(addMonths(date, 1));
  }

  /* -- Loading / error states --------------------------- */
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C28B1A" />
        <Text style={styles.loadingText}>Loading hostel details…</Text>
      </View>
    );
  }

  if (error || !hostel) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Couldn't load hostel</Text>
        <Text style={styles.errorBody}>{error ?? 'Unknown error'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* -- Step 1: Details ---------------------------------- */
  if (step === 'details') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: 'Book a stay', headerBackTitle: 'Back' }} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Hostel summary */}
          <View style={styles.hostelCard}>
            <Text style={styles.hostelName}>{hostel.name}</Text>
            <Text style={styles.hostelCity}>{hostel.city}{hostel.area ? `, ${hostel.area}` : ''}</Text>
          </View>

          <View style={styles.divider} />

          {/* Room selector */}
          {rooms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Room type</Text>
              {rooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    styles.roomOption,
                    selectedRoom?.id === room.id && styles.roomOptionSelected,
                  ]}
                  onPress={() => setSelectedRoom(room)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedRoom?.id === room.id }}
                  accessibilityLabel={`${room.name}, ${formatPKR(room.pricePerMonth)} per month, ${room.available} spots available`}
                >
                  <View style={styles.roomOptionLeft}>
                    <Text style={[
                      styles.roomName,
                      selectedRoom?.id === room.id && styles.roomNameSelected,
                    ]}>
                      {room.name}
                    </Text>
                    <Text style={styles.roomMeta}>
                      {room.available} spot{room.available !== 1 ? 's' : ''} left
                    </Text>
                  </View>
                  <Text style={[
                    styles.roomPrice,
                    selectedRoom?.id === room.id && styles.roomPriceSelected,
                  ]}>
                    {formatPKR(room.pricePerMonth)}/mo
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay dates</Text>
            <DateRow
              label="Check-in"
              date={checkIn}
              minDate={today}
              onChange={handleCheckInChange}
            />
            <DateRow
              label="Check-out"
              date={checkOut}
              minDate={addMonths(checkIn, 1)}
              onChange={setCheckOut}
            />
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {months} month{months !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Guests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guests</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepperBtn, guests <= 1 && styles.stepperBtnDisabled]}
                onPress={() => setGuests((g) => Math.max(1, g - 1))}
                disabled={guests <= 1}
                accessibilityLabel="Remove guest"
                accessibilityRole="button"
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue} accessibilityLabel={`${guests} guest${guests !== 1 ? 's' : ''}`}>
                {guests}
              </Text>
              <TouchableOpacity
                style={[styles.stepperBtn, guests >= 4 && styles.stepperBtnDisabled]}
                onPress={() => setGuests((g) => Math.min(4, g + 1))}
                disabled={guests >= 4}
                accessibilityLabel="Add guest"
                accessibilityRole="button"
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment method</Text>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === pm.id && styles.paymentOptionSelected,
                ]}
                onPress={() => setPaymentMethod(pm.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: paymentMethod === pm.id }}
              >
                <View style={[
                  styles.radio,
                  paymentMethod === pm.id && styles.radioSelected,
                ]}>
                  {paymentMethod === pm.id && <View style={styles.radioDot} />}
                </View>
                <View>
                  <Text style={styles.paymentLabel}>{pm.label}</Text>
                  <Text style={styles.paymentDesc}>{pm.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Price summary + CTA */}
        <View style={styles.footer}>
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPriceLabel}>
              {formatPKR(pricePerMonth)} × {months} mo
            </Text>
            <Text style={styles.footerTotal}>{formatPKR(total)}</Text>
          </View>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => {
              const err = validate();
              if (err) { Alert.alert('Check your booking', err); return; }
              setStep('confirm');
            }}
            accessibilityRole="button"
            accessibilityLabel="Review booking"
          >
            <Text style={styles.ctaText}>Review booking →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* -- Step 2: Confirm ---------------------------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Confirm booking', headerBackTitle: 'Edit' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        <Text style={styles.confirmHeading}>Review your booking</Text>

        {/* Summary rows */}
        {[
          { label: 'Hostel',          value: hostel.name },
          { label: 'Room',            value: selectedRoom?.name ?? 'Any available' },
          { label: 'Check-in',        value: formatDate(checkIn) },
          { label: 'Check-out',       value: formatDate(checkOut) },
          { label: 'Duration',        value: `${months} month${months !== 1 ? 's' : ''}` },
          { label: 'Guests',          value: `${guests}` },
          { label: 'Payment',         value: PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label ?? paymentMethod },
        ].map(({ label, value }) => (
          <View key={label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPKR(total)}</Text>
        </View>

        <Text style={styles.disclaimer}>
          By confirming you agree to the hostel's house rules. Payment will be collected
          via {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('details')}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>← Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaButtonFlex, submitting && styles.ctaButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Confirm and pay"
          accessibilityState={{ disabled: submitting }}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.ctaText}>Confirm & pay</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* -- Styles ----------------------------------------------- */
const GOLD    = '#C28B1A';
const GOLD_DK = '#9E6F0E';
const BG      = '#FDF8F0';
const CARD    = '#FEFCF8';
const BORDER  = '#E0D4C0';
const TEXT    = '#2A2318';
const MUTED   = '#857060';

const styles = StyleSheet.create({
  safeArea:   { flex: 1, backgroundColor: BG },
  scroll:     { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: BG },

  // Loading / error
  loadingText:  { marginTop: 12, color: MUTED, fontSize: 14 },
  errorIcon:    { fontSize: 36, marginBottom: 12 },
  errorTitle:   { fontSize: 18, fontWeight: '600', color: TEXT, marginBottom: 6 },
  errorBody:    { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 20 },
  retryButton:  { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:    { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Hostel card
  hostelCard:   { padding: 16, backgroundColor: CARD },
  hostelName:   { fontSize: 18, fontWeight: '700', color: TEXT, marginBottom: 2 },
  hostelCity:   { fontSize: 13, color: MUTED },

  divider:      { height: 1, backgroundColor: BORDER, marginHorizontal: 0 },

  // Section
  section:      { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },

  // Room options
  roomOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: CARD, marginBottom: 8,
  },
  roomOptionSelected: { borderColor: GOLD, backgroundColor: '#FDF3DC' },
  roomOptionLeft:     { flex: 1 },
  roomName:           { fontSize: 14, fontWeight: '500', color: TEXT },
  roomNameSelected:   { color: GOLD_DK, fontWeight: '600' },
  roomMeta:           { fontSize: 12, color: MUTED, marginTop: 2 },
  roomPrice:          { fontSize: 14, fontWeight: '600', color: MUTED },
  roomPriceSelected:  { color: GOLD_DK },

  // Dates
  dateRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  dateLabel:      { fontSize: 14, color: TEXT, fontWeight: '500' },
  dateButton:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateButtonText: { fontSize: 14, color: GOLD_DK, fontWeight: '600' },
  dateChevron:    { fontSize: 18, color: GOLD_DK },
  durationBadge:  { alignSelf: 'flex-start', backgroundColor: '#FDF3DC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  durationText:   { fontSize: 13, fontWeight: '600', color: GOLD_DK },

  // Stepper
  stepper:           { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepperBtn:        { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', backgroundColor: CARD },
  stepperBtnDisabled:{ opacity: 0.35 },
  stepperBtnText:    { fontSize: 20, color: TEXT, lineHeight: 24 },
  stepperValue:      { fontSize: 20, fontWeight: '600', color: TEXT, minWidth: 28, textAlign: 'center' },

  // Payment
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: CARD, marginBottom: 8,
  },
  paymentOptionSelected: { borderColor: GOLD, backgroundColor: '#FDF3DC' },
  radio:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: GOLD },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: GOLD },
  paymentLabel:  { fontSize: 14, fontWeight: '600', color: TEXT },
  paymentDesc:   { fontSize: 12, color: MUTED, marginTop: 1 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderTopWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  footerPriceRow:  { flex: 1 },
  footerPriceLabel:{ fontSize: 12, color: MUTED },
  footerTotal:     { fontSize: 18, fontWeight: '700', color: TEXT },
  ctaButton: {
    backgroundColor: GOLD, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaButtonFlex:     { flex: 1 },
  ctaButtonDisabled: { opacity: 0.6 },
  ctaText:           { color: '#fff', fontWeight: '700', fontSize: 15 },
  backButton:        { paddingHorizontal: 12, paddingVertical: 14 },
  backButtonText:    { fontSize: 15, color: GOLD_DK, fontWeight: '600' },

  // Confirm step
  confirmHeading: { fontSize: 22, fontWeight: '700', color: TEXT, padding: 16, paddingBottom: 8 },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER },
  summaryLabel:   { fontSize: 14, color: MUTED },
  summaryValue:   { fontSize: 14, fontWeight: '500', color: TEXT, maxWidth: '55%', textAlign: 'right' },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  totalLabel:     { fontSize: 16, fontWeight: '600', color: TEXT },
  totalAmount:    { fontSize: 22, fontWeight: '700', color: GOLD_DK },
  disclaimer:     { fontSize: 12, color: MUTED, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 18 },
});