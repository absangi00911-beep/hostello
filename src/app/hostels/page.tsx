'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { HostelCard } from '@/components/hostel-card';
import { Skeleton } from '@/components/ui/skeleton';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const { data, isLoading } = useQuery({
    queryKey: ['hostels', query],
    queryFn: async () => {
      const res = await fetch(`/api/hostels?${query}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Search Results</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <p>No hostels found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.map((hostel: any) => (
            <HostelCard key={hostel.id} hostel={hostel} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Search Results</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
