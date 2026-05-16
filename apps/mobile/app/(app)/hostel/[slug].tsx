import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Button, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiRequest } from '../../../src/services/api';

export default function HostelDetailScreen() {
  const { slug } = useLocalSearchParams();
  const [hostel, setHostel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/hostels/${slug}`).then((res: any) => {
      setHostel(res.data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" />;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: hostel.coverImage }} style={styles.image} />
      <Text style={styles.name}>{hostel.name}</Text>
      <Text style={styles.price}>Rs. {hostel.pricePerMonth} / month</Text>
      <Text>{hostel.description}</Text>
      <Button 
        title="Book Now" 
        onPress={() => router.push({ pathname: '/(app)/booking/[id]', params: { id: hostel.id } })} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  loader: { flex: 1, justifyContent: 'center' },
  image: { width: '100%', height: 250 },
  name: { fontSize: 24, fontWeight: 'bold' },
  price: { fontSize: 18, color: 'green', marginVertical: 10 },
});
