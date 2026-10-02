export type LabToolId = "translator" | "noise" | "attack" | "logtest" | "extract" | "regex" | "ioc"

export const labTools: { id: LabToolId; name: string; short: string; long: string }[] = [
  {
    id: "translator",
    name: "Rule translator",
    short: "Sigma → Splunk, Elastic, Sentinel, LogScale, Wazuh",
    long: "Paste a Sigma rule and get queries for five platforms, plus an honest list of what each translation lost. Test the rule against a sample event with Sigma's own matching semantics, and share the rule as a link.",
  },
  {
    id: "noise",
    name: "Alert-noise analyser",
    short: "Find what floods the queue, draft a reviewed suppression",
    long: "Load an alert export (Wazuh alerts.json, NDJSON, JSON or CSV). It groups alerts by the fields you pick, ranks the noise makers, spots groups that fire on a schedule, and drafts a Wazuh or Sigma suppression with the evidence written into it.",
  },
  {
    id: "attack",
    name: "ATT&CK coverage",
    short: "Map a rule pack's tags onto the ATT&CK matrix",
    long: "Paste a pack of Sigma rules and see which ATT&CK techniques they claim to cover, which tactics are thin, and which rules have no technique tag at all.",
  },
  {
    id: "logtest",
    name: "Decoder & rule tester",
    short: "A browser take on wazuh-logtest",
    long: "Write Wazuh decoders and rules and test them against a log line: pre-decoding, which decoder matched, the fields it extracted and the rule chain that fired, phase by phase.",
  },
  {
    id: "extract",
    name: "Log field extractor",
    short: "auditd, syslog, CEF, LEEF, Windows XML → fields",
    long: "Paste a raw log line. It detects the format and splits it into fields, decoding auditd's hex-encoded proctitle and arguments on the way.",
  },
  {
    id: "regex",
    name: "Regex portability",
    short: "One pattern across PCRE2, OS_Regex, Splunk and KQL",
    long: "Test one pattern against sample lines in five detection dialects side by side, and see where it breaks: OS_Regex has no character classes, RE2 has no lookaround, rex needs named groups.",
  },
  {
    id: "ioc",
    name: "IOC extractor",
    short: "Refang, extract, de-duplicate, defang",
    long: "Paste a report, ticket or chat thread. It refangs the usual obfuscations, pulls out URLs, domains, IPs, emails, hashes and CVEs, flags private and internal ranges, and gives you a clean defanged list or CSV.",
  },
]
