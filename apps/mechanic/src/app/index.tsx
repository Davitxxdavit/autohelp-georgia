import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';

import { getAccessToken } from '@/lib/api/tokens';
import { colors } from '@/theme/colors';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getAccessToken().then((token) => {
      if (!mounted) return;
      setSignedIn(Boolean(token));
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
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

  if (!signedIn) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  return <Redirect href={'/(app)/(tabs)' as Href} />;
}
