import { notFound, redirect } from "next/navigation";
import { MessagesInbox } from "@/components/messages/MessagesInbox";
import { auth } from "@/lib/auth/config";
import { getSafeLoginCallbackUrl } from "@/lib/auth/safe-login-callback";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    conversationId?: string | string[];
    pendingInquiry?: string | string[];
  }>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  if (!session) {
    const callbackPath =
      params.pendingInquiry === "1"
        ? "/messages?pendingInquiry=1"
        : typeof params.conversationId === "string"
          ? getSafeLoginCallbackUrl(
              `/messages?conversationId=${encodeURIComponent(params.conversationId)}`,
            )
          : "/messages";
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "OWNER") {
    notFound();
  }

  return <MessagesInbox currentUserId={session.user.id} />;
}
