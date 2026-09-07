import { Alert, Linking } from 'react-native';

export async function openPhoneCall(phone: string | null | undefined): Promise<void> {
  const trimmed = phone?.trim();
  if (!trimmed) return;
  try {
    await Linking.openURL(`tel:${trimmed}`);
  } catch {
    Alert.alert('Unable to call', 'Could not open the phone app.');
  }
}
