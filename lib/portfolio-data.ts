// Content for the portfolio. Customer names are anonymised on purpose.

export const stats = [
  { value: 4, suffix: "+", label: "years in security engineering" },
  { value: 7, suffix: "", label: "repositories put under CI" },
  { value: 8, suffix: "", label: "Wazuh upgrade rounds shipped" },
  { value: 25, suffix: "+", label: "log source types onboarded" },
]

export const timeline = [
  {
    period: "2022 – 2023",
    title: "Onboarding & internal security tooling",
    points: [
      "Rolled out a company-wide password manager: Docker test system, TLS, fail2ban, role model, training videos",
      "Built a Python importer for Jira Assets over the Atlassian REST API",
      "Container hardening with Trivy scans in Jenkins, uptime monitoring",
    ],
  },
  {
    period: "2023 – 2024",
    title: "SIEM analyst & threat-intel automation",
    points: [
      "Dashboards for firewall, VPN, RDP, WAF, CDN and source-control logs",
      "Automated threat-intel pipeline: Grafana API → VirusTotal / AbuseIPDB enrichment → Teams alerts → IP blocklist",
      "Onboarded mail servers, IIS and PostgreSQL log sources for banking tenants",
    ],
  },
  {
    period: "2024 – 2025",
    title: "SOC operations & platform reliability",
    points: [
      "Daily triage across all SIEMs: rootkit alerts, AD privileged-group changes, brute force, DoS",
      "Root-caused 'agent event queue flooded' and fixed it with inventory-driven per-agent sizing",
      "Indexer operations: disk-full recovery, shard health, ISM policy clean-up, runbooks",
    ],
  },
  {
    period: "2025",
    title: "Platform engineering & infrastructure as code",
    points: [
      "Common + per-site rulesets as code for every SIEM site with xmllint validation",
      "Lint, molecule and downstream CI pipelines across 7 repositories",
      "Six Wazuh upgrade rounds, 4.9 → 4.14, including production agent fleets",
    ],
  },
  {
    period: "2026",
    title: "Greenfield SIEMs, detection engineering & agentic AI",
    points: [
      "Greenfield production SIEMs built from scratch on OpenStack with Terraform + Ansible",
      "auditd use-case programme with evidence-based false-positive reduction",
      "Designed an on-prem AI agent that automates the daily SOC review across every SIEM instance",
    ],
  },
]

export type Project = {
  id: string
  tag: string
  title: string
  summary: string
  metric: { value: string; label: string }
  details: string[]
  stack: string[]
}

export const projects: Project[] = [
  {
    id: "agentic",
    tag: "AI · 2026",
    title: "Agentic SIEM Dailies",
    summary:
      "An on-prem AI agent that reviews every Wazuh instance each morning and publishes one report of what actually changed.",
    metric: { value: "30M", label: "alerts/day on one instance, never sent to the model" },
    details: [
      "Deterministic aggregation first: code diffs the day against a baseline and the same weekday last week, producing a compact facts JSON",
      "The LLM only triages and explains, drilling down through a read-only multi-cluster MCP server (≤15 tool calls per instance)",
      "Guardrails: read-only end to end, log fields treated as untrusted input, no external LLM API, every tool call audit-logged",
      "A validation pass strips any number or IP not traceable to a tool result; unreachable instances are reported as NOT CHECKED",
      "Model chosen by benchmark: recorded days replayed through vLLM/Ollama candidates, scored on misses and unsupported claims",
    ],
    stack: ["MCP", "vLLM", "Ollama", "Python", "Wazuh API"],
  },
  {
    id: "greenfield",
    tag: "IaC · 2026",
    title: "Greenfield SIEM on OpenStack",
    summary:
      "A production Wazuh + OpenVAS platform for a federal public-health agency, built entirely from code.",
    metric: { value: "100%", label: "of the platform reproducible from Git" },
    details: [
      "Terraform for instances, Cinder volumes, security groups and cloud-init",
      "Access only through a hardened SSH-tunnel proxy with nginx routes",
      "Authenticated SMTP relay and Teams Workflows alerting with dashboard deep links",
      "Index lifecycle, snapshot policies, customer read-only accounts, Kubernetes audit listener",
    ],
    stack: ["Terraform", "Ansible", "OpenStack", "Wazuh", "OpenVAS"],
  },
  {
    id: "noise",
    tag: "Detection · 2026",
    title: "Alert-noise reduction campaign",
    summary:
      "An auditd use-case catalogue tuned with evidence instead of guesswork.",
    metric: { value: "99.1%", label: "of a noisy level-7 population cleared by one reviewed change" },
    details: [
      "Custom decoder for hex-encoded argv/proctitle and enriched auditd identities",
      "Environment-scoped severities: production changes stay critical, non-prod drops to level 7",
      "96 suppression values reviewed; one minutely root cron job was behind 73% of a rule's alerts",
      "Retired a use case that could not work, with a documented RCA (194 → 12 alerts/h)",
    ],
    stack: ["auditd", "Wazuh rules", "PCRE2", "wazuh-logtest"],
  },
  {
    id: "pipeline",
    tag: "Data integrity · 2026",
    title: "Log pipeline integrity",
    summary:
      "Found a SaaS audit listener silently dropping most of every record, and rebuilt it.",
    metric: { value: "87%", label: "of each audit record was being truncated" },
    details: [
      "Re-emitted the nested audit log as its own event so nothing is lost",
      "Moved the listener from hand-deployed to Ansible; merged two listeners into one tested Python module",
      "Wrote recovery.py: re-ingests alerts, then archives, with no duplicates and no loss",
    ],
    stack: ["Python", "pytest", "Ansible", "Filebeat"],
  },
  {
    id: "rules",
    tag: "Governance · 2025–26",
    title: "Ruleset-as-code across every site",
    summary:
      "Every site's hand-maintained rules and decoders moved into version control with CI gates.",
    metric: { value: "7", label: "repositories under lint + molecule CI" },
    details: [
      "Common ruleset plus per-site trees, xmllint validation, regression corpora",
      "Rule-ID collision checks in CI; colliding IDs renumbered",
      "Safety asserts: refuse to mint a new root CA over a live cluster, block placeholder credentials",
    ],
    stack: ["GitLab CI", "ansible-lint", "molecule", "pre-commit"],
  },
  {
    id: "endpoint",
    tag: "Endpoint · 2025",
    title: "EDR & Windows 11 jumphost rollout",
    summary: "ESET PROTECT and Wazuh agents deployed in waves during the Windows 10 end-of-life programme.",
    metric: { value: "Waves", label: "with gap analysis and remediation between each" },
    details: [
      "Ansible play for the ESET management agent",
      "Gap analysis between EDR and SIEM coverage, remediated per wave",
    ],
    stack: ["ESET PROTECT", "Ansible", "Windows"],
  },
]

// Before/after of the uc_003 mount-syscall storm (alerts per hour)
export const noiseSeries = [
  { hour: "00", before: 188, after: 11 },
  { hour: "03", before: 201, after: 12 },
  { hour: "06", before: 196, after: 13 },
  { hour: "09", before: 190, after: 12 },
  { hour: "12", before: 199, after: 11 },
  { hour: "15", before: 194, after: 12 },
  { hour: "18", before: 192, after: 13 },
  { hour: "21", before: 194, after: 12 },
]

export const skills: Record<string, string[]> = {
  SIEM: ["Wazuh 4.8–4.14", "OpenSearch", "Custom decoders & rules", "Sigma", "FIM / SCA", "Sysmon & Windows events", "AbuseIPDB / VirusTotal"],
  "IaC & Cloud": ["Ansible", "Terraform", "OpenStack", "Kubernetes / Kustomize", "Podman / Docker", "Packer / Vagrant"],
  "CI/CD": ["GitLab CI", "molecule", "ansible-lint", "pre-commit", "Python", "Bash", "Jinja2"],
  "SecOps": ["SOC triage", "Incident response", "CVE & patch-day rating", "ESET PROTECT", "OpenVAS", "Hardening / fail2ban"],
  "AI / LLM": ["MCP servers", "Tool-calling agents", "vLLM / Ollama", "Prompt-injection guardrails", "Benchmark-driven model choice"],
  Compliance: ["NIS2", "DORA", "C5", "CIS Benchmarks", "Third-party risk evidence"],
}

export const logSources = [
  "Palo Alto", "F5 BIG-IP", "IIS", "nginx", "fail2ban", "PostgreSQL", "pgBackRest", "MariaDB", "Postfix",
  "Jenkins", "Tailscale", "Rundeck", "Cohesity", "OpenVPN", "Akamai", "GitHub", "Kubernetes audit",
  "RKE2 / Rancher", "ESET PROTECT", "Azure", "Sysmon", "Defender", "PowerShell", "auditd", "Passwork",
]

// Tuning case studies for the detection section. Every figure comes from real
// work; bars compare shares of the same population (before = 100).
export type TuningCase = {
  id: string
  tab: string
  title: string
  problem: string
  finding: string
  fix: string
  metric: { value: string; label: string }
  chart: { kind: "series" } | { kind: "steps"; steps: string[] } | { kind: "bars"; unit: string; bars: { label: string; value: number; tone: "danger" | "primary" | "muted" }[] }
}

export const tuningCases: TuningCase[] = [
  {
    id: "mount",
    tab: "Mount-syscall storm",
    title: "A firmware updater flooding a mount-syscall rule",
    problem: "An auditd mount use case was firing around 194 times an hour and burying analysts.",
    finding: "Tracing the process lineage showed fwupd, the firmware update daemon, behind the storm.",
    fix: "Scoped the benign updater out of the rule and sent the RCA to the customer.",
    metric: { value: "194 → 12", label: "alerts per hour" },
    chart: { kind: "series" },
  },
  {
    id: "cron",
    tab: "Root cron job",
    title: "One cron job behind most of a rule's alerts",
    problem: "A single auditd use case dominated the alert queue with no obvious attacker pattern.",
    finding: "Grouping by command line and user showed a minutely root cron job produced 73% of its alerts.",
    fix: "Baselined the exact job (command, user, schedule) instead of muting the rule wholesale.",
    metric: { value: "73%", label: "of the rule's alerts from one job" },
    chart: {
      kind: "bars",
      unit: "% of alerts",
      bars: [
        { label: "root cron job", value: 73, tone: "danger" },
        { label: "everything else", value: 27, tone: "primary" },
      ],
    },
  },
  {
    id: "suppress",
    tab: "Reviewed suppressions",
    title: "96 suppression values, reviewed one by one",
    problem: "A noisy level-7 population made a use case useless, and blanket suppression would have hidden real changes.",
    finding: "Each of the 96 candidate values was checked against the evidence before it went into a level-0 rule.",
    fix: "Environment-scoped levels (prod 12, non-prod 7) keep production changes critical while the reviewed set clears the noise.",
    metric: { value: "99.1%", label: "of the level-7 population cleared by one step" },
    chart: {
      kind: "bars",
      unit: "% of level-7 alerts",
      bars: [
        { label: "before", value: 100, tone: "danger" },
        { label: "after one suppression step", value: 0.9, tone: "primary" },
      ],
    },
  },
  {
    id: "listener",
    tab: "Truncated audit logs",
    title: "A listener silently dropping most of every record",
    problem: "A SaaS vendor's audit trail looked healthy, but detections built on it never fired.",
    finding: "Comparing raw input to indexed events showed the listener truncated about 87% of each audit record.",
    fix: "Re-emitted the audit log as its own event, rebuilt the listener as a unit-tested Python module deployed by Ansible, and wrote a re-ingestion tool that restores missing alerts without duplicates.",
    metric: { value: "~87%", label: "of each record restored" },
    chart: {
      kind: "bars",
      unit: "% of each record indexed",
      bars: [
        { label: "before", value: 13, tone: "danger" },
        { label: "after", value: 100, tone: "primary" },
      ],
    },
  },
  {
    id: "baseline",
    tab: "Baselines in git",
    title: "Known-benign noise, written down and reviewed",
    problem: "In one environment, 98% of alert volume was known benign noise, so every review started from scratch.",
    finding: "Without a shared baseline, people and automation kept rediscovering the same noise every day.",
    fix: "Kept the baselines in git, reviewed by analysts, so triage and the read-only agent only surface what's new.",
    metric: { value: "98%", label: "of alert volume known benign" },
    chart: {
      kind: "bars",
      unit: "% of alert volume",
      bars: [
        { label: "known benign (baselined)", value: 98, tone: "muted" },
        { label: "left to triage", value: 2, tone: "primary" },
      ],
    },
  },
]

// Well-known tuning patterns from public detection practice. These are not from
// my engagements and carry no measured numbers; the UI labels them as such.
export const tuningPatterns: TuningCase[] = [
  {
    id: "lsass",
    tab: "LSASS access",
    title: "Credential-dumping alerts fired by your own security tools",
    problem: "Sysmon event 10 rules on lsass.exe access fire constantly, mostly from EDR, AV and backup agents.",
    finding: "Legitimate tools open LSASS with narrow access masks; dumpers ask for read-memory rights like 0x1010 or 0x1410.",
    fix: "Filter on GrantedAccess plus signed, path-pinned source images, never on the process name alone.",
    metric: { value: "Access mask", label: "is the signal, not the process name" },
    chart: { kind: "steps", steps: ["Group alerts by SourceImage", "Check the signer and install path", "Exclude only exact path + signer + mask", "Keep everything else at high severity"] },
  },
  {
    id: "encoded",
    tab: "Encoded PowerShell",
    title: "Management agents that look like attackers",
    problem: "Rules for powershell -EncodedCommand trip on software deployment and device management scripts.",
    finding: "The benign runs share a parent process, a service account and a small set of script hashes.",
    fix: "Allowlist on parent + user + decoded content hash, and decode the payload into the alert so analysts see it.",
    metric: { value: "Parent + hash", label: "beats command-line allowlists" },
    chart: { kind: "steps", steps: ["Decode the Base64 payload at ingest", "Cluster by parent process and user", "Pin benign clusters by content hash", "Alert on anything new or modified"] },
  },
  {
    id: "travel",
    tab: "Impossible travel",
    title: "Users who \"teleport\" through VPNs and cloud proxies",
    problem: "Impossible-travel sign-in alerts are dominated by VPN exits, mobile carriers and cloud egress IPs.",
    finding: "Geo-IP alone can't tell a corporate egress from an attacker; ASN and known-egress context can.",
    fix: "Enrich sign-ins with ASN and a maintained egress list, and raise severity only when it pairs with MFA changes or new devices.",
    metric: { value: "Context", label: "turns geo noise into a signal" },
    chart: { kind: "steps", steps: ["Enrich with ASN and egress lists", "Drop known corporate egress pairs", "Correlate with MFA and device changes", "Escalate only the correlated cases"] },
  },
  {
    id: "brute",
    tab: "Failed logons",
    title: "Brute-force alerts from stale service credentials",
    problem: "Windows 4625 threshold rules page analysts for service accounts with expired passwords.",
    finding: "The same account, host and failure reason repeat on a schedule; real spraying hits many accounts from one source.",
    fix: "Aggregate by source across accounts for spraying, and route stale-credential failures to the owning team as a ticket.",
    metric: { value: "Aggregate", label: "by source, not per account" },
    chart: { kind: "steps", steps: ["Split by failure sub-status", "Detect spraying: one source, many accounts", "Ticket repeated service-account failures", "Review the threshold monthly"] },
  },
  {
    id: "scanner",
    tab: "Scanner noise",
    title: "Your vulnerability scanner, detected every week",
    problem: "Port-scan and exploit-signature rules light up during every authorised vulnerability scan.",
    finding: "Scans come from known hosts in known windows, but attackers also love to hide inside that noise.",
    fix: "Tag scanner sources from the asset inventory and lower priority only inside the scan window; outside it, alert as usual.",
    metric: { value: "Scoped", label: "by source and time window" },
    chart: { kind: "steps", steps: ["Tag scanner IPs from inventory", "Define the scan schedule", "Deprioritise inside the window only", "Alert on scanner IPs outside it"] },
  },
]
