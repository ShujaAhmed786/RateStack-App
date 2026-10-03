# RateStack — Freelance & Agency Agreement Engine

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?logo=jenkins)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?logo=terraform)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)

**Lock contract scope, milestones, and signatures.** RateStack is a full-stack web
application for creating client agreements with auto-balancing milestones,
verifiable audit trails, and instant e-signable legal documents — built and
deployed end-to-end as a DevOps portfolio project.

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
![RateStack landing page](docs/screenshots/01-landing-page.jpg)

### 2. Sign up
New accounts are created with full name, email, and password, verified via an
email verification code.
![Sign up page](docs/screenshots/02-signup-page.jpg)

### 3. Sign in
![Sign in page](docs/screenshots/03-login-page.jpg)

### 4. Contracts dashboard
Post-login landing view: every contract as a card with status badge
(`SENT` / `ACCEPTED`), total value, client, milestone roadmap, and progress.
![Contracts dashboard](docs/screenshots/04-dashboard.jpg)

### 5. Adding a new client
Clients are created inline in the contract studio (Step 1): contact name,
company, and email.
![New client form](docs/screenshots/05-new-client.jpg)

### 6. Creating a contract
Step 1 of the studio: pick the target client, set the contract title, and write
the scope of work & acceptance criteria.
![New contract form](docs/screenshots/06-new-contract.jpg)

### 7. Publishing
On publish the contract is cryptographically registered and a public client
sign URL is issued.
![Contract published](docs/screenshots/07-contract-published.jpg)

### 8. Client signing view
The public link opens the sealed agreement: parties, statement of work, and the
milestone schedule with payment allocations.
![Signing view](docs/screenshots/08-signing-view.jpg)

### 9. Signature protocol
Party A signs at publish time; Party B confirms consent, types their legal
name, and accepts — no account required.
![Signature protocol](docs/screenshots/09-signature-protocol.jpg)

### 10. Executed agreement
Once both parties sign, the agreement is locked, timestamped, and available as
a signed PDF download.
![Signed contract](docs/screenshots/10-signed-contract.jpg)

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

The application is containerised and delivered through an automated
DevSecOps pipeline — app and deployment both built by the author. Production
runs on a single AWS EC2 (Ubuntu) host that runs Docker, a 3-node Kind
(Kubernetes-in-Docker) cluster, Jenkins, and an Ingress-NGINX gateway.

```
[Developer] --git push--> [GitHub] --webhook--> [Jenkins on EC2]
                                                     |
                       +-----------------------------+-----------------------------+
                       | Jenkins DevSecOps pipeline (jenkinsfile)                |
                       |  1. Checkout                                            |
                       |  2. Security gate (parallel):                           |
                       |     - SAST: SonarQube scan of src/                      |
                       |     - SCA: OWASP Dependency-Check on package.json       |
                       |  3. Containerize & scan: multi-stage Docker build,      |
                       |     Trivy image scan, push to Docker Hub                |
                       |  4. Deploy: rolling update on the Kind cluster          |
                       +-----------------------------+-----------------------------+
                                                     |
                                                     v
                                   [Kind cluster: ratestack-cluster]
                                    - control-plane: Ingress-NGINX (:80)
                                    - workers: ratestack-deployment (Next.js :3000)
                                               ratestack-service (NodePort 30085)
```

Pipeline stage implementations live in the Jenkins Shared Library:
`jenkins-files/Jenkins-Shared-Library/vars/` (`runSonarQube.groovy`,
`runDependencyCheck.groovy`, `buildAndScanDocker.groovy`,
`deployToKind.groovy`). Images are published to Docker Hub as
`shujaahmed198/ratestack-app`.

---

### Deploying on AWS, step by step

#### Prerequisites

- An AWS account with credentials configured (`aws configure`)
- Terraform >= 1.5
- An SSH key pair (you only need the public key file)
- A Docker Hub account + Personal Access Token (PAT with read/write)

#### Step 1 — Provision the EC2 host with Terraform

`terraform/` provisions the SSH key pair, the security group
(ports 22, 80, 443, 8080 for Jenkins, 9000 for SonarQube) and the EC2
instance (Ubuntu, 40 GB gp3). Its `user_data` bootstrap already installs
Docker, `kind`, and `kubectl` on first boot.

```bash
cd terraform
terraform init
terraform apply \
  -var="aws_region=ap-south-1" \
  -var="ami_id=ami-xxxxxxxxxxxxxxxxx" \   # Ubuntu 22.04 LTS AMI in your region
  -var="instance_type=t3.xlarge" \
  -var="public_key_path=~/.ssh/id_rsa.pub"
```

Note the instance's public IP from the output, then SSH in:

```bash
ssh -i ~/.ssh/id_rsa ubuntu@<EC2-PUBLIC-IP>
```

#### Step 2 — Docker, kind & kubectl inside the EC2 instance

The Terraform `user_data` script installs these automatically. Verify:

```bash
docker --version && kind --version && kubectl version --client
```

If you ever need to install them manually on a fresh Ubuntu 22.04 host:

```bash
# Docker
sudo apt-get update -y
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker ubuntu

# kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.27.0/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x ./kubectl && sudo mv ./kubectl /usr/local/bin/kubectl
```

#### Step 3 — Create the Kind cluster

```bash
kind create cluster --name ratestack-cluster --config k8s/kind-config.yaml
```

(`k8s/kind-config.yaml` defines the 3-node topology — 1 control-plane,
2 workers — with host ports 80/443 mapped for the Ingress controller.)

Install the Ingress-NGINX controller and wait until it's ready:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

#### Step 4 — Run Jenkins (Docker) and bridge it to the Kind network

```bash
docker run -d \
  --name jenkins \
  --restart always \
  -p 8080:8080 -p 50000:50000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

Jenkins runs in its own container, so it can't reach the Kind API by
default. Attach it to Kind's Docker network and point its kubeconfig at
the control-plane container IP:

```bash
# 1. Attach Jenkins to the kind network
docker network connect kind jenkins

# 2. Control-plane container IP
KIND_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ratestack-cluster-control-plane)

# 3. Copy kubeconfig into Jenkins and patch the server address
docker exec -u 0 jenkins mkdir -p /var/jenkins_home/.kube
sudo docker cp ~/.kube/config jenkins:/var/jenkins_home/.kube/config
docker exec -u 0 jenkins chown -R jenkins:jenkins /var/jenkins_home/.kube
docker exec -u 0 jenkins sed -i -E "s|server: https://.*:6443|server: https://${KIND_IP}:6443|g" /var/jenkins_home/.kube/config
```

#### Step 5 — Configure Jenkins

1. Open `http://<EC2-PUBLIC-IP>:8080` and complete the setup wizard.
2. **Credentials** — Manage Jenkins → Credentials → System → Global:
   add a *Username with password* credential with ID `dockerhub-creds`
   (Docker Hub username + PAT).
3. **Shared library** — Manage Jenkins → System → Global Pipeline Libraries:
   add `jenkins-shared-library`, pointing at this repository's
   `jenkins-files/Jenkins-Shared-Library` (the `vars/` steps used by the
   `jenkinsfile`).
4. **SonarQube** — configure the SonarQube server (`SonarQube`) and scanner
   tool (`sonar-scanner`) under Manage Jenkins → System / Global Tool
   Configuration, matching the names in the `jenkinsfile` environment block.

#### Step 6 — Create the app secrets and apply the manifests

```bash
kubectl create secret generic ratestack-secrets \
  --from-literal=DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/ratestack' \
  --from-literal=AUTH_SECRET='your-nextauth-secret'

kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

#### Step 7 — Create the pipeline job and deploy

1. In Jenkins: New Item → Pipeline → name it `RateStack-Pipeline`.
2. Set *Pipeline script from SCM*, pointing at your fork of this repo
   (script path: `jenkinsfile`).
3. Click **Build Now**.

The pipeline checks out the code, runs SonarQube + OWASP scans in
parallel, builds the multi-stage Docker image, scans it with Trivy,
pushes `shujaahmed198/ratestack-app:<BUILD_NUMBER>` to Docker Hub, loads
it into the Kind nodes, and performs a rolling deployment with rollout
verification.

#### Step 8 — Verify

```bash
kubectl get pods,svc,ingress -o wide
curl -I http://localhost:80
```

Then open `http://<EC2-PUBLIC-IP>` in a browser — the RateStack app is
served through the Ingress-NGINX gateway.

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
├── k8s/                # Kubernetes manifests
│   ├── kind-config.yaml  # 3-node Kind cluster (control-plane + 2 workers, hostPorts 80/443)
│   ├── deployment.yaml   # RateStack app deployment
│   ├── service.yaml      # NodePort service (30085)
│   └── ingress.yaml      # Ingress-NGINX routing (port 80 → service)
├── terraform/          # AWS provisioning (EC2 host, security groups)
│   ├── main.tf         # Key pair, SG (22/80/443/8080/9000), EC2 + Docker/kind/kubectl bootstrap
│   └── variables.tf    # Region, AMI, instance type, public key path
├── jenkins-files/      # Jenkins Shared Library (vars/*.groovy pipeline steps)
├── jenkinsfile         # Pipeline definition (security gate → build/scan → deploy)
├── Dockerfile          # Multi-stage production build
├── docker-compose.yml  # Local app + database
└── docs/screenshots/   # Live-app walkthrough screenshots
```

---

## Author

Built by **Shuja Ahmed** — full-stack development and DevOps/cloud deployment.
Part of an ongoing DevOps & cloud portfolio.
