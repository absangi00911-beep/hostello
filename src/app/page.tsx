'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LandingPage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (city) params.append('city', city);
    router.push(`/hostels?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] flex flex-col items-center pt-24 px-6">
      <h1 className="text-4xl md:text-5xl font-bold text-[#2A2318] mb-8 text-center">
        Find your room. <br /> Not a phone number.
      </h1>
      
      <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-sm border border-[#E0D4C0] flex flex-col md:flex-row gap-4">
        <Input 
          placeholder="Search hostels..." 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          className="flex-1"
        />
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Lahore">Lahore</SelectItem>
            <SelectItem value="Islamabad">Islamabad</SelectItem>
            <SelectItem value="Karachi">Karachi</SelectItem>
            <SelectItem value="Faisalabad">Faisalabad</SelectItem>
            <SelectItem value="Multan">Multan</SelectItem>
            <SelectItem value="Peshawar">Peshawar</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} className="bg-[#2A6545] hover:bg-[#1F5035]">Search</Button>
      </div>
    </div>
  );
}
