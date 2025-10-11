"use client"

import type React from "react"

import { useState } from "react"
import {
  Shield,
  Menu,
  X,
  Check,
  AlertTriangle,
  Zap,
  TrendingDown,
  Server,
  Cloud,
  Network,
  Database,
  FileCheck,
  AlertCircle,
  ChevronRight,
  Mail,
  Phone,
  Linkedin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function CyberSkopeLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    setTimeout(() => setFormSubmitted(false), 5000)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: "smooth" })
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-cyan-400" />
              <span className="text-xl font-bold">CyberSkope</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("services")}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-slate-300 hover:text-cyan-400 transition-colors"
              >
                About
              </button>
              <Button
                onClick={() => scrollToSection("contact")}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-300">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={() => scrollToSection("services")}
                className="block w-full text-left text-slate-300 hover:text-cyan-400 transition-colors py-2"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="block w-full text-left text-slate-300 hover:text-cyan-400 transition-colors py-2"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="block w-full text-left text-slate-300 hover:text-cyan-400 transition-colors py-2"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="block w-full text-left text-slate-300 hover:text-cyan-400 transition-colors py-2"
              >
                About
              </button>
              <Button
                onClick={() => scrollToSection("contact")}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-cyan-500/30 rounded-full mb-6">
                <span className="text-sm text-cyan-400">Enterprise Security for SMBs</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance">
                24/7 Threat Detection Without the Enterprise Cost
              </h1>
              <p className="text-lg text-slate-400 mb-8 text-pretty">
                Expert-managed SOC and SIEM services delivering enterprise-grade security monitoring at affordable
                rates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  onClick={() => scrollToSection("contact")}
                  size="lg"
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950"
                >
                  Get Free Security Assessment
                </Button>
                <Button
                  onClick={() => scrollToSection("how-it-works")}
                  size="lg"
                  variant="outline"
                  className="border-slate-700 hover:border-cyan-500 hover:text-cyan-400"
                >
                  See How It Works
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>No long-term contracts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>ISO 27001, SOC 2, GDPR, NIS2 ready</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-slate-900 border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Active Threats</span>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-4xl font-bold text-red-500">3</div>
                <div className="text-sm text-slate-500 mt-1">Detected in last 24h</div>
              </Card>
              <Card className="bg-slate-900 border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Mean Time to Detect</span>
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-4xl font-bold text-yellow-500">12 min</div>
                <div className="text-sm text-slate-500 mt-1">Industry avg: 197 days</div>
              </Card>
              <Card className="bg-slate-900 border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">False Positive Reduction</span>
                  <TrendingDown className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-4xl font-bold text-green-500">↓ 90%</div>
                <div className="text-sm text-slate-500 mt-1">Through custom tuning</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">3.5M</div>
              <div className="text-sm text-slate-400">Unfilled Security Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">€4.54M</div>
              <div className="text-sm text-slate-400">Avg. Breach Cost</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-sm text-slate-400">Monitoring Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">&lt;15min</div>
              <div className="text-sm text-slate-400">Mean Time to Detect</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What We Monitor & Protect</h2>
            <p className="text-lg text-slate-400">Comprehensive security coverage for your entire infrastructure</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-900 border-slate-800 p-6 hover:border-cyan-500/50 transition-colors">
              <Server className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Endpoint Security</h3>
              <p className="text-slate-400">
                Windows, Linux, macOS monitoring with EDR/EPP integration for comprehensive endpoint protection.
              </p>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-6 hover:border-cyan-500/50 transition-colors">
              <Cloud className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Cloud Infrastructure</h3>
              <p className="text-slate-400">
                AWS, Azure, GCP monitoring including IAM, GuardDuty, and Security Hub integration.
              </p>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-6 hover:border-cyan-500/50 transition-colors">
              <Network className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Network & Applications</h3>
              <p className="text-slate-400">Firewall logs, web application monitoring, and API security analysis.</p>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-6 hover:border-cyan-500/50 transition-colors">
              <Database className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Threat Intelligence</h3>
              <p className="text-slate-400">
                Real-time threat intelligence enrichment using multiple industry-leading feeds and IOC databases.
              </p>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-6 hover:border-cyan-500/50 transition-colors">
              <FileCheck className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Compliance Reporting</h3>
              <p className="text-slate-400">ISO 27001, SOC 2, GDPR, and PCI-DSS compliance reporting and monitoring.</p>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-6 hover:border-cyan-500/50 transition-colors">
              <AlertCircle className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Incident Response</h3>
              <p className="text-slate-400">Root cause analysis and remediation guidance for detected threats.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-slate-400">Get started with enterprise security in four simple steps</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Discovery Call</h3>
                <p className="text-slate-400">
                  Understand your infrastructure and security goals through a comprehensive consultation.
                </p>
              </div>
              <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-cyan-500/30" />
            </div>

            <div className="relative">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">Free Assessment</h3>
                <p className="text-slate-400">
                  Comprehensive security posture evaluation to identify vulnerabilities and risks.
                </p>
              </div>
              <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-cyan-500/30" />
            </div>

            <div className="relative">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Rapid Deployment</h3>
                <p className="text-slate-400">Agent deployment and custom tuning completed in just 2-4 weeks.</p>
              </div>
              <ChevronRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-cyan-500/30" />
            </div>

            <div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 font-bold text-xl mb-4">
                  4
                </div>
                <h3 className="text-xl font-semibold mb-3">24/7 Monitoring</h3>
                <p className="text-slate-400">
                  Continuous threat detection and response with expert security analysts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Flexible Security Solutions</h2>
            <p className="text-lg text-slate-400">Tailored security packages designed for your business needs</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Starter */}
            <Card className="bg-slate-900 border-slate-800 p-8">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-lg text-slate-400">For small teams</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Up to 25 endpoints</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Business hours support (9-5 CET)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Weekly security reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Basic detection rules</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Email & Slack alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Monthly compliance summary</span>
                </li>
              </ul>
              <Button
                onClick={() => scrollToSection("contact")}
                variant="outline"
                className="w-full border-slate-700 hover:border-cyan-500 hover:text-cyan-400"
              >
                Contact Us
              </Button>
            </Card>

            {/* Professional - Most Popular */}
            <Card className="bg-slate-900 border-cyan-500 p-8 relative shadow-lg shadow-cyan-500/20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="mb-6">
                <span className="text-lg text-slate-400">For growing businesses</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Up to 100 endpoints</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">24/7 monitoring & alerting</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Custom detection engineering</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Monthly compliance reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Quarterly threat hunting</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Dedicated Slack channel</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Incident response coordination</span>
                </li>
              </ul>
              <Button
                onClick={() => scrollToSection("contact")}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950"
              >
                Contact Us
              </Button>
            </Card>

            {/* Enterprise */}
            <Card className="bg-slate-900 border-slate-800 p-8">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-lg text-slate-400">For large organizations</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">200+ endpoints</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Dedicated security analyst</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Custom integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Industry-specific threat intel</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">On-demand incident response</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Executive security reviews</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">White-glove onboarding</span>
                </li>
              </ul>
              <Button
                onClick={() => scrollToSection("contact")}
                variant="outline"
                className="w-full border-slate-700 hover:border-cyan-500 hover:text-cyan-400"
              >
                Contact Us
              </Button>
            </Card>
          </div>

          <p className="text-center text-sm text-slate-400">
            Contact us for a custom quote tailored to your specific security needs and infrastructure
          </p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Built by Security Engineers, For Security</h2>
              <p className="text-lg text-slate-400 mb-6">
                Founded by experienced security engineers with extensive Blue Team, SIEM, and DevSecOps experience.
                CyberSkope was created to democratize enterprise-grade security, making world-class threat detection
                accessible to businesses of all sizes.
              </p>
              <p className="text-lg text-slate-400 mb-8">
                We believe every business deserves enterprise-grade security, regardless of size. By leveraging
                automation and expert engineering, we deliver world-class threat detection at a fraction of traditional
                costs.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-800 p-6 text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">90%</div>
                  <div className="text-sm text-slate-400">False Positive Reduction</div>
                  <div className="text-xs text-slate-500 mt-2">Through custom detection engineering</div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-6 text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">25%</div>
                  <div className="text-sm text-slate-400">Faster Detection</div>
                  <div className="text-xs text-slate-500 mt-2">With XDR-driven visibility</div>
                </Card>
                <Card className="bg-slate-900 border-slate-800 p-6 text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">EU</div>
                  <div className="text-sm text-slate-400">Berlin-Based</div>
                  <div className="text-xs text-slate-500 mt-2">Multi-framework compliance ready</div>
                </Card>
              </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 p-8">
              <h3 className="text-2xl font-bold mb-6">Why Choose Us?</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">
                    Cost-effective solutions significantly lower than commercial SIEMs
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Automation-first approach reduces operational overhead</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Custom detection rules tailored to your business</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Direct access to your SIEM dashboard (full transparency)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Expert-led service ensures quality at every step</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">No vendor lock-in, portable configurations</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Your Free Security Assessment</h2>
            <p className="text-lg text-slate-400">
              Let's discuss your security needs and how we can help protect your business
            </p>
          </div>

          {formSubmitted ? (
            <Card className="bg-slate-900 border-cyan-500 p-12 text-center">
              <Check className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-slate-400">We'll get back to you within 24 hours.</p>
            </Card>
          ) : (
            <Card className="bg-slate-900 border-slate-800 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name *
                    </label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-slate-950 border-slate-700 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-slate-950 border-slate-700 focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    Company Name *
                  </label>
                  <Input
                    id="company"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="bg-slate-950 border-slate-700 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="Tell us about your security needs - number of endpoints, compliance requirements, current setup..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-slate-950 border-slate-700 focus:border-cyan-500"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950">
                  Request Free Assessment
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  By submitting, you agree to our privacy policy. We'll never share your information.
                </p>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-4 text-center">Or reach out directly:</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <a
                    href="mailto:info@cyberskope.eu"
                    className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>info@cyberskope.eu</span>
                  </a>
                  <a
                    href="tel:+4915207610022"
                    className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span>+49 1520 761 0022</span>
                  </a>
                </div>

                <div className="flex items-center justify-center gap-4 mt-6">
                  <a
                    href="https://www.linkedin.com/company/cyberskope"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Linkedin className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-cyan-400" />
                <span className="text-lg font-bold">CyberSkope</span>
              </div>
              <p className="text-sm text-slate-400">
                Enterprise-grade security monitoring for SMBs. Built in Berlin, protecting businesses across Europe.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Managed Detection
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    SIEM Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Incident Response
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Compliance Reporting
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <button onClick={() => scrollToSection("about")} className="hover:text-cyan-400 transition-colors">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("pricing")} className="hover:text-cyan-400 transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("contact")} className="hover:text-cyan-400 transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © 2025 CyberSkope. All rights reserved. Based in Berlin, Germany.
          </div>
        </div>
      </footer>
    </div>
  )
}
