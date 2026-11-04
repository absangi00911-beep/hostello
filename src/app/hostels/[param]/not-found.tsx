import { StatePanel } from "@/components/states/StatePanel";
import { siteCopy } from "@/lib/site-copy";

export default function HostelNotFound() {
  return (
    <StatePanel
      body={siteCopy.states.hostelNotFoundBody}
      title={siteCopy.states.hostelNotFoundTitle}
    />
  );
}
