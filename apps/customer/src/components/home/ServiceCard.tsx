import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Surface } from '@/components/ui/Surface';
import { SERVICE_ICON_KIND } from '@/constants/serviceIcons';
import type { ServiceCatalogItem } from '@/constants/services';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type ServiceCardProps = {
  service: ServiceCatalogItem;
};

export function ServiceCard({ service }: ServiceCardProps) {
  const { width } = useWindowDimensions();
  const horizontalPad = spacing.xl * 2;
  const gap = spacing.sm;
  const cardWidth = (width - horizontalPad - gap) / 2;

  return (
    <AnimatedPressable
      accessibilityLabel={`${service.title}. ${service.description}`}
      accessibilityRole="button"
      onPress={() => {
        router.push({
          pathname: '/request/[service]',
          params: { service: service.id },
        });
      }}
      style={{ width: cardWidth }}
    >
      <Surface elevated radiusToken="lg" style={styles.card}>
        <View style={styles.iconRow}>
          <ServiceIcon kind={SERVICE_ICON_KIND[service.id]} size={26} />
          <AppText variant="caption" style={styles.emoji} accessibilityElementsHidden>
            {service.emoji}
          </AppText>
        </View>
        <AppText variant="bodyMedium" numberOfLines={2}>
          {service.title}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={2}>
          {service.description}
        </AppText>
      </Surface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 148,
    backgroundColor: colors.surfaceElevated,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  emoji: {
    fontSize: 16,
    lineHeight: 20,
  },
});
