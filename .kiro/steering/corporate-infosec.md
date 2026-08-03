---
inclusion: always
---

# Corporate Laptop Security Policy

## CRITICAL: This is a corporate/office laptop

This machine belongs to an employer. All work done here must comply with corporate information security policies.

## Rules (Apply to ALL projects)

### DO NOT:
- Transfer files directly from this laptop to personal servers (no `scp`, `rsync`, `ftp` to personal VPS)
- Store corporate credentials alongside personal project credentials
- Run network tunnels (`ngrok`, SSH tunnels) to personal infrastructure
- Install unauthorized software that bypasses corporate security
- Use corporate VPN/network for personal server communication
- Run services that listen on public-facing ports without authorization
- Upload proprietary code to personal repositories without permission

### SAFE PRACTICES:
- Use GitHub/GitLab (most corps allow this) as an intermediary for code transfer
- Keep personal project API keys in `.env` files that are `.gitignore`d
- Development servers on `localhost` only (127.0.0.1) are generally fine
- Never embed secrets in code — always use environment variables
- For VPS deployment, do everything FROM the VPS (git pull), never push FROM this laptop
- Use private repositories for personal projects
- Keep personal and work projects in separate directories

### DEPLOYMENT WORKFLOW:
1. Push code to private GitHub repository (no secrets in repo)
2. SSH into VPS from personal device (phone/home PC), NOT from this laptop
3. On VPS: `git pull` + configure `.env` + run deploy
4. Never establish direct corporate-laptop → personal-VPS connections

### WHEN IN DOUBT:
- Ask: "Would my IT security team be okay seeing this in network logs?"
- If the answer is no, find an alternative approach
- Prefer indirect methods (GitHub as middleman) over direct transfers
- Local development and testing on localhost is always safe

## Notes
- User: shjaisw (corporate employee)
- VPS: 147.93.169.183 (personal Contabo server — do NOT connect directly)
- Approach: All deployment happens FROM VPS side, never pushed from this machine
