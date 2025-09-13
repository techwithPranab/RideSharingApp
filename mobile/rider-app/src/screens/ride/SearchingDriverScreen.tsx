/**
 * Searching Driver Screen Placeholder
 */

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '../../hooks/navigation';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/config';

const SearchingDriverScreen: React.FC = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔍 Searching Driver</Text>
        <Text style={styles.description}>Finding the best driver for you...</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancel Search</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  description: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  button: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  buttonText: { fontSize: FONT_SIZES.md, color: COLORS.white, fontWeight: '600' },
});

export default SearchingDriverScreen;
