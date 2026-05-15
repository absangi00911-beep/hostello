// Path: src/components/dashboard/price-alerts-tab.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function PriceAlertsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/price-alerts');
      if (!res.ok) throw new Error('Failed to fetch price alerts');
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const alerts = data?.data || [];

  return (
    <div className="space-y-4">
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No active price alerts.
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert: any) => (
          <Card key={alert.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#2A2318]">{alert.hostel.name}</h4>
                <p className="text-sm text-[#857060]">Target: PKR {alert.targetPrice.toLocaleString()}</p>
              </div>
              <Badge variant={alert.active ? 'default' : 'secondary'}>
                {alert.active ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
