import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  SafeAreaView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { apiRequest } from "../../../../src/services/api";
import type { HostelWithDetails } from "@hostello/shared";
import { colors } from "../../../../src/theme";

/* -- Types ------------------------------------------------ */
interface Room {
  id: string;
  name: string;
  capacity: number;
  pricePerMonth: number;
  available: number;
}

type PaymentMethod = "safepay" | "jazzcash" | "easypaisa";
type Step = "details" | "confirm";
type PaymentState = "idle" | "paid" | "cancelled" | "failed";

/* -- Helpers ---------------------------------------------- */
function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
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
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Parse the `status` and `bookingId` params from a Safepay return URL.
 * Handles both the custom scheme (hostello://payment/return?...) and any
 * https fallback — expo-linking handles both correctly.
 */
function parseReturnUrl(url: string): { status: string; bookingId: string | null } {
  try {
    const parsed = Linking.parse(url);
    const status = (parsed.queryParams?.status as string) ?? "unknown";
    const bookingId = (parsed.queryParams?.bookingId as string) ?? null;
    return { status, bookingId };
  } catch {
    return { status: "unknown", bookingId: null };
  }
}

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  enabled: boolean;
}[] = [
  { id: "safepay",   label: "Safepay",   desc: "Visa / Mastercard / Bank", enabled: true  },
  { id: "jazzcash",  label: "JazzCash",  desc: "Mobile wallet",            enabled: false },
  { id: "easypaisa", label: "EasyPaisa", desc: "Mobile wallet",            enabled: false },
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
    setShow(Platform.OS === "ios");
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
          display={Platform.OS === "ios" ? "inline" : "default"}
          value={date}
          minimumDate={minDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

/* -- Payment result screen -------------------------------- */
interface PaymentResultProps {
  state: PaymentState;
  hostelName: string;
  onRetry: () => void;
  onDone: () => void;
}

function PaymentResult({ state, hostelName, onRetry, onDone }: PaymentResultProps) {
  const isPaid = state === "paid";
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.resultContainer}>
        <Text style={styles.resultIcon}>{isPaid ? "✅" : "❌"}</Text>
        <Text style={styles.resultTitle}>
          {isPaid ? "Payment confirmed" : "Payment unsuccessful"}
        </Text>
        <Text style={styles.resultBody}>
          {isPaid
            ? `Your booking at ${hostelName} is awaiting owner confirmation. You'll be notified once it's confirmed.`
            : state === "cancelled"
            ? "You cancelled the payment. Your booking is held for 30 minutes — you can try again."
            : "Something went wrong with the payment. Your booking is held for 30 minutes — please try again."}
        </Text>

        {isPaid ? (
          <TouchableOpacity style={styles.ctaButton} onPress={onDone} accessibilityRole="button">
            <Text style={styles.ctaText}>View my bookings</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.ctaButton} onPress={onRetry} accessibilityRole="button">
              <Text style={styles.ctaText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onDone} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>View my bookings</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/* -- Main Screen ------------------------------------------ */
export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  /* -- State -------------------------------------------- */
  const [hostel, setHostel] = useState<HostelWithDetails | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("details");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultCheckOut = addMonths(today, 1);

  const [checkIn, setCheckIn] = useState<Date>(today);
  const [checkOut, setCheckOut] = useState<Date>(defaultCheckOut);
  const [guests, setGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("safepay");

  // Prevents the Linking listener from firing a second time if
  // openAuthSessionAsync already handled the return URL.
  const returnHandled = useRef(false);

  /* -- Deep link fallback listener ------------------------ */
  // openAuthSessionAsync handles the return URL synchronously on iOS via
  // SFAuthenticationSession.  On Android (Custom Tabs) the URL sometimes
  // arrives as a Linking event instead.  This listener is the safety net
  // so no payment confirmation is ever lost.
  const incomingUrl = Linking.useURL();

  useEffect(() => {
    if (!incomingUrl) return;
    if (returnHandled.current) return;
    if (!incomingUrl.startsWith("hostello://payment/return")) return;

    returnHandled.current = true;
    const { status } = parseReturnUrl(incomingUrl);
    setPaymentState(status === "paid" ? "paid" : status === "cancelled" ? "cancelled" : "failed");
    setSubmitting(false);
  }, [incomingUrl]);

  /* -- Fetch hostel + rooms ----------------------------- */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    apiRequest<HostelWithDetails & { rooms_rel?: Room[] }>(`/hostels/${id}`)
      .then((res) => {
        setHostel(res);
        const available = (res.rooms_rel ?? []).filter((r: Room) => r.available > 0);
        setRooms(available);
        if (available.length > 0) setSelectedRoom(available[0]);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  /* -- Derived values ----------------------------------- */
  const months = monthsBetween(checkIn, checkOut);
  const pricePerMonth = selectedRoom?.pricePerMonth ?? hostel?.pricePerMonth ?? 0;
  const total = pricePerMonth * months;

  /* -- Validation --------------------------------------- */
  const validate = useCallback((): string | null => {
    if (checkOut <= checkIn) return "Check-out must be after check-in.";
    if (months < 1) return "Minimum stay is 1 month.";
    if (guests < 1 || guests > 4) return "Guests must be between 1 and 4.";
    return null;
  }, [checkIn, checkOut, months, guests]);

  /* -- Submit ------------------------------------------- */
  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Check your booking", validationError);
      return;
    }

    setSubmitting(true);
    setPaymentError(null);
    returnHandled.current = false;

    try {
      // 1. Create booking record
      const booking = await apiRequest<{ id: string }>("/bookings", {
        method: "POST",
        body: JSON.stringify({
          hostelId: id,
          roomId: selectedRoom?.id,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests,
          paymentMethod,
        }),
      });

      // 2. Get Safepay checkout URL
      const { paymentUrl } = await apiRequest<{ paymentUrl: string }>(
        "/payment/initiate",
        { method: "POST", body: JSON.stringify({ bookingId: booking.id }) },
      );

      // 3. Open Safepay in an in-app browser.
      //    openAuthSessionAsync monitors for any redirect whose URL begins
      //    with "hostello://payment/return" and closes the browser when it
      //    detects one — keeping the user inside the app the whole time.
      //    The payment/initiate API route sets the Safepay redirect URL to
      //    hostello://payment/return?bookingId=...&status=paid  (mobile branch).
      const result = await WebBrowser.openAuthSessionAsync(
        paymentUrl,
        "hostello://payment/return",
      );

      // Mark handled so the Linking listener doesn't fire a duplicate
      returnHandled.current = true;

      if (result.type === "success") {
        const { status } = parseReturnUrl(result.url);
        setPaymentState(status === "paid" ? "paid" : status === "cancelled" ? "cancelled" : "failed");
      } else {
        // result.type === "dismiss": user manually closed the browser
        setPaymentState("cancelled");
      }
    } catch (err: unknown) {
      setPaymentError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [id, selectedRoom, checkIn, checkOut, guests, paymentMethod, validate]);

  function handleCheckInChange(date: Date) {
    setCheckIn(date);
    if (checkOut <= date) setCheckOut(addMonths(date, 1));
  }

  /* -- Payment result overlay --------------------------- */
  if (paymentState !== "idle") {
    return (
      <PaymentResult
        state={paymentState}
        hostelName={hostel?.name ?? "the hostel"}
        onRetry={() => {
          setPaymentState("idle");
          setPaymentError(null);
          returnHandled.current = false;
        }}
        onDone={() => router.replace("/(app)/(tabs)/bookings")}
      />
    );
  }

  /* -- Loading / error states --------------------------- */
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading hostel details…</Text>
      </View>
    );
  }

  if (error || !hostel) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Couldn't load hostel</Text>
        <Text style={styles.errorBody}>{error ?? "Unknown error"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* -- Step 1: Details ---------------------------------- */
  if (step === "details") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Book a stay", headerBackTitle: "Back" }} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          <View style={styles.hostelCard}>
            <Text style={styles.hostelName}>{hostel.name}</Text>
            <Text style={styles.hostelCity}>{hostel.city}{hostel.area ? `, ${hostel.area}` : ""}</Text>
          </View>

          <View style={styles.divider} />

          {rooms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Room type</Text>
              {rooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={[styles.roomOption, selectedRoom?.id === room.id && styles.roomOptionSelected]}
                  onPress={() => setSelectedRoom(room)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedRoom?.id === room.id }}
                  accessibilityLabel={`${room.name}, ${formatPKR(room.pricePerMonth)} per month, ${room.available} spots available`}
                >
                  <View style={styles.roomOptionLeft}>
                    <Text style={[styles.roomName, selectedRoom?.id === room.id && styles.roomNameSelected]}>{room.name}</Text>
                    <Text style={styles.roomMeta}>{room.available} spot{room.available !== 1 ? "s" : ""} left</Text>
                  </View>
                  <Text style={[styles.roomPrice, selectedRoom?.id === room.id && styles.roomPriceSelected]}>
                    {formatPKR(room.pricePerMonth)}/mo
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stay dates</Text>
            {/* Semester quick-pick */}
            <View style={styles.semesterRow}>
              {[4, 5, 6].map((n) => {
                const active = monthsBetween(checkIn, checkOut) === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.semesterChip, active && styles.semesterChipActive]}
                    onPress={() => {
                      const newOut = addMonths(checkIn, n);
                      setCheckOut(newOut);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} month semester`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.semesterChipText, active && styles.semesterChipTextActive]}>
                      {n} mo
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.semesterHint}>Quick pick</Text>
            </View>
            <DateRow label="Check-in"  date={checkIn}  minDate={today}              onChange={handleCheckInChange} />
            <DateRow label="Check-out" date={checkOut} minDate={addMonths(checkIn, 1)} onChange={setCheckOut} />
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{months} month{months !== 1 ? "s" : ""}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guests</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={[styles.stepperBtn, guests <= 1 && styles.stepperBtnDisabled]}
                onPress={() => setGuests((g) => Math.max(1, g - 1))} disabled={guests <= 1} accessibilityLabel="Remove guest" accessibilityRole="button">
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue} accessibilityLabel={`${guests} guest${guests !== 1 ? "s" : ""}`}>{guests}</Text>
              <TouchableOpacity style={[styles.stepperBtn, guests >= 4 && styles.stepperBtnDisabled]}
                onPress={() => setGuests((g) => Math.min(4, g + 1))} disabled={guests >= 4} accessibilityLabel="Add guest" accessibilityRole="button">
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment method</Text>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm.id}
                style={[styles.paymentOption, paymentMethod === pm.id && styles.paymentOptionSelected, !pm.enabled && styles.paymentOptionDisabled]}
                onPress={() => {
                  if (pm.enabled) setPaymentMethod(pm.id);
                  else Alert.alert("Coming Soon", "JazzCash and EasyPaisa will be available soon.", [{ text: "OK" }]);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: paymentMethod === pm.id, disabled: !pm.enabled }}
              >
                <View style={[styles.radio, paymentMethod === pm.id && styles.radioSelected]}>
                  {paymentMethod === pm.id && <View style={styles.radioDot} />}
                </View>
                <View>
                  <Text style={styles.paymentLabel}>{pm.label}</Text>
                  <Text style={styles.paymentDesc}>{pm.desc}</Text>
                  {!pm.enabled && <Text style={styles.paymentComingSoon}>Coming soon</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPriceLabel}>{formatPKR(pricePerMonth)} × {months} mo</Text>
            <Text style={styles.footerTotal}>{formatPKR(total)}</Text>
          </View>
          <TouchableOpacity style={styles.ctaButton}
            onPress={() => { const err = validate(); if (err) { Alert.alert("Check your booking", err); return; } setStep("confirm"); }}
            accessibilityRole="button" accessibilityLabel="Review booking">
            <Text style={styles.ctaText}>Review booking →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* -- Step 2: Confirm ---------------------------------- */
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Confirm booking", headerBackTitle: "Edit" }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.confirmHeading}>Review your booking</Text>

        {[
          { label: "Hostel",   value: hostel.name },
          { label: "Room",     value: selectedRoom?.name ?? "Any available" },
          { label: "Check-in", value: formatDate(checkIn) },
          { label: "Check-out",value: formatDate(checkOut) },
          { label: "Duration", value: `${months} month${months !== 1 ? "s" : ""}` },
          { label: "Guests",   value: `${guests}` },
          { label: "Payment",  value: PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label ?? paymentMethod },
        ].map(({ label, value }) => (
          <View key={label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPKR(total)}</Text>
        </View>

        <Text style={styles.disclaimer}>
          By confirming you agree to the hostel's house rules. Payment will be collected via{" "}
          {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.label}.
        </Text>

        {paymentError !== null && (
          <View style={styles.paymentErrorBox}>
            <Text style={styles.paymentErrorText}>{paymentError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep("details")} accessibilityRole="button">
          <Text style={styles.backButtonText}>← Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctaButton, styles.ctaButtonFlex, submitting && styles.ctaButtonDisabled]}
          onPress={handleSubmit} disabled={submitting}
          accessibilityRole="button" accessibilityLabel="Confirm and pay" accessibilityState={{ disabled: submitting }}>
          {submitting
            ? <ActivityIndicator color={colors.textInverse} size="small" />
            : <Text style={styles.ctaText}>Confirm & pay</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* -- Styles ----------------------------------------------- */
const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: colors.bgPage },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  centered:      { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bgPage },

  loadingText:  { marginTop: 12, color: colors.textMuted, fontSize: 14 },
  errorIcon:    { fontSize: 36, marginBottom: 12 },
  errorTitle:   { fontSize: 18, fontWeight: "600", color: colors.textHeading, marginBottom: 6 },
  errorBody:    { fontSize: 13, color: colors.textMuted, textAlign: "center", marginBottom: 20 },
  retryButton:  { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:    { color: colors.textInverse, fontWeight: "600", fontSize: 14 },

  resultContainer:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.bgPage },
  resultIcon:        { fontSize: 56, marginBottom: 20 },
  resultTitle:       { fontSize: 24, fontWeight: "700", color: colors.textHeading, marginBottom: 12, textAlign: "center" },
  resultBody:        { fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  secondaryButton:   { marginTop: 12, paddingVertical: 14, paddingHorizontal: 20 },
  secondaryButtonText: { fontSize: 15, color: colors.primaryDark, fontWeight: "600", textAlign: "center" },

  hostelCard: { padding: 16, backgroundColor: colors.bgCard },
  hostelName: { fontSize: 18, fontWeight: "700", color: colors.textHeading, marginBottom: 2 },
  hostelCity: { fontSize: 13, color: colors.textMuted },
  divider:    { height: 1, backgroundColor: colors.borderDefault },

  section:      { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 },

  roomOption:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderDefault, backgroundColor: colors.bgCard, marginBottom: 8 },
  roomOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryFaint },
  roomOptionLeft:     { flex: 1 },
  roomName:           { fontSize: 14, fontWeight: "500", color: colors.textHeading },
  roomNameSelected:   { color: colors.primaryDark, fontWeight: "600" },
  roomMeta:           { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  roomPrice:          { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  roomPriceSelected:  { color: colors.primaryDark },

  dateRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  dateLabel:      { fontSize: 14, color: colors.textHeading, fontWeight: "500" },
  dateButton:     { flexDirection: "row", alignItems: "center", gap: 4 },
  dateButtonText: { fontSize: 14, color: colors.primaryDark, fontWeight: "600" },
  dateChevron:    { fontSize: 18, color: colors.primaryDark },
  durationBadge:  { alignSelf: "flex-start", backgroundColor: colors.primaryFaint, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  durationText:   { fontSize: 13, fontWeight: "600", color: colors.primaryDark },

  stepper:            { flexDirection: "row", alignItems: "center", gap: 20 },
  stepperBtn:         { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgCard },
  stepperBtnDisabled: { opacity: 0.35 },
  stepperBtnText:     { fontSize: 20, color: colors.textHeading, lineHeight: 24 },
  stepperValue:       { fontSize: 20, fontWeight: "600", color: colors.textHeading, minWidth: 28, textAlign: "center" },

  paymentOption:         { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderDefault, backgroundColor: colors.bgCard, marginBottom: 8 },
  paymentOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryFaint },
  paymentOptionDisabled: { opacity: 0.4 },
  radio:                 { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderDefault, alignItems: "center", justifyContent: "center" },
  radioSelected:         { borderColor: colors.primary },
  radioDot:              { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  paymentLabel:          { fontSize: 14, fontWeight: "600", color: colors.textHeading },
  paymentDesc:           { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  paymentComingSoon:     { fontSize: 11, color: colors.textMuted, fontStyle: "italic", marginTop: 3 },

  paymentErrorBox:  { marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.errorBg, borderRadius: 10, padding: 14 },
  paymentErrorText: { fontSize: 13, color: colors.errorText, lineHeight: 18 },

  footer:          { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderTopWidth: 1, borderColor: colors.borderDefault, backgroundColor: colors.bgCard },
  footerPriceRow:  { flex: 1 },
  footerPriceLabel:{ fontSize: 12, color: colors.textMuted },
  footerTotal:     { fontSize: 18, fontWeight: "700", color: colors.textHeading },
  ctaButton:       { backgroundColor: colors.action, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  ctaButtonFlex:   { flex: 1 },
  ctaButtonDisabled:{ opacity: 0.6 },
  ctaText:         { color: colors.textInverse, fontWeight: "700", fontSize: 15 },
  backButton:      { paddingHorizontal: 12, paddingVertical: 14 },
  backButtonText:  { fontSize: 15, color: colors.primaryDark, fontWeight: "600" },

  confirmHeading: { fontSize: 22, fontWeight: "700", color: colors.textHeading, padding: 16, paddingBottom: 8 },
  summaryRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.borderDefault },
  summaryLabel:   { fontSize: 14, color: colors.textMuted },
  summaryValue:   { fontSize: 14, fontWeight: "500", color: colors.textHeading, maxWidth: "55%", textAlign: "right" },
  totalRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  totalLabel:     { fontSize: 16, fontWeight: "600", color: colors.textHeading },
  totalAmount:    { fontSize: 22, fontWeight: "700", color: colors.primaryDark },
  disclaimer:     { fontSize: 12, color: colors.textMuted, paddingHorizontal: 16, paddingBottom: 16, lineHeight: 18 },

  semesterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  semesterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgCard,
  },
  semesterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  semesterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  semesterChipTextActive: {
    color: colors.primaryDark,
  },
  semesterHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 4,
  },
});
