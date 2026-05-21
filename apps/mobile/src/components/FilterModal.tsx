import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

export interface FilterValues {
  city: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED' | '';
  minPrice: string;
  maxPrice: string;
}

const EMPTY_FILTERS: FilterValues = {
  city: '',
  gender: '',
  minPrice: '',
  maxPrice: '',
};

const GENDER_OPTIONS: { label: string; value: FilterValues['gender'] }[] = [
  { label: 'Any', value: '' },
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Mixed', value: 'MIXED' },
];

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply }) => {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
  }

  return (
    <BottomSheet
      index={isOpen ? 0 : -1}
      snapPoints={['55%', '85%']}
      enablePanDownToClose
      onClose={onClose}
    >
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={handleReset} accessibilityRole="button" accessibilityLabel="Reset filters">
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* City */}
        <View style={styles.section}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lahore"
            placeholderTextColor={colors.textPlaceholder}
            value={filters.city}
            onChangeText={(v) => setFilters((f) => ({ ...f, city: v }))}
            autoCapitalize="words"
          />
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, filters.gender === opt.value && styles.chipSelected]}
                onPress={() => setFilters((f) => ({ ...f, gender: opt.value }))}
                accessibilityRole="radio"
                accessibilityState={{ checked: filters.gender === opt.value }}
                accessibilityLabel={opt.label}
              >
                <Text style={[styles.chipText, filters.gender === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price range */}
        <View style={styles.section}>
          <Text style={styles.label}>Price per month (Rs.)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="Min"
              placeholderTextColor={colors.textPlaceholder}
              value={filters.minPrice}
              onChangeText={(v) => setFilters((f) => ({ ...f, minPrice: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              accessibilityLabel="Minimum price"
            />
            <Text style={styles.priceSeparator}>–</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              placeholder="Max"
              placeholderTextColor={colors.textPlaceholder}
              value={filters.maxPrice}
              onChangeText={(v) => setFilters((f) => ({ ...f, maxPrice: v.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
              accessibilityLabel="Maximum price"
            />
          </View>
        </View>

        {/* Apply */}
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          accessibilityRole="button"
          accessibilityLabel="Apply filters"
        >
          <Text style={styles.applyText}>Apply filters</Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxxxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    color: colors.textHeading,
  },
  resetText: {
    fontSize: fontSize.body,
    color: colors.primaryDeep,
    fontWeight: fontWeight.semiBold,
  },

  section: { marginBottom: spacing.xl },
  label: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.textBody,
    backgroundColor: colors.bgCard,
  },

  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgCard,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  chipText: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: colors.primaryDeep,
    fontWeight: fontWeight.semiBold,
  },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: { flex: 1 },
  priceSeparator: { fontSize: fontSize.body, color: colors.textMuted },

  applyButton: {
    backgroundColor: colors.action,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  applyText: {
    color: colors.textInverse,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
});