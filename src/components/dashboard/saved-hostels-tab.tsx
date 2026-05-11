'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HostelCard } from '@/components/hostel-card';

export function SavedHostelsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['saved-hostels'],
    queryFn: async () => {
      const res = await fetch('/api/profile/favorites');
      if (!res.ok) throw new Error('Failed to fetch saved hostels');
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const hostels = data?.data || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hostels.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="pt-6 text-center text-muted-foreground">
            You haven't saved any hostels yet.
          </CardContent>
        </Card>
      ) : (
        hostels.map((hostel: any) => (
          <HostelCard key={hostel.id} hostel={hostel} />
        ))
      )}
    </div>
  );
}
