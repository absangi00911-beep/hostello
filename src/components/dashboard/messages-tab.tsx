'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export function MessagesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const conversations = data?.data || [];

  return (
    <div className="space-y-4">
      {conversations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No active conversations.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {conversations.map((conv: any) => (
            <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[#2A2318]">{conv.hostelName}</h4>
                    <p className="text-sm text-[#857060] truncate max-w-[200px]">
                      {conv.messages[0]?.content || 'Start a conversation'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-[#2A6545] text-white text-xs px-2 py-1 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
