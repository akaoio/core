# SSL Security Principle - Zero Tolerance for Self-Signed Certificates

## Core Principle
**"NEVER CREATE ANY SELF-SIGNED SSL KEYS"**

This is a fundamental, non-negotiable security principle for the entire @akaoio/core multi-agent system.

## Universal Application
- **ALL 34 agents** must follow this rule across all teams (meta, core-fix, integration, feature-dev, security, project teams)
- **ALL projects** must comply (access, air, battle, builder, composer, tui, ui)
- **Use Let's Encrypt ONLY** for SSL certificates
- **Use proper Certificate Authority (CA) signed certificates** in all environments
- **NO development shortcuts** with self-signed certificates
- **NO temporary exceptions** - this rule has NO EXCEPTIONS

## Critical Impact on Air Project
The Air P2P network requires CA-signed certificates for all peer connections - NO EXCEPTIONS. Self-signed certificates would break the entire Living Agent System communication infrastructure.

## Required Implementation
```bash
# CORRECT: Use Let's Encrypt
certbot certonly --nginx -d domain.com

# CORRECT: Use proper CA certificates  
curl --cert ca-signed-cert.pem --key private-key.pem https://api.example.com
```

## Prohibited Practices
```bash
# NEVER: Self-signed certificate creation
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# NEVER: Bypass SSL verification
curl -k https://example.com
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
```

## Vision
This principle ensures the multi-agent system maintains production-grade security standards at all times, creating a foundation of trust that supports the entire ecosystem's communication and data exchange.

---
*Story captured from SSL security discussions and system-wide security enforcement requirements*