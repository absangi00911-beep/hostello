"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessagesSendRefreshError,
  PENDING_INQUIRY_STORAGE_KEY,
  deliverPendingInquiry,
  fetchConversation,
  fetchConversationList,
  sendMessageAndRefresh,
} from "@/lib/messages-inbox";
import type {
  ConversationListPage,
  ConversationPreview,
  ConversationThread,
} from "@/lib/messages-inbox";
import {
  applyThreadPageResponse,
  getSelectedThread,
  isCurrentThreadRequest,
} from "./thread-state";
import type { ThreadRequestContext } from "./thread-state";

export function useMessagesInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get("conversationId");
  const hasPendingInquiry = searchParams.get("pendingInquiry") === "1";
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [conversationPage, setConversationPage] =
    useState<ConversationListPage | null>(null);
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [listPaging, setListPaging] = useState(false);
  const [threadPages, setThreadPages] = useState<Record<number, ConversationThread>>({});
  const [threadError, setThreadError] = useState("");
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadRefreshing, setThreadRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [pendingError, setPendingError] = useState("");
  const [pendingAttempt, setPendingAttempt] = useState(0);
  const pendingDeliveryInProgress = useRef(false);
  const selectedThreadRequest = useRef(0);
  const selectedConversationIdRef = useRef(selectedConversationId);
  useLayoutEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const isCurrentRequest = useCallback(
    (request: ThreadRequestContext) =>
      isCurrentThreadRequest(
        request,
        selectedConversationIdRef.current,
        selectedThreadRequest.current,
      ),
    [],
  );

  const loadConversationList = useCallback(
    async (page: number, append = false) => {
      if (append) setListPaging(true);
      else setListLoading(true);
      setListError("");
      try {
        const result = await fetchConversationList(page);
        setConversations((current) =>
          append ? [...current, ...result.data] : result.data,
        );
        setConversationPage(result);
      } catch (error) {
        setListError(
          error instanceof Error ? error.message : "Couldn't load your conversations.",
        );
      } finally {
        setListLoading(false);
        setListPaging(false);
      }
    },
    [],
  );

  const refreshThread = useCallback(
    async (conversationId: string, showRefreshing = false) => {
      const request = {
        conversationId,
        requestId: selectedThreadRequest.current,
      };
      if (!isCurrentRequest(request)) return;
      if (showRefreshing) setThreadRefreshing(true);
      else setThreadLoading(true);
      setThreadError("");
      try {
        const latestPage = await fetchConversation(conversationId, 1);
        if (!isCurrentRequest(request)) return;
        setThreadPages((current) =>
          applyThreadPageResponse(
            current,
            request,
            selectedConversationIdRef.current,
            selectedThreadRequest.current,
            latestPage,
            "replace",
          ),
        );
        setThreadError("");
        await loadConversationList(1);
      } catch (error) {
        if (!isCurrentRequest(request)) return;
        setThreadError(
          error instanceof Error ? error.message : "Couldn't refresh this conversation.",
        );
      } finally {
        if (isCurrentRequest(request)) {
          setThreadLoading(false);
          setThreadRefreshing(false);
        }
      }
    },
    [isCurrentRequest, loadConversationList],
  );

  useEffect(() => {
    void loadConversationList(1);
  }, [loadConversationList]);

  useEffect(() => {
    if (!hasPendingInquiry || pendingDeliveryInProgress.current) return;
    pendingDeliveryInProgress.current = true;
    setPendingError("");
    void deliverPendingInquiry(window.sessionStorage)
      .then(({ conversationId }) => {
        router.replace(
          `/messages?conversationId=${encodeURIComponent(conversationId)}`,
        );
      })
      .catch((error: unknown) => {
        setPendingError(
          error instanceof Error
            ? error.message
            : "Couldn't send your saved inquiry. Retry or discard it.",
        );
        pendingDeliveryInProgress.current = false;
      });
  }, [hasPendingInquiry, pendingAttempt, router]);

  useEffect(() => {
    const requestId = ++selectedThreadRequest.current;
    if (!selectedConversationId || hasPendingInquiry) {
      setThreadPages({});
      setThreadError("");
      setMessage("");
      setSendError("");
      setSending(false);
      setThreadRefreshing(false);
      return;
    }
    setThreadPages({});
    setThreadError("");
    setMessage("");
    setSendError("");
    setSending(false);
    setThreadRefreshing(false);
    setThreadLoading(true);
    const request = { conversationId: selectedConversationId, requestId };
    void fetchConversation(selectedConversationId, 1)
      .then((thread) => {
        if (!isCurrentRequest(request)) return;
        setThreadPages((current) =>
          applyThreadPageResponse(
            current,
            request,
            selectedConversationIdRef.current,
            selectedThreadRequest.current,
            thread,
            "replace",
          ),
        );
        return loadConversationList(1);
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest(request)) return;
        setThreadError(
          error instanceof Error ? error.message : "Couldn't load this conversation.",
        );
      })
      .finally(() => {
        if (isCurrentRequest(request)) setThreadLoading(false);
      });
    return () => {
      if (selectedThreadRequest.current === requestId) {
        selectedThreadRequest.current += 1;
      }
    };
  }, [
    hasPendingInquiry,
    isCurrentRequest,
    loadConversationList,
    selectedConversationId,
  ]);

  const visibleMessages = useMemo(
    () =>
      Object.keys(threadPages)
        .map(Number)
        .sort((left, right) => right - left)
        .filter((page) => threadPages[page].id === selectedConversationId)
        .flatMap((page) => threadPages[page].messages),
    [selectedConversationId, threadPages],
  );
  const selectedThread = getSelectedThread(threadPages, selectedConversationId);
  const oldestLoadedPage = selectedThread
    ? Math.max(0, ...Object.keys(threadPages).map(Number))
    : 0;

  const selectConversation = (conversationId: string) => {
    router.push(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
  };

  const loadMoreConversations = () => {
    if (conversationPage?.hasMore) {
      void loadConversationList(conversationPage.page + 1, true);
    }
  };

  const loadOlderMessages = async () => {
    if (
      !selectedConversationId ||
      selectedThread?.id !== selectedConversationId ||
      !selectedThread.messageHasMore
    ) {
      return;
    }
    const request = {
      conversationId: selectedConversationId,
      requestId: selectedThreadRequest.current,
    };
    setThreadError("");
    setThreadRefreshing(true);
    try {
      const olderPage = await fetchConversation(
        selectedConversationId,
        oldestLoadedPage + 1,
      );
      if (!isCurrentRequest(request)) return;
      setThreadPages((current) =>
        applyThreadPageResponse(
          current,
          request,
          selectedConversationIdRef.current,
          selectedThreadRequest.current,
          olderPage,
          "append",
        ),
      );
    } catch (error) {
      if (!isCurrentRequest(request)) return;
      setThreadError(
        error instanceof Error ? error.message : "Couldn't load older messages.",
      );
    } finally {
      if (isCurrentRequest(request)) setThreadRefreshing(false);
    }
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !selectedConversationId ||
      selectedThread?.id !== selectedConversationId ||
      !message.trim()
    ) {
      return;
    }
    const conversationId = selectedConversationId;
    const content = message.trim();
    const request = {
      conversationId,
      requestId: selectedThreadRequest.current,
    };
    setSending(true);
    setSendError("");
    try {
      const refreshedThread = await sendMessageAndRefresh(
        conversationId,
        content,
      );
      if (!isCurrentRequest(request)) return;
      setThreadPages((current) =>
        applyThreadPageResponse(
          current,
          request,
          selectedConversationIdRef.current,
          selectedThreadRequest.current,
          refreshedThread,
          "replace",
        ),
      );
      setMessage("");
      setThreadError("");
      await loadConversationList(1);
    } catch (error) {
      if (!isCurrentRequest(request)) return;
      if (error instanceof MessagesSendRefreshError) {
        setMessage("");
        setThreadError(error.message);
        void loadConversationList(1);
      } else {
        setSendError(
          error instanceof Error ? error.message : "Couldn't send your message.",
        );
      }
    } finally {
      if (isCurrentRequest(request)) setSending(false);
    }
  };

  const retryPendingInquiry = () => {
    setPendingAttempt((attempt) => attempt + 1);
  };

  const cancelPendingInquiry = () => {
    try {
      window.sessionStorage.removeItem(PENDING_INQUIRY_STORAGE_KEY);
      setPendingError("");
      pendingDeliveryInProgress.current = false;
      router.replace("/messages");
    } catch {
      setPendingError("Couldn't discard the saved inquiry. Retry or keep it for later.");
    }
  };

  return {
    cancelPendingInquiry,
    conversations,
    conversationPage,
    hasPendingInquiry,
    listError,
    listLoading,
    listPaging,
    loadConversationList,
    loadMoreConversations,
    loadOlderMessages,
    message,
    pendingError,
    retryPendingInquiry,
    selectedConversationId,
    selectedThread,
    selectConversation,
    sendError,
    sendMessage,
    sending,
    setMessage,
    threadError,
    threadLoading,
    threadRefreshing,
    visibleMessages,
    refreshThread,
  };
}
