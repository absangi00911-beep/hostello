'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function MessageThreadPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      setContent('');
    },
    onError: () => toast.error('Failed to send message'),
  });

  if (isLoading) return <Skeleton className="h-full w-full" />;

  const conversation = data?.data;
  const messages = conversation?.messages || [];
  const currentUser = conversation?.participants[0].userId; // Simplified for this demo

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] p-6 bg-white rounded-lg border shadow-sm">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b">{conversation.hostelName}</h2>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((msg: any) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex gap-3 max-w-[80%]",
              msg.senderId === currentUser ? "self-end flex-row-reverse" : "self-start"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={msg.sender?.avatar} />
              <AvatarFallback>{msg.sender?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className={cn(
              "p-3 rounded-lg text-sm",
              msg.senderId === currentUser ? "bg-[#2A6545] text-white" : "bg-[#FAF5EC]"
            )}>
              <p>{msg.content}</p>
              <span className="text-[10px] opacity-70 block mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-h-[40px]"
        />
        <Button onClick={() => sendMessage.mutate(content)} className="bg-[#2A6545] h-full">Send</Button>
      </div>
    </div>
  );
}
