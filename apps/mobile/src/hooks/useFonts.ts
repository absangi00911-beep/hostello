import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { useFonts as useExpoFonts } from 'expo-font';

/**
 * Loads all custom typefaces required by the HostelLo design system:
 *   - Bricolage Grotesque  (headings / screen titles)
 *   - DM Sans              (body copy, labels, form elements)
 *   - JetBrains Mono       (booking reference IDs, OTP display)
 *
 * Returns `true` once every font is ready to render.
 * The root layout holds the splash screen visible until this returns `true`.
 */
export function useFonts(): boolean {
  const [loaded] = useExpoFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
  });

  return loaded;
}
