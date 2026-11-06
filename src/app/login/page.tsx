import ProductHome from "@/components/home/ProductHome";
import LoginDialog from "@/components/auth/LoginDialog";
import { auth } from "@/lib/auth/config";
import { getSafeLoginCallbackUrl } from "@/lib/auth/safe-login-callback";
import { getConfiguredSignInMethods } from "@/lib/auth/sign-in-methods";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string | string[];
    error?: string;
    verified?: string;
  }>;
}) {
  const { callbackUrl, error, verified } = await searchParams;
  const session = await auth();
  const accountUser = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;
  const signInMethods = getConfiguredSignInMethods();

  return (
    <>
      <ProductHome accountUser={accountUser} />
      <LoginDialog
        callbackUrl={getSafeLoginCallbackUrl(callbackUrl)}
        emailCodeEnabled={signInMethods.emailCode}
        error={error}
        googleEnabled={signInMethods.google}
        verified={verified === "1"}
      />
    </>
  );
}
