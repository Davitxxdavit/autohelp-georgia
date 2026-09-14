import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Unused future SMS OTP screen. Not part of login/register navigation.
 * Current auth is phone + password JWT. This route only redirects to login.
 */
export default function VerifyOtpScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(auth)/login');
  }, [router]);
  return <View />;
}
