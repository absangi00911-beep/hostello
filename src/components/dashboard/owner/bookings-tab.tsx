'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function BookingRequestsTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/bookings'); // Assuming admin/owner booking list endpoint
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update booking');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      toast.success('Booking status updated');
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const bookings = data?.data || [];

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No pending booking requests.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking: any) => (
            <Card key={booking.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{booking.user.name}</h4>
                  <p className="text-sm text-[#857060]">
                    {booking.hostel.name} | {new Date(booking.checkIn).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {booking.status === 'PENDING' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'CONFIRMED' })}
                        className="bg-[#2A6545]"
                      >
                        Confirm
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateBookingMutation.mutate({ id: booking.id, status: 'CANCELLED' })}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  <Badge variant="secondary">{booking.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
