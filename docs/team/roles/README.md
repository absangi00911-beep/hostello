# HostelLo team roles

These roles are available as workspace Copilot agents in `.github/agents/`.
The briefs in this folder are the source for each role's responsibilities;
the shared rules in [`../00-shared.md`](../00-shared.md) apply to everyone.

## Reporting structure

```text
Human owner
└── Founder / CEO (top project role; reports to the human owner)
    ├── Tech Lead / Engineering Lead
    │   ├── Backend / Integrations Engineer
    │   ├── Senior Frontend Engineer
    │   │   └── Frontend Engineer
    │   └── QA / DevOps Engineer
    ├── Product Designer
    ├── Marketplace Operations & Trust/Safety
    ├── Growth & Partnerships
    ├── Security & Privacy Reviewer (independent; reports directly to Founder)
    └── Auditor (independent; reports findings directly to Founder)
```

The Founder sets approved project priorities and assigns bounded work. The
Tech Lead coordinates engineering work and escalates product, policy, and
production decisions to the Founder. Marketplace Operations and Growth advise
the Founder on execution and recommendations; neither may independently set
product policy or commit company resources. The Security & Privacy Reviewer
and Auditor stay independent of implementation and report findings directly
to the Founder. Every role returns its work and status to its direct manager;
the Founder gives the consolidated report to the human owner.

## Workspace agents

| Role | Agent | Brief |
|---|---|---|
| Founder / CEO | [founder.agent.md](../../../.github/agents/founder.agent.md) | [founder.md](founder.md) |
| Tech Lead / Engineering Lead | [tech-lead.agent.md](../../../.github/agents/tech-lead.agent.md) | [tech-lead.md](tech-lead.md) |
| Backend / Integrations Engineer | [backend-integrations-engineer.agent.md](../../../.github/agents/backend-integrations-engineer.agent.md) | [backend-engineer.md](backend-engineer.md) |
| Senior Frontend Engineer | [senior-frontend-engineer.agent.md](../../../.github/agents/senior-frontend-engineer.agent.md) | [senior-frontend-engineer.md](senior-frontend-engineer.md) |
| Frontend Engineer | [frontend-engineer.agent.md](../../../.github/agents/frontend-engineer.agent.md) | [frontend-engineer.md](frontend-engineer.md) |
| Product Designer | [product-designer.agent.md](../../../.github/agents/product-designer.agent.md) | [product-designer.md](product-designer.md) |
| QA / DevOps Engineer | [qa-devops-engineer.agent.md](../../../.github/agents/qa-devops-engineer.agent.md) | [devops-engineer.md](devops-engineer.md) |
| Marketplace Operations & Trust/Safety | [marketplace-ops-trust-safety.agent.md](../../../.github/agents/marketplace-ops-trust-safety.agent.md) | [marketplace-ops-trust-safety.md](marketplace-ops-trust-safety.md) |
| Growth & Partnerships | [growth-partnerships.agent.md](../../../.github/agents/growth-partnerships.agent.md) | [growth-partnerships.md](growth-partnerships.md) |
| Security & Privacy Reviewer | [security-privacy-reviewer.agent.md](../../../.github/agents/security-privacy-reviewer.agent.md) | [security-privacy-reviewer.md](security-privacy-reviewer.md) |
| Auditor | [auditor.agent.md](../../../.github/agents/auditor.agent.md) | [auditor.md](auditor.md) |

Use the Founder agent for coordination across roles. A focused task can be
assigned directly to its specialist. The agent doing the work must report its
files, checks, unresolved risks, and decisions needed to the agent or person
who assigned it.

Finance and legal are advisory functions, not autonomous Copilot roles.
Qualified human or external advisors report recommendations to the Founder
and human owner; the Founder must not present generated guidance as legal,
tax, regulatory, or financial advice. The human owner retains decisions on
pricing, budgets, payments, payouts, contracts, privacy policy, and compliance.

## Local execution and safety

- Agents operate in this VS Code workspace and repository. There is no
  separate Claude project, computer, patch relay, or automatic GitHub handoff.
- The assigning role defines a bounded objective, acceptance criteria, and
  non-goals. Keep concurrent assignments on disjoint files unless their
  owners agree on coordination.
- Specialist agents may edit only their assigned scope. The assigning role
  reviews the resulting diff and checks before reporting completion.
- No agent may commit, push, deploy, alter shared or production data, or enable
  live payment providers unless the human owner explicitly authorizes that
  action.
- The Founder remains the top project role, not an override for the human
  owner's authority.
