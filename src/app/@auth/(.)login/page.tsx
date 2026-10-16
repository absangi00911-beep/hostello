import { Suspense } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { LoginForm } from "@/components/auth/LoginForm";

export default function InterceptedLoginPage() {
  return (
    <AuthModal heading="Log in">
      <Suspense>
        <LoginForm presentation="modal" />
      </Suspense>
    </AuthModal>
  );
}
