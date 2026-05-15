// Path: src/components/dashboard/bookings-tab.tsx

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function BookingsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Booking cancelled');
    },
    onError: () => toast.error('Failed to cancel booking'),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const bookings = data?.data || [];

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            You have no active bookings.
          </CardContent>
        </Card>
      ) : (
        bookings.map((booking: any) => (
          <Card key={booking.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#2A2318]">{booking.hostel.name}</h4>
                <p className="text-sm text-[#857060]">
                  {new Date(booking.checkIn).toLocaleDateString()} — {new Date(booking.checkOut).toLocaleDateString()}
                  <br />
                  Ref: #{booking.id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                  {booking.status}
                </Badge>
                {booking.status === 'PENDING' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">Cancel</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Booking Request?</DialogTitle>
                        <DialogDescription>
                          This will cancel your request for {booking.hostel.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Back</Button>
                        <Button variant="destructive" onClick={() => cancelMutation.mutate(booking.id)}>Confirm Cancel</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
