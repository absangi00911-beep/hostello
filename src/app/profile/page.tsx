// Path: src/app/profile/page.tsx
import { redirect } from "next/navigation";

export default function ProfilePage() {
  redirect("/profile/settings");
}