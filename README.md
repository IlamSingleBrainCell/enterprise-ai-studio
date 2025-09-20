# Macquarie CGM Post Trade - AI SDLC Platform

🚀 A comprehensive AI-powered Software Development Lifecycle (SDLC) platform designed for regulatory compliance and automated trading systems in the financial services industry.

![Platform Screenshot](docs/screenshot-dashboard.png)

## Overview

The Macquarie CGM Post Trade Platform is a modern web application that provides:

- **AI Agent Orchestration** - Manage intelligent agents across the development lifecycle
- **DORA Metrics Tracking** - Real-time DevOps performance metrics
- **SPACE Framework Analytics** - Comprehensive developer productivity measurement
- **Regulatory Compliance Management** - Multi-jurisdiction compliance monitoring (AU, UK, US, EU)
- **Quality Gates Integration** - Automated security, testing, and compliance validation
- **Real-time Dashboard** - Live metrics and status monitoring

## ✨ Features

### 🤖 AI Agent Management
- Requirements Analysis Agent with regulatory impact assessment
- Design & Architecture Agent with compliance verification
- Build & Test Agents with automated quality validation
- RCM (Regulatory Compliance Manager) Service
- Deployment and Operations Agents

### 📊 Advanced Metrics
- **DORA Metrics**: Deployment Frequency, Lead Time, Change Failure Rate, MTTR
- **SPACE Framework**: Satisfaction, Performance, Activity, Communication, Efficiency
- Real-time pipeline monitoring and quality gates

### 🛡️ Compliance & Security
- Multi-jurisdiction regulatory compliance (MiFID II, EMIR, SOX, GDPR)
- Automated compliance monitoring and reporting
- Security scanning and vulnerability management
- Audit trail and documentation generation

### 🔗 Enterprise Integrations
- GitHub Enterprise (Source control & CI/CD)
- JIRA Agile (Project management)
- Confluence (Documentation)
- PostTrade.ai (AI platform)
- Various regulatory databases

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Modern web browser with ES2022 support
- Git for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/macquarie/cgm-posttrade-platform.git
cd cgm-posttrade-platform

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Serve built files
npm run serve
```

## 🏗️ Project Structure

```
macquarie_poc/
├── index.html                 # Main HTML entry point
├── manifest.json             # PWA manifest
├── service-worker.js         # Service worker for offline capability
├── package.json              # Dependencies and scripts
├── vite.config.js           # Build configuration
├── src/
│   ├── css/                 # Modular stylesheets
│   │   ├── base.css         # Global styles and resets
│   │   ├── layout.css       # Layout and responsive design
│   │   ├── components.css   # Reusable UI components
│   │   ├── features.css     # Feature-specific styles
│   │   └── dora-space.css   # DORA metrics and SPACE framework
│   ├── js/                  # JavaScript modules
│   │   ├── app.js           # Main application controller
│   │   ├── tab-manager.js   # Navigation management
│   │   ├── notification-manager.js  # User notifications
│   │   ├── dora-metrics.js  # DORA metrics simulation
│   │   ├── project-form-manager.js  # Form handling
│   │   ├── space-framework.js       # SPACE framework UI
│   │   └── tab-content.js   # Tab content templates
│   └── assets/              # Static assets
│       └── icons/           # PWA icons and favicons
└── docs/                    # Documentation
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Lint code with ESLint
npm run lint:fix    # Auto-fix linting issues
npm run format      # Format code with Prettier
npm run test        # Run test suite
npm run test:watch  # Run tests in watch mode
npm run lighthouse  # Generate Lighthouse performance report
npm run clean       # Clean build directory
```

### Code Quality

The project uses modern tooling for code quality:

- **ESLint** for JavaScript linting
- **Prettier** for code formatting
- **Jest** for unit testing
- **Lighthouse** for performance auditing

### Module System

The application uses ES6 modules with:
- Clean separation of concerns
- Dependency injection patterns
- Event-driven architecture
- Progressive enhancement

## 📱 Progressive Web App (PWA)

The platform is built as a PWA with:

- **Offline capability** via Service Worker
- **App-like experience** with manifest.json
- **Push notifications** for updates
- **Background sync** for form submissions
- **Installable** on desktop and mobile

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimizations
- Touch-friendly interactions
- Accessible design patterns

### Visual Design
- Modern gradient backgrounds
- Glass-morphism effects
- Smooth animations and transitions
- Consistent color palette
- Professional typography

## 🔧 Configuration

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
VITE_API_BASE_URL=https://api.macquarie.com
VITE_GITHUB_TOKEN=your_github_token
VITE_JIRA_BASE_URL=https://macquarie.atlassian.net
VITE_CONFLUENCE_BASE_URL=https://macquarie.atlassian.net/wiki
```

### Build Configuration

The `vite.config.js` file contains:
- Development server settings
- Production build optimization
- PWA plugin configuration
- Asset bundling strategies

## 📊 Metrics and Analytics

### DORA Metrics
The platform tracks key DevOps Research and Assessment metrics:
- **Deployment Frequency**: How often deployments occur
- **Lead Time for Changes**: Time from commit to production
- **Change Failure Rate**: Percentage of deployments causing failures
- **Mean Time to Restore**: Time to recover from failures

### SPACE Framework
Comprehensive developer productivity measurement:
- **Satisfaction**: Developer experience and well-being
- **Performance**: Outcome and business value
- **Activity**: Development work volume
- **Communication**: Team collaboration effectiveness
- **Efficiency**: Developer flow and task completion

## 🛡️ Security

### Security Features
- Content Security Policy (CSP) headers
- HTTPS enforcement
- Secure cookie handling
- Input validation and sanitization
- Regular dependency updates

### Compliance
- GDPR compliance for data handling
- SOX compliance for financial controls
- MiFID II and EMIR regulatory requirements
- Regular security audits and assessments

## 🚀 Deployment

### Static Hosting
The build output can be deployed to any static hosting service:

```bash
# Build the project
npm run build

# Deploy the dist/ directory to your hosting service
```

### Recommended Hosting
- Vercel (with automatic deployments)
- Netlify (with form handling)
- GitHub Pages (for open source projects)
- AWS S3 + CloudFront
- Azure Static Web Apps

### CI/CD Pipeline
The project includes configuration for:
- GitHub Actions workflows
- Automated testing and linting
- Performance monitoring
- Security scanning

## 📚 Documentation

### Additional Resources
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](docs/contributing.md)
- [Architecture Overview](docs/architecture.md)
- [Performance Optimization](docs/performance.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/contributing.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- 📧 Email: cgm-posttrade-support@macquarie.com
- 💬 Slack: #cgm-posttrade-platform
- 📖 Documentation: [docs.macquarie.com/cgm-posttrade](https://docs.macquarie.com/cgm-posttrade)
- 🐛 Issues: [GitHub Issues](https://github.com/macquarie/cgm-posttrade-platform/issues)

### EY Strategic Partnership
This platform is delivered in partnership with EY's strategic transformation team, providing:
- Dedicated Concierge Team support
- Proven post-trade transformation expertise
- Comprehensive change management
- Knowledge transfer and capability building

## 🏢 About Macquarie

Macquarie CGM Post Trade team is focused on revolutionizing post-trade processing through AI-powered automation, regulatory compliance excellence, and operational efficiency improvements.

---

**Built with ❤️ by the Macquarie CGM Post Trade Team**

*Transforming financial services through AI-powered innovation*