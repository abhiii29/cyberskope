# CyberSkope Landing Page

A professional, conversion-focused landing page for CyberSkope - a Berlin-based managed SOC/SIEM cybersecurity services company targeting SMBs across Europe.

## Project Overview

CyberSkope provides enterprise-grade 24/7 threat detection and response services at affordable prices for small and medium-sized businesses. This landing page showcases the company's services, expertise, and value proposition with a modern, trustworthy design.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Email Service**: Resend API
- **UI Components**: shadcn/ui components (Button, Card, Input, Textarea)

## Features & Sections

### 1. Navigation
- Sticky header with smooth scroll navigation
- Mobile-responsive hamburger menu
- Links to all major sections
- CTA button for contact

### 2. Hero Section
- Compelling headline and subheadline
- Primary and secondary CTAs
- Compliance badges (ISO 27001, SOC 2, GDPR, NIS2)
- Animated dashboard preview cards showing:
  - Active threats monitoring
  - Response time metrics
  - Security score visualization

### 3. Stats Bar
- Key metrics display:
  - 24/7 monitoring availability
  - <15 min response time
  - 99.9% uptime guarantee
  - Multi-framework compliance ready

### 4. Services Grid
- **24/7 Threat Monitoring**: Real-time security monitoring with instant alerts
- **Incident Response**: Expert-led response with detailed forensics
- **Compliance Support**: Multi-framework compliance assistance
- **Threat Intelligence**: Real-time IOC enrichment from industry-leading feeds
- **Log Management**: Centralized log collection and analysis
- **Custom Playbooks**: Tailored automated response workflows

### 5. How It Works
Three-step process visualization:
1. **Connect Your Systems** - Quick integration with existing infrastructure
2. **We Monitor 24/7** - Expert SOC team watches for threats
3. **Rapid Response** - Immediate action on detected threats

### 6. Pricing Section
- Three service tiers: Starter, Professional, Enterprise
- Feature comparison without explicit pricing
- "Contact Us" CTAs for all tiers
- Emphasis on custom solutions

### 7. About Section
- Company mission and vision
- Focus on democratizing enterprise-grade security
- Highlights Berlin-based operations
- Multi-framework compliance emphasis

### 8. Contact Form
- Functional contact form with server-side validation
- Fields: Name, Email, Company, Message
- Real-time form submission with loading states
- Success/error feedback
- Email delivery via Resend API

### 9. Footer
- Company information and tagline
- Quick links to all sections
- Social media links (LinkedIn)
- Contact information
- Copyright notice

## Design System

### Color Palette
- **Background**: Slate-950 (dark theme)
- **Primary Accent**: Cyan-400 (#06b6d4)
- **Text**: White/Slate-100 for primary text
- **Muted**: Slate-400 for secondary text
- **Cards**: Slate-900 with subtle borders

### Typography
- **Headings**: Bold, large sizes with proper hierarchy
- **Body**: Leading-relaxed (1.6 line-height) for readability
- **Accents**: Cyan-400 for emphasis and CTAs

### Layout
- Mobile-first responsive design
- Flexbox for most layouts
- CSS Grid for service cards and feature grids
- Consistent spacing using Tailwind's spacing scale
- Smooth scroll behavior

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Resend account with verified domain

### Installation

1. **Clone or download the project**
   \`\`\`bash
   # If using the shadcn CLI (recommended)
   npx shadcn@latest init
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   RESEND_API_KEY=your_resend_api_key_here
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Email Configuration

### Resend Setup

The contact form uses Resend to send emails. Follow these steps to configure it:

1. **Create a Resend account**
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account

2. **Verify your domain**
   - Go to [resend.com/domains](https://resend.com/domains)
   - Add your domain: `cyberskope.eu`
   - Follow the DNS verification steps
   - Wait for verification (usually takes a few minutes)

3. **Get your API key**
   - Go to [resend.com/api-keys](https://resend.com/api-keys)
   - Create a new API key
   - Copy the key and add it to your `.env.local` file

4. **Email configuration**
   - **From**: `CyberSkope <info@cyberskope.eu>`
   - **To**: `info@cyberskope.eu`
   - **Reply-To**: Set to the form submitter's email for easy responses

### Contact Form Functionality

The contact form (`app/actions/contact.ts`) includes:
- Server-side form validation
- Email sending via Resend API
- Error handling with user-friendly messages
- Loading states during submission
- Success confirmation
- Reply-to header set to submitter's email

## Key Modifications Made

### Content Changes

1. **Pricing Strategy**
   - Removed explicit pricing amounts (€1,800/month, €4,500/month, etc.)
   - Changed CTAs from "Get Started" to "Contact Us"
   - Emphasized custom solutions and consultative approach

2. **Contact Information**
   - Updated email to: `info@cyberskope.eu`
   - Removed personal email addresses
   - Added direct contact section

3. **Tool Mentions Removed**
   - Removed specific tool names: Wazuh, AbuseIPDB, VirusTotal, MISP
   - Replaced with general descriptions: "industry-leading feeds", "enterprise-grade tools"
   - Made messaging broader to appeal to wider audience

4. **Personal Information**
   - Removed founder's name and personal details
   - Removed GitHub links
   - Kept focus on company rather than individuals

5. **Compliance Expansion**
   - Changed from GDPR-only to multi-framework compliance
   - Added: ISO 27001, SOC 2, GDPR, NIS2
   - Emphasized "compliance-ready" approach

6. **Open-Source References**
   - Removed all mentions of "open-source technology"
   - Kept messaging technology-agnostic

7. **About Section**
   - Changed from problem-focused to mission-focused
   - New text: "CyberSkope was created to democratize enterprise-grade security, making world-class threat detection accessible to businesses of all sizes."
   - More positive and aspirational tone

### Technical Implementation

1. **Email Integration**
   - Implemented Resend API for contact form
   - Created server action for form handling
   - Added proper error handling and validation
   - Configured for verified domain usage

2. **Responsive Design**
   - Mobile-first approach
   - Hamburger menu for mobile navigation
   - Responsive grid layouts
   - Touch-friendly interactive elements

3. **Accessibility**
   - Semantic HTML elements
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader friendly

4. **Performance**
   - Optimized images with proper sizing
   - Efficient component structure
   - Minimal client-side JavaScript
   - Server-side rendering where possible

## File Structure

\`\`\`
cyberskope-landing/
├── app/
│   ├── actions/
│   │   └── contact.ts          # Server action for contact form
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Main landing page
│   └── globals.css              # Global styles and design tokens
├── components/
│   └── ui/                      # shadcn/ui components
├── public/                      # Static assets
├── .env.local                   # Environment variables (not in repo)
└── README.md                    # This file
\`\`\`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | API key from Resend for sending emails | Yes |

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   - Click the GitHub icon in the v0 interface
   - Push your code to a repository

2. **Deploy to Vercel**
   - Click "Publish" in the v0 interface, or
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in project settings
   - Deploy

3. **Configure Environment Variables**
   - In Vercel dashboard, go to Project Settings → Environment Variables
   - Add `RESEND_API_KEY` with your Resend API key
   - Redeploy if necessary

### Other Platforms

The app can be deployed to any platform that supports Next.js 14:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

Make sure to:
1. Set the build command: `npm run build`
2. Set the output directory: `.next`
3. Add environment variables
4. Ensure Node.js 18+ is used

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimizations

- Server-side rendering for initial page load
- Optimized images with proper dimensions
- Minimal JavaScript bundle size
- CSS-only animations where possible
- Lazy loading for below-the-fold content

## Security Considerations

- Server-side form validation
- Environment variables for sensitive data
- No client-side API key exposure
- HTTPS required for production
- Input sanitization in contact form

## Future Enhancements

Potential improvements for future iterations:
- Add blog section for SEO
- Implement case studies/testimonials
- Add live chat integration
- Create customer portal
- Add multi-language support (German/English)
- Implement analytics tracking
- Add A/B testing for CTAs
- Create demo booking system

## Support

For questions or issues:
- Email: info@cyberskope.eu
- LinkedIn: [linkedin.com/company/cyberskope](https://www.linkedin.com/company/cyberskope)

## License

Proprietary - CyberSkope © 2025

---

**Built with ❤️ for CyberSkope**
