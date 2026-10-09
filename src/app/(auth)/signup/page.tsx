import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  redirect(role === "OWNER" ? "/register?role=OWNER" : "/register");
}
