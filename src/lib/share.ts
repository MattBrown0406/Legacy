import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

export type ShareResult = 'shared' | 'copied' | 'dismissed';

/**
 * Open the native share sheet with text (and an optional URL). On web, uses the
 * Web Share API when available, otherwise copies to the clipboard.
 */
export async function shareContent(opts: {
  message: string;
  url?: string;
  title?: string;
}): Promise<ShareResult> {
  const { message, url, title } = opts;
  const combined = url ? `${message}\n${url}` : message;

  if (Platform.OS === 'web') {
    const nav = globalThis.navigator as Navigator & {
      share?: (data: { text?: string; url?: string; title?: string }) => Promise<void>;
    };
    if (nav?.share) {
      try {
        await nav.share({ text: message, url, title });
        return 'shared';
      } catch {
        return 'dismissed';
      }
    }
    await Clipboard.setStringAsync(combined);
    return 'copied';
  }

  const result = await Share.share(url ? { message: combined, title } : { message, title });
  return result.action === Share.dismissedAction ? 'dismissed' : 'shared';
}
