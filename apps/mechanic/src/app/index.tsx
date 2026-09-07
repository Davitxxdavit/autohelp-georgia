import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';

import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { getAccessToken } from '@/lib/api/tokens';
import { colors } from '@/theme/colors';

export default function Index() {
  const { hydrated, isApproved } = useMechanicSession();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    void getAccessToken().then((token) => {
      if (!mounted) return;
      setHasToken(Boolean(token));
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!hydrated || hasToken === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!hasToken) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (!isApproved) {
    return <Redirect href={'/pending' as Href} />;
  }

  return <Redirect href={'/(app)/(tabs)' as Href} />;
}
