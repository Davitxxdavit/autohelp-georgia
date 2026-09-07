import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Product OTP UI is kept for later SMS auth.
 * This build signs in with phone + password on the login screen (JWT foundation).
 */
export default function VerifyOtpScreen() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(auth)/login');
  }, [router]);
  return <View />;
}
