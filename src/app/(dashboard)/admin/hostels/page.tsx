'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function AdminListingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-hostels'],
    queryFn: async () => {
      const res = await fetch('/api/admin/hostels');
      if (!res.ok) throw new Error('Failed to fetch hostels');
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/hostels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hostels'] });
      toast.success('Listing status updated');
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const listings = data?.data || [];
  const statuses = ['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Hostel Approvals</h1>
      <Tabs defaultValue="PENDING_REVIEW">
        <TabsList>
          {statuses.map(s => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}
        </TabsList>
        {statuses.map(status => (
          <TabsContent key={status} value={status}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.filter((l: any) => l.status === status).map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.name}</TableCell>
                    <TableCell>{l.city}</TableCell>
                    <TableCell className="space-x-2">
                      {status === 'PENDING_REVIEW' && (
                        <Button size="sm" onClick={() => updateStatus.mutate({ id: l.id, status: 'ACTIVE' })}>Approve</Button>
                      )}
                      {status !== 'SUSPENDED' && (
                        <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: l.id, status: 'SUSPENDED' })}>Suspend</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
