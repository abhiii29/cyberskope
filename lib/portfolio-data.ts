// Content for the portfolio. Customer names are anonymised on purpose.

export const stats = [
  { value: 4, suffix: "+", label: "years in security engineering" },
  { value: 2, suffix: "", label: "SIEMs built from scratch" },
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
      "Two production SIEMs built from scratch on OpenStack with Terraform + Ansible",
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
