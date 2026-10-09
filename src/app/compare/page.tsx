import { redirect } from "next/navigation";

/** Keep old comparison links useful by returning visitors to hostel search. */
export default function ComparePage() {
  redirect("/hostels");
}
