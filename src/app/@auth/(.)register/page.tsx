import { Suspense } from "react";
import { AuthModal } from "@/components/auth/AuthModal";
import { RegisterForm } from "@/components/auth/RegisterForm";
import RegisterLayout from "@/app/register/layout";

export default function InterceptedRegisterPage() {
  return (
    <RegisterLayout>
      <AuthModal heading="Create account">
        <Suspense>
          <RegisterForm presentation="modal" />
        </Suspense>
      </AuthModal>
    </RegisterLayout>
  );
}
