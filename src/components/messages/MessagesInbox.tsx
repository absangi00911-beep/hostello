"use client";

import Link from "next/link";
import { ConversationList } from "@/components/messages/ConversationList";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { useMessagesInbox } from "@/components/messages/useMessagesInbox";

interface MessagesInboxProps {
  currentUserId: string;
}

export function MessagesInbox({ currentUserId }: MessagesInboxProps) {
  const inbox = useMessagesInbox();

  return (
    <main className="messages-page">
      <header className="messages-header">
        <Link className="messages-brand" href="/" aria-label="hostello home">
          <span>hostello</span>
        </Link>
        <div className="messages-header-actions">
          <Link href="/">Explore hostels</Link>
          <button
            className="messages-refresh"
            onClick={() => void inbox.loadConversationList(1)}
            type="button"
          >
            Refresh inbox
          </button>
        </div>
      </header>

      <div className="messages-shell">
        <div className="messages-title-row">
          <div>
            <p className="messages-eyebrow">Your conversations</p>
            <h1>Messages</h1>
          </div>
          <p className="messages-title-note">
            Keep hostel conversations in one place.
          </p>
        </div>

        {inbox.hasPendingInquiry && (
          <section className="messages-pending" aria-live="polite">
            {!inbox.pendingError ? (
              <p role="status">Sending your saved inquiry…</p>
            ) : (
              <>
                <p role="alert">{inbox.pendingError}</p>
                <div className="messages-pending-actions">
                  <button onClick={inbox.retryPendingInquiry} type="button">
                    Retry delivery
                  </button>
                  <button
                    className="messages-secondary-button"
                    onClick={inbox.cancelPendingInquiry}
                    type="button"
                  >
                    Discard saved inquiry
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        <div className="messages-layout">
          <ConversationList
            conversations={inbox.conversations}
            currentUserId={currentUserId}
            error={inbox.listError}
            loading={inbox.listLoading}
            onLoadMore={inbox.loadMoreConversations}
            onRetry={() => void inbox.loadConversationList(1)}
            onSelect={inbox.selectConversation}
            page={inbox.conversationPage}
            paging={inbox.listPaging}
            selectedConversationId={inbox.selectedConversationId}
          />
          <ConversationThread
            conversationId={inbox.selectedConversationId}
            currentUserId={currentUserId}
            error={inbox.threadError}
            loading={inbox.threadLoading}
            message={inbox.message}
            messages={inbox.visibleMessages}
            onLoadOlder={() => void inbox.loadOlderMessages()}
            onMessageChange={inbox.setMessage}
            onRefresh={() => {
              if (inbox.selectedConversationId) {
                void inbox.refreshThread(inbox.selectedConversationId, true);
              }
            }}
            onRetry={() => {
              if (inbox.selectedConversationId) {
                void inbox.refreshThread(inbox.selectedConversationId, true);
              }
            }}
            onSend={(event) => void inbox.sendMessage(event)}
            pendingInquiry={inbox.hasPendingInquiry}
            refreshing={inbox.threadRefreshing}
            sendError={inbox.sendError}
            sending={inbox.sending}
            thread={inbox.selectedThread}
          />
        </div>
      </div>
    </main>
  );
}
