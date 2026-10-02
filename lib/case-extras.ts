// Extra depth for the case-study modal: an architecture that builds layer by
// layer, a before/after view where the change is documented, and a short
// retrospective. Facts only from the CV material; nothing customer-identifying.

export type ArchLayer = { label: string; nodes: { name: string; note: string }[] }
export type BeforeAfter =
  | { kind: "split"; before: { title: string; lines: string[] }; after: { title: string; lines: string[] } }
  | { kind: "pipeline"; caption: string; stages: { name: string; check: string }[] }
  | { kind: "bars"; caption: string; rows: { label: string; before: number; after: number; unit: string }[] }

export type CaseExtra = { arch: ArchLayer[]; beforeAfter?: BeforeAfter[]; retro: string[] }

export const caseExtras: Record<string, CaseExtra> = {
  agentic: {
    arch: [
      { label: "SIEM estate", nodes: [{ name: "Wazuh instances", note: "Alerts and archives stay where they are; nothing is copied out in bulk." }] },
      { label: "Proxy", nodes: [
        { name: "Multi-cluster MCP server", note: "Read-only tools: archive search, aggregation, timelines, rule anomaly diff, source-IP pivot, ingest lag." },
        { name: "Credentials", note: "Wazuh credentials and SIEM network access stay on the proxy, scoped to wazuh:read." },
      ] },
      { label: "Inference", nodes: [{ name: "Self-hosted LLM", note: "Inference only. No external LLM API; at most about 15 tool calls per instance." }] },
      { label: "Output", nodes: [
        { name: "Validation", note: "Removes any number or IP not traceable to a tool result. Unreachable = NOT CHECKED." },
        { name: "Daily report", note: "One page per day; tickets for findings that pass review." },
      ] },
    ],
    beforeAfter: [
      { kind: "split",
        before: { title: "Manual dailies", lines: ["An analyst opens each instance's dashboards", "Known-benign noise is rediscovered every day", "Coverage depends on who's on shift"] },
        after: { title: "Agent-assisted dailies", lines: ["Code diffs the day against a reviewed baseline and last week", "Only deviations reach the model, as a few KB of facts", "Every claim traceable; unreachable instances reported, never assumed clean"] } },
    ],
    retro: [
      "Model choice was benchmarked on replayed days, scored on misses and unsupported claims, not on how fluent the report sounded.",
      "Shadow mode against the human dailies is what builds trust; it should run until it misses no High finding.",
    ],
  },
  greenfield: {
    arch: [
      { label: "Access", nodes: [
        { name: "SSH-tunnel proxy", note: "The only way in. Hardened jump point with nginx routes to the dashboards." },
        { name: "Security groups", note: "Locked down; nothing listens publicly." },
      ] },
      { label: "Platform (Terraform + cloud-init)", nodes: [
        { name: "Wazuh all-in-one", note: "Manager, indexer and dashboard on OpenStack instances with Cinder volumes." },
        { name: "OpenVAS scanner", note: "A separate, larger VM for vulnerability scanning." },
      ] },
      { label: "Operations", nodes: [
        { name: "Alerting", note: "Authenticated SMTP relay and Teams workflows with dashboard deep links." },
        { name: "Lifecycle", note: "Index lifecycle and snapshot policies; customer read-only accounts." },
        { name: "Kubernetes audit", note: "A listener for the cluster's audit log." },
      ] },
    ],
    beforeAfter: [
      { kind: "pipeline", caption: "Build order, all from Git", stages: [
        { name: "terraform apply", check: "instances, volumes, security groups" },
        { name: "cloud-init", check: "base hardening on first boot" },
        { name: "ansible", check: "Wazuh, OpenVAS, alerting, policies" },
        { name: "proxy routes", check: "SSH tunnel + nginx" },
        { name: "handover", check: "read-only accounts, documentation" },
      ] },
    ],
    retro: [
      "Making the proxy the only entry point from day one is far easier than closing ports later.",
      "Everything reproducible from Git turned rebuilds and audits into routine work.",
    ],
  },
  noise: {
    arch: [
      { label: "Hosts", nodes: [{ name: "auditd", note: "Use-case watch keys from a generic baseline playbook." }] },
      { label: "Decoding", nodes: [{ name: "Custom auditd decoder", note: "Decodes hex-encoded argv and proctitle; enriches identities." }] },
      { label: "Rules", nodes: [
        { name: "Environment-scoped levels", note: "Production changes stay critical; non-prod drops to level 7." },
        { name: "Reviewed level-0 suppressions", note: "Each value backed by evidence before it ships." },
      ] },
      { label: "Analysts", nodes: [{ name: "Alert queue", note: "What remains is what's worth a look." }] },
    ],
    beforeAfter: [
      { kind: "bars", caption: "Measured on the tuned rules", rows: [
        { label: "mount-syscall rule", before: 194, after: 12, unit: "alerts/h" },
        { label: "level-7 population after one suppression step", before: 100, after: 0.9, unit: "%" },
      ] },
    ],
    retro: [
      "Grouping by command line and user found the 73% cron job faster than any amount of reading alerts.",
      "Retiring a use case that can't work, with an RCA, is a valid outcome of tuning.",
    ],
  },
  pipeline: {
    arch: [
      { label: "Source", nodes: [{ name: "SaaS audit API", note: "Nested audit records per action." }] },
      { label: "Collection", nodes: [{ name: "Listener (Python module)", note: "Two listeners merged into one with named handlers; unit-tested; deployed by Ansible." }] },
      { label: "SIEM", nodes: [
        { name: "Audit events", note: "The nested audit log is re-emitted as its own event so nothing is truncated." },
        { name: "recovery.py", note: "Re-ingests alerts, then archives, without duplicates." },
      ] },
    ],
    beforeAfter: [
      { kind: "bars", caption: "Share of each audit record that reached the SIEM", rows: [{ label: "audit record", before: 13, after: 100, unit: "%" }] },
      { kind: "split",
        before: { title: "Before", lines: ["Two hand-deployed listeners", "~87% of every record silently truncated", "Missing history with no way back"] },
        after: { title: "After", lines: ["One tested module, deployed by Ansible", "Audit log re-emitted as its own event", "recovery.py restores alerts and archives, no duplicates"] } },
    ],
    retro: [
      "Comparing raw input with indexed output should be a standing check for every new source, not a one-off.",
    ],
  },
  rules: {
    arch: [
      { label: "Repository", nodes: [
        { name: "Common ruleset", note: "Shared decoders and rules for every site." },
        { name: "Per-site trees", note: "Site-specific overrides, kept apart from the common set." },
      ] },
      { label: "CI gates", nodes: [
        { name: "xmllint", note: "Malformed XML never reaches a manager." },
        { name: "Rule-ID collision check", note: "Colliding IDs renumbered before merge." },
        { name: "Regression corpora", note: "Known log lines must still decode and match." },
      ] },
      { label: "Deploy", nodes: [{ name: "Ansible", note: "With safety asserts: no new root CA over a live cluster, no placeholder credentials." }] },
    ],
    beforeAfter: [
      { kind: "split",
        before: { title: "Before", lines: ["Rules edited by hand on each manager", "Hand-placed production files nobody tracked", "ID collisions found in production"] },
        after: { title: "After", lines: ["ruleset/common + ruleset/sites/<site>", "production files adopted back into the repository", "merge blocked on lint, xmllint and ID checks"] } },
      { kind: "pipeline", caption: "A rule change on its way to production", stages: [
        { name: "pre-commit", check: "format, yaml, xml" },
        { name: "xmllint", check: "schema-valid decoders and rules" },
        { name: "id-collision", check: "no duplicate rule IDs" },
        { name: "regression", check: "corpus lines still match" },
        { name: "molecule", check: "role converges" },
        { name: "deploy", check: "ansible with safety asserts" },
      ] },
    ],
    retro: [
      "Adopting the hand-placed production files back into Git was the unglamorous step that made everything else possible.",
    ],
  },
  endpoint: {
    arch: [
      { label: "Management", nodes: [{ name: "ESET PROTECT", note: "Management agent deployed with an Ansible play." }] },
      { label: "Endpoints", nodes: [
        { name: "Windows 11 jumphosts", note: "Rolled out in waves during the Windows 10 end-of-life programme." },
        { name: "Wazuh agents", note: "Deployed alongside the EDR." },
      ] },
      { label: "Assurance", nodes: [{ name: "Gap analysis", note: "EDR and SIEM coverage compared after each wave; gaps fixed before the next." }] },
    ],
    retro: ["Rolling out in waves with a gap check between them caught coverage holes while they were still small."],
  },
}
