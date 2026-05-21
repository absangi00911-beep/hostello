import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, radius, spacing } from '../../../src/theme';
import { apiRequest } from '../../../src/services/api';

export default function HostelListScreen() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');

  const fetchHostels = async (filterCity = '') => {
    setLoading(true);
    try {
      const query = filterCity ? `?city=${filterCity}` : '';
      const data = await apiRequest<any[]>(`/hostels${query}`);
      setHostels(data);
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
              onPress={() =>
                router.push({
                  pathname: '/(app)/hostel/[slug]',
                  params: { slug: item.slug },
                })
              }
            >
              {item.coverImage && (
                <Image source={{ uri: item.coverImage }} style={styles.image} />
              )}
              <Text style={styles.name}>{item.name}</Text>
              <Text>
                {item.city} • Rs. {item.pricePerMonth}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.sm, backgroundColor: colors.bgPage },
  loader: { flex: 1, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderColor: colors.borderDefault,
    color: colors.textBody,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  image: { width: '100%', height: 150, borderRadius: radius.sm, marginBottom: spacing.sm },
  name: { fontSize: fontSize.h3, fontWeight: fontWeight.bold, color: colors.textHeading },
});