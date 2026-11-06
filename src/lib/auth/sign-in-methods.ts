export interface ConfiguredSignInMethods {
  emailPassword: true;
  emailCode: boolean;
  google: boolean;
}

type SignInMethodEnvironment = NodeJS.ProcessEnv;

export function getConfiguredSignInMethods(
  environment: SignInMethodEnvironment = process.env,
): ConfiguredSignInMethods {
  const resendKey = environment.RESEND_API_KEY?.trim();
  const googleId = environment.AUTH_GOOGLE_ID?.trim();
  const googleSecret = environment.AUTH_GOOGLE_SECRET?.trim();

  return {
    emailPassword: true,
    emailCode:
      Boolean(resendKey?.startsWith("re_")) && resendKey !== "re_placeholder",
    google: Boolean(googleId && googleSecret),
  };
}
