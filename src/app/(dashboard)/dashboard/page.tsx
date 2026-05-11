'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingsTab } from '@/components/dashboard/bookings-tab';
import { MessagesTab } from '@/components/dashboard/messages-tab';
import { SavedHostelsTab } from '@/components/dashboard/saved-hostels-tab';
import { PriceAlertsTab } from '@/components/dashboard/price-alerts-tab';

export default function StudentDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">My Dashboard</h1>
      
      <Tabs defaultValue="bookings" className="w-full">
        <TabsList>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="saved">Saved Hostels</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings" className="mt-6">
          <BookingsTab />
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <SavedHostelsTab />
        </TabsContent>
        
        <TabsContent value="messages" className="mt-6">
          <MessagesTab />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <PriceAlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
