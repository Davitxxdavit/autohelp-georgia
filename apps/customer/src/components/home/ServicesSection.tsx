import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { SERVICES } from '@/constants/services';
import { spacing } from '@/theme/spacing';

import { ServiceCard } from './ServiceCard';

export function ServicesSection() {
  return (
    <View style={styles.root}>
      <AppText variant="h3">რა დაგჭირდათ?</AppText>
      <View style={styles.grid}>
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
