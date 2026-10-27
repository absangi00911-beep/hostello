import ProductHome from "@/components/home/ProductHome";
import LoginDialog from "@/components/auth/LoginDialog";
import { auth } from "@/lib/auth/config";
import { getSafeLoginCallbackUrl } from "@/lib/auth/safe-login-callback";

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

  return (
    <>
      <ProductHome accountUser={accountUser} />
      <LoginDialog
        callbackUrl={getSafeLoginCallbackUrl(callbackUrl)}
        error={error}
        googleEnabled={Boolean(
          process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
        )}
        verified={verified === "1"}
      />
    </>
  );
}
