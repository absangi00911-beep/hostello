import ProductHome from "@/components/home/ProductHome";
import LoginDialog from "@/components/auth/LoginDialog";
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

  return (
    <>
      <ProductHome />
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
