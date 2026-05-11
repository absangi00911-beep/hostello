'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function ListingsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      // Assuming an endpoint exists to fetch current owner's listings
      const res = await fetch('/api/admin/hostels'); 
      if (!res.ok) throw new Error('Failed to fetch listings');
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const listings = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Listings</h2>
        <Button className="bg-[#2A6545]">Add New Listing</Button>
      </div>
      
      {listings.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            You haven't listed any hostels yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((hostel: any) => (
            <Card key={hostel.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{hostel.name}</h4>
                  <p className="text-sm text-[#857060]">{hostel.city}</p>
                </div>
                <Badge variant={hostel.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {hostel.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
