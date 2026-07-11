/**
 * Font loading — issue #10.
 *
 * Loads the Plus Jakarta Sans weights used by the type scale. The registered
 * family name equals each key string (e.g. `PlusJakartaSans_400Regular`), which
 * is exactly what `fontFamily` in the typography tokens references.
 */
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';

export function useAppFonts(): { fontsLoaded: boolean; fontError: Error | null } {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  return { fontsLoaded, fontError };
}
