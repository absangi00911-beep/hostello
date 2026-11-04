import { StatePanel } from "@/components/states/StatePanel";
import { siteCopy } from "@/lib/site-copy";

export default function BookingNotFound() {
  return (
    <StatePanel
      body={siteCopy.states.bookingNotFoundBody}
      title={siteCopy.states.bookingNotFoundTitle}
    />
  );
}
