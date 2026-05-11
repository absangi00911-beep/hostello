import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%', '80%'], []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={(index) => {
        if (index === -1) onClose();
      }}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Filters</Text>
        <Button title="Apply Filters" onPress={() => onApply({})} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
