import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface HostelCardProps {
  hostel: {
    id: string;
    name: string;
    slug: string;
    city: string;
    pricePerMonth: number;
    coverImage: string | null;
    verified: boolean;
  };
}

export function HostelCard({ hostel }: HostelCardProps) {
  return (
    <Link href={`/hostels/${hostel.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video relative bg-muted">
          {hostel.coverImage && (
            <img 
              src={hostel.coverImage} 
              alt={hostel.name} 
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg text-[#2A2318]">{hostel.name}</h3>
            {hostel.verified && <Badge variant="secondary" className="bg-[#D3EDE1] text-[#1F5035]">Verified</Badge>}
          </div>
          <p className="text-sm text-[#857060]">{hostel.city}</p>
          <p className="font-bold text-[#C28B1A]">PKR {hostel.pricePerMonth.toLocaleString()} / month</p>
        </CardContent>
      </Card>
    </Link>
  );
}
