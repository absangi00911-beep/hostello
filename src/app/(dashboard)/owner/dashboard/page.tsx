'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListingsTab } from '@/components/dashboard/owner/listings-tab';
import { BookingRequestsTab } from '@/components/dashboard/owner/bookings-tab';

export default function OwnerDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Owner Dashboard</h1>
      
      <Tabs defaultValue="listings" className="w-full">
        <TabsList>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="listings" className="mt-6">
          <ListingsTab />
        </TabsContent>
        
        <TabsContent value="bookings" className="mt-6">
          <BookingRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
