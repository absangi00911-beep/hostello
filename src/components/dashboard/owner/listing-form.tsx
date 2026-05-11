'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hostelCreateSchema, type HostelCreateInput } from '@hostello/shared/validations';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function ListingForm({ initialData }: { initialData?: any }) {
  const [step, setStep] = useState(1);
  const form = useForm<HostelCreateInput>({
    resolver: zodResolver(hostelCreateSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      city: '',
      address: '',
      amenities: [],
      rooms: 1,
      capacity: 1,
      gender: 'MIXED',
      pricePerMonth: 5000,
      rules: { quietHours: '', visitorsAllowed: false },
    },
  });

  const onSubmit = async (data: HostelCreateInput) => {
    const url = initialData ? `/api/hostels/${initialData.id}` : '/api/hostels';
    const method = initialData ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) toast.success('Listing saved');
    else toast.error('Failed to save listing');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Hostel Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="pricePerMonth" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (PKR)</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="rooms" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rooms</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="capacity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>
        <Button type="submit">Save Listing</Button>
      </form>
    </Form>
  );
}
