# RateStack — Freelance & Agency Agreement Engine

**Lock contract scope, milestones, and signatures.** RateStack is a full-stack web
application for creating client agreements with auto-balancing milestones,
verifiable audit trails, and instant e-signable legal documents — built and
deployed end-to-end as a DevOps portfolio project.

🌐 **Live demo:** http://13.233.47.141/

> **Try it yourself** — sign up for a new account, or log in with the demo
> account below to explore the dashboard, clients, contracts, and signing flow:
>
> - Email: `shujaahmed198@gmail.com`
> - Password: `shuja123`

---

## What it does

RateStack lets a freelancer or agency:

- **Create milestone contracts** through a guided 4-step studio — client & scope,
  budget & milestones, review, publish.
- **Auto-balance milestone payouts** — define budgets in PKR, USD, EUR, or GBP
  and milestone percentages dynamically rebalance to exactly 100%.
- **Generate instant legal documents** — Mutual NDA, Employment Agreement, and
  Service Retainer templates with full clause editing.
- **Share a public signing link** — every published contract gets a unique
  `/c/[token]` URL; no account needed for the client to review and sign.
- **Collect legally-binding e-signatures** — consent checkbox + typed legal name
  per party, both signatures verified, contract locked on completion.
- **Export signed PDFs** — one-click download of the executed agreement for both
  parties.
- **Track milestone payments** — per-milestone status (pending → completed →
  paid) with progress bars on the dashboard.
- **Keep an audit trail** — every contract event is logged.

---

## Feature walkthrough

All screenshots below are taken from the live deployment.

### 1. Landing page
![RateStack landing page](docs/screenshots/01-landing-page.png)

### 2. Sign up
New accounts are created with full name, email, and password, verified via an
email verification code.
![Sign up page](docs/screenshots/02-signup-page.png)

### 3. Sign in
![Sign in page](docs/screenshots/03-login-page.png)

### 4. Contracts dashboard
Post-login landing view: every contract as a card with status badge
(`SENT` / `ACCEPTED`), total value, client, milestone roadmap, and progress.
![Contracts dashboard](docs/screenshots/04-dashboard.png)

### 5. Adding a new client
Clients are created inline in the contract studio (Step 1): contact name,
company, and email.
![New client form](docs/screenshots/05-new-client.png)

### 6. Creating a contract
Step 1 of the studio: pick the target client, set the contract title, and write
the scope of work & acceptance criteria.
![New contract form](docs/screenshots/06-new-contract.png)

### 7. Publishing
On publish the contract is cryptographically registered and a public client
sign URL is issued.
![Contract published](docs/screenshots/07-contract-published.png)

### 8. Client signing view
The public link opens the sealed agreement: parties, statement of work, and the
milestone schedule with payment allocations.
![Signing view](docs/screenshots/08-signing-view.png)

### 9. Signature protocol
Party A signs at publish time; Party B confirms consent, types their legal
name, and accepts — no account required.
![Signature protocol](docs/screenshots/09-signature-protocol.png)

### 10. Executed agreement
Once both parties sign, the agreement is locked, timestamped, and available as
a signed PDF download.
![Signed contract](docs/screenshots/10-signed-contract.png)

---

## Tech stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | Next.js 16 (App Router, React Server Components), React 19, TypeScript, Tailwind CSS |
| Auth       | NextAuth v5, bcryptjs password hashing, email verification codes (Resend / Nodemailer) |
| Data       | Prisma ORM 5, PostgreSQL |
| Documents  | @react-pdf/renderer (signed PDF export), Zod validation |
| Containers | Multi-stage Docker build (Alpine), Docker Compose |
| Orchestration | Kubernetes manifests (`k8s/`), Jenkins pipeline (`jenkinsfile`, `jenkins-files/`) |

### Data model (Prisma)

- **User** — account, owns clients & contracts
- **Client** — contact name, company, email (per-user)
- **Contract** — `MILESTONE` or `STANDARD_LEGAL` type; `DRAFT → SENT → ACCEPTED → COMPLETED` lifecycle; unique public signing token; dual signature blocks (initiator + counterparty) with timestamps
- **Milestone** — title, description, percentage, amount, due date, status (`PENDING → IN_PROGRESS → COMPLETED → PAID`)
- **AuditLog** — verifiable event trail per contract
- **VerificationToken** — email verification codes

---

## DevOps & deployment

The application is containerised and delivered through an automated pipeline —
app and deployment both built by the author.

**Pipeline (as documented in `jenkinsfile` / `jenkins-files/`):**

1. **Checkout** — declarative SCM checkout from GitHub.
2. **Build** — multi-stage Alpine Docker build; Prisma engines compiled for
   musl (`linux-musl-openssl-3.0.x` binary targets).
3. **Deliver** — image pushed to Docker Hub (`shujaahmed198/ratestack-app`).
4. **Deploy** — rolling deployment to Kubernetes via `k8s/deployment.yaml` +
   `k8s/service.yaml`.
5. **Verify** — health checks against the running deployment.

**Production topology (documented):** AWS EC2 (Ubuntu) host running a
multi-node Kind (Kubernetes-in-Docker) cluster, with an Ingress-NGINX gateway
routing public HTTP traffic to the Next.js pods. Infrastructure provisioning is
captured in Terraform (EC2 instance, security groups for SSH/HTTP/HTTPS/
Jenkins/SonarQube). The pipeline design includes SonarQube (SAST), OWASP
Dependency-Check (SCA), and Trivy container scanning gates.

### Run it locally

```bash
# 1. Clone
git clone https://github.com/ShujaAhmed786/RateStack-App.git
cd RateStack-App

# 2. Configure
cp .env.example .env   # set DATABASE_URL to your PostgreSQL instance
# Required: DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY (or SMTP settings)

# 3. Install & migrate
npm install
npx prisma migrate deploy

# 4. Start
npm run dev   # → http://localhost:3000
```

### Run with Docker Compose

```bash
docker compose up --build   # app + PostgreSQL
```

---

## Project structure

```
├── src/
│   ├── app/            # Next.js App Router: pages, layouts, API routes
│   │   ├── c/          # Public signing links (/c/[token])
│   │   ├── dashboard/  # Authenticated contracts dashboard
│   │   └── login/      # Sign in / create account
│   ├── lib/            # Prisma client singleton & utilities
│   └── hooks/          # Shared React hooks
├── prisma/
│   ├── schema.prisma   # Data models
│   └── seed.ts         # Demo seed data
├── k8s/                # Kubernetes manifests (deployment, service)
├── jenkins-files/      # CI/CD pipeline resources
├── jenkinsfile         # Pipeline definition
├── Dockerfile          # Multi-stage production build
├── docker-compose.yml  # Local app + database
└── docs/screenshots/   # Live-app walkthrough screenshots
```

---

## Author

Built by **Shuja Ahmed** — full-stack development and DevOps/cloud deployment.
Part of an ongoing DevOps & cloud portfolio.
