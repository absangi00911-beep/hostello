import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiRequest } from '../../../../src/services/api';

export default function BookingScreen() {
  const { id } = useLocalSearchParams();

  const handleBook = async () => {
    try {
      await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify({ hostelId: id, checkIn: new Date(), checkOut: new Date(), guests: 1, paymentMethod: 'safepay' }),
      });
      router.replace('/(app)/');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Booking</Text>
      <Button title="Pay Now" onPress={handleBook} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20 },
});
