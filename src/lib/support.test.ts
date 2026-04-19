import assert from "node:assert/strict";
import test from "node:test";

import { sendContactMessage, sendIssueReport } from "./support";

test("sendContactMessage forwards contact submissions to the support inbox", async () => {
  const sent: Array<{ to: string; subject: string; html: string }> = [];

  const result = await sendContactMessage(
    {
      name: "Ali Raza",
      email: "ali@example.com",
      subject: "Issue with my booking",
      message: "I need help with a confirmed booking that still looks pending.",
    },
    async (payload) => {
      sent.push(payload);
      return { success: true };
    }
  );

  assert.equal(result.success, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.to, "support@hostello.pk");
  assert.match(sent[0]?.subject ?? "", /\[Contact\] Issue with my booking/);
  assert.match(sent[0]?.html ?? "", /Ali Raza/);
  assert.match(sent[0]?.html ?? "", /ali@example\.com/);
});

test("sendIssueReport forwards reports to the support inbox with report details", async () => {
  const sent: Array<{ to: string; subject: string; html: string }> = [];

  const result = await sendIssueReport(
    {
      type: "payment",
      description: "The listing says card is available, but the payment page does not explain the flow clearly.",
      url: "https://hostello.pk/hostels/sample-hostel",
      email: "reporter@example.com",
    },
    async (payload) => {
      sent.push(payload);
      return { success: true };
    }
  );

  assert.equal(result.success, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.to, "support@hostello.pk");
  assert.match(sent[0]?.subject ?? "", /\[Report\] Payment issue/);
  assert.match(sent[0]?.html ?? "", /reporter@example\.com/);
  assert.match(sent[0]?.html ?? "", /sample-hostel/);
});
