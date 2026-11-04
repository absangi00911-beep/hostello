import { StatePanel } from "./StatePanel";
import { siteCopy } from "@/lib/site-copy";

export function AccessDeniedState() {
  return (
    <StatePanel
      body={siteCopy.states.notFoundBody}
      title={siteCopy.states.notFoundTitle}
    />
  );
}
