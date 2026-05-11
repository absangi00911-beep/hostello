'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PaymentFlowPage({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [method, setMethod] = useState('safepay');

  const handleConfirm = async () => {
    toast.success('Booking confirmed');
    router.push(`/bookings/${bookingId}/confirmation`);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Payment</h2>
      <Card>
        <CardHeader><CardTitle>Select Payment Method</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={method} onValueChange={setMethod}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="safepay" id="safepay" />
              <Label htmlFor="safepay">Safepay (Card/Bank)</Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="jazzcash" id="jazzcash" />
              <Label htmlFor="jazzcash">JazzCash</Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <RadioGroupItem value="easypaisa" id="easypaisa" />
              <Label htmlFor="easypaisa">EasyPaisa</Label>
            </div>
          </RadioGroup>
          <Button onClick={handleConfirm} className="w-full mt-6 bg-[#2A6545]">Confirm & Pay</Button>
        </CardContent>
      </Card>
    </div>
  );
}
