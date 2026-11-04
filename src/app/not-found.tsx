import { StatePanel } from "@/components/states/StatePanel";
import { siteCopy } from "@/lib/site-copy";

export default function NotFound() {
  return (
    <StatePanel
      body={siteCopy.states.notFoundBody}
      title={siteCopy.states.notFoundTitle}
    />
  );
}
