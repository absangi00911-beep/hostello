import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, TextInput } from 'react-native';
import { apiRequest } from '../../../src/services/api';
import { router } from 'expo-router';

export default function HostelListScreen() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');

  const fetchHostels = async (filterCity = '') => {
    setLoading(true);
    try {
      const query = filterCity ? `?city=${filterCity}` : '';
      const response: any = await apiRequest(`/hostels${query}`);
      setHostels(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search by city..."
        value={city}
        onChangeText={setCity}
        onSubmitEditing={() => fetchHostels(city)}
      />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={hostels}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => router.push({ pathname: '/(app)/hostel/[slug]', params: { slug: item.slug } })}
            >
              {item.coverImage && <Image source={{ uri: item.coverImage }} style={styles.image} />}
              <Text style={styles.name}>{item.name}</Text>
              <Text>{item.city} • Rs. {item.pricePerMonth}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  loader: { flex: 1, justifyContent: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff' },
  card: { padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8 },
  image: { width: '100%', height: 150, borderRadius: 5, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: 'bold' },
});
