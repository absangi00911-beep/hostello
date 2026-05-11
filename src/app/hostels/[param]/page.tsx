'use client';

import { BookingDialog } from '@/components/booking-dialog';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function HostelDetailsPage() {
  const { param } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['hostel', param],
    queryFn: async () => {
      const res = await fetch(`/api/hostels/${param}`);
      if (!res.ok) throw new Error('Failed to fetch hostel details');
      return res.json();
    },
  });

  if (isLoading) return <div className="container mx-auto p-6 space-y-4"><Skeleton className="h-96 w-full"/><Skeleton className="h-8 w-1/3"/></div>;
  if (!data?.data) return <div className="container mx-auto p-6">Hostel not found.</div>;

  const hostel = data.data;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-[#2A2318]">{hostel.name}</h1>
        <div className="flex items-center gap-2">
          <p className="text-[#857060]">{hostel.city}, {hostel.area}</p>
          {hostel.verified && <Badge className="bg-[#D3EDE1] text-[#1F5035]">Verified</Badge>}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
            <img src={hostel.coverImage} alt={hostel.name} className="w-full h-full object-cover" />
          </div>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4 pt-4">
              <h3 className="text-xl font-semibold">Description</h3>
              <p className="text-[#4A3C2C] leading-relaxed">{hostel.description}</p>
              <Separator />
              <h3 className="text-xl font-semibold">Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {hostel.amenities.map((a: string) => <Badge key={a} variant="outline">{a}</Badge>)}
              </div>
            </TabsContent>
            <TabsContent value="rooms" className="space-y-4 pt-4">
              <div className="grid gap-4">
                {hostel.rooms_rel && hostel.rooms_rel.length > 0 ? (
                  hostel.rooms_rel.map((room: any) => (
                    <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{room.name}</h4>
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{room.available} beds available</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#C28B1A]">PKR {room.pricePerMonth.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">per month</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No specific room types listed for this hostel.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 border rounded-lg p-6 space-y-4 shadow-sm bg-white">
            <h3 className="text-2xl font-bold text-[#C28B1A]">PKR {hostel.pricePerMonth.toLocaleString()} / month</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Prices may vary by room type. Secure your spot by requesting a booking.</p>
            </div>
            <BookingDialog hostelId={hostel.id} hostelName={hostel.name} rooms={hostel.rooms_rel} />
          </div>
        </div>
      </div>
    </div>
  );
}
