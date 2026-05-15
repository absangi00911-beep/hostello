// Path: src/components/booking-dialog.tsx

'use client';

import { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Room {
  id: string;
  name: string;
  pricePerMonth: number;
  available: number;
}

interface BookingDialogProps {
  hostelId: string;
  hostelName: string;
  rooms?: Room[];
}

export function BookingDialog({ hostelId, hostelName, rooms = [] }: BookingDialogProps) {
  const [date, setDate] = useState<Date>();
  const [months, setMonths] = useState('1');
  const [guests, setGuests] = useState('1');
  const [roomId, setRoomId] = useState<string>('none');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleBooking = async () => {
    if (!date) {
      toast.error('Please select a check-in date');
      return;
    }

    setIsSubmitting(true);
    try {
      const checkIn = date;
      const checkOut = addMonths(date, parseInt(months));

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostelId,
          roomId: roomId === 'none' ? undefined : roomId,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests: parseInt(guests),
          paymentMethod: 'safepay', // Default for now
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      toast.success('Booking request sent successfully!');
      setIsOpen(false);
      
      // Redirect to the dashboard
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full bg-[#2A6545] text-white py-3 rounded font-medium hover:bg-[#1F5035] transition">Request Booking</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book {hostelName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Room Selection */}
          {rooms.length > 0 && (
            <div className="space-y-2">
              <Label>Select Room Type</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Hostel Booking</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id} disabled={room.available < parseInt(guests)}>
                      {room.name} — PKR {room.pricePerMonth.toLocaleString()}/mo ({room.available} left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Stay Duration */}
            <div className="space-y-2">
              <Label>Stay Duration</Label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger>
                  <SelectValue placeholder="Months" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 6, 12].map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m} {m === 1 ? 'Month' : 'Months'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guests */}
            <div className="space-y-2">
              <Label>Guests</Label>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger>
                  <SelectValue placeholder="Guests" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      {g} {g === 1 ? 'Guest' : 'Guests'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Check-in Date */}
          <div className="space-y-2">
            <Label>Check-in Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={setDate} 
                  disabled={(d) => d < new Date() || d < addMonths(new Date(), -1)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            onClick={handleBooking} 
            disabled={isSubmitting}
            className="w-full bg-[#2A6545] hover:bg-[#1F5035]"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              'Confirm Request'
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            By clicking confirm, you agree to the hostel rules and our terms of service.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
