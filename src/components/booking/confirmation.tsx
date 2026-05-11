'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmationPage({ bookingId }: { bookingId: string }) {
  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-6">
      <CheckCircle2 className="w-16 h-16 text-[#2A6545] mx-auto" />
      <h2 className="text-3xl font-bold">Booking Confirmed</h2>
      <Card>
        <CardContent className="p-6">
          <p className="text-[#857060]">Reference ID</p>
          <p className="font-mono text-xl font-bold">{bookingId.slice(-8).toUpperCase()}</p>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Link href="/dashboard">
          <Button className="w-full bg-[#2A6545]">View Booking</Button>
        </Link>
      </div>
    </div>
  );
}
