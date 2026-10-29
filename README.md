# Enterprise DevOps Portfolio
### Cloud-Native Deployment, Security & Observability

An end-to-end DevOps project demonstrating containerization, cloud deployment, Kubernetes orchestration, multi-factor authentication, centralized log management, and infrastructure monitoring.

The project deploys a Node.js portfolio application on AWS EC2 using Docker, with a local Kubernetes deployment for orchestration testing and a dedicated observability stack powered by the Elastic Stack, Prometheus, and Grafana.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Infrastructure & Deployment](#infrastructure--deployment)
- [Observability Pipeline](#observability-pipeline)
- [Security Architecture](#security-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Access Points](#access-points)
- [Validation & Testing](#validation--testing)
- [Future Enhancements](#future-enhancements)
- [Disclaimer](#disclaimer)

---

## Overview

This repository demonstrates how a web application can be deployed and monitored using a combination of cloud infrastructure, container technologies, security mechanisms, and observability tools.

The application is built with Node.js and Express.js, containerized using Docker, and deployed to an AWS EC2 instance. Google OAuth 2.0 provides authentication, while Time-Based One-Time Password (TOTP) verification adds a second authentication factor.

Application logs are collected using Filebeat and forwarded through an SSH reverse tunnel to a local monitoring environment. Logstash processes the incoming events and forwards them to Elasticsearch for indexing and analysis. Kibana provides log exploration, while Grafana supports infrastructure and telemetry visualization.

A separate Minikube environment demonstrates Kubernetes deployment using a two-replica Deployment and a NodePort Service.

### Project Highlights

- **Cloud deployment:** Containerized Node.js application hosted on AWS EC2.
- **Containerization:** Multi-stage Docker build for packaging the application.
- **Authentication:** Google OAuth 2.0 and TOTP-based MFA.
- **Orchestration:** Kubernetes Deployment with two replicas and NodePort networking.
- **Centralized logging:** Filebeat, Logstash, Elasticsearch, and Kibana.
- **Monitoring:** Grafana dashboards for host metrics and telemetry.
- **Secure log transport:** SSH reverse tunneling between the cloud host and the local monitoring environment.

---

## System Architecture

```text
                         INTERNET / USERS
                                |
                                | HTTP :80
                                v
                 +------------------------------+
                 |       AWS EC2 INSTANCE       |
                 |                              |
                 |   Docker: portfolio-app      |
                 |   +----------------------+   |
                 |   | Node.js / Express.js |   |
                 |   | Google OAuth 2.0     |   |
                 |   | TOTP MFA             |   |
                 |   | Morgan HTTP Logging  |   |
                 |   +----------+-----------+   |
                 |              |               |
                 |        Container Logs        |
                 |              v               |
                 |          Filebeat            |
                 +--------------+---------------+
                                |
                                | SSH Reverse Tunnel
                                | Beats :5044
                                v
                 +------------------------------+
                 |   LOCAL UBUNTU MONITORING VM |
                 |                              |
                 |  Logstash :5044              |
                 |       |                      |
                 |       v                      |
                 |  Elasticsearch :9200         |
                 |       |                      |
                 |       v                      |
                 |  Kibana :5601                |
                 |                              |
                 |  Grafana :3001               |
                 |  Host Metrics / Telemetry    |
                 +--------------+---------------+
                                |
                                v
                     DEVELOPER WORKSTATION
                     Browser / Dashboards

                 LOCAL KUBERNETES ENVIRONMENT
                                |
                                v
                         Minikube Cluster
                                |
                      +---------+---------+
                      |                   |
                      v                   v
                Application Pod     Application Pod
                      |                   |
                      +---------+---------+
                                |
                         NodePort :30080
```

### Architecture Flow

1. Users access the portfolio application hosted on AWS EC2.
2. Docker runs the Node.js application in an isolated container.
3. Express.js handles application routes, authentication, and HTTP request logging.
4. Filebeat collects container log files and forwards events through an SSH reverse tunnel.
5. Logstash receives Beats events, processes them, and sends them to Elasticsearch.
6. Kibana enables searching, filtering, and investigating indexed application logs.
7. Grafana visualizes the configured host metrics and telemetry.
8. Minikube provides a separate Kubernetes environment for testing replicated application deployments.

**Deployment model:** AWS EC2 is the cloud-hosted application environment; Minikube is the local Kubernetes environment; the Ubuntu VM hosts the observability services.

---

## Key Features

### 1. Containerized Application

- Node.js and Express.js application.
- Docker-based packaging and deployment.
- Multi-stage Dockerfile for a streamlined production image.
- HTTP request logging with Morgan.
- Environment-based application configuration.

### 2. Authentication & Access Control

- Google OAuth 2.0 authentication flow.
- TOTP-based multi-factor authentication.
- QR-code-based authenticator enrollment.
- Protected dashboard routes.
- Separation between authentication and application access.

### 3. Kubernetes Orchestration

- Kubernetes Deployment configuration.
- Two application replicas.
- NodePort Service for application access.
- Local cluster testing with Minikube.
- Declarative infrastructure configuration through YAML.

### 4. Centralized Log Management

- Filebeat for container log collection.
- Logstash Beats input for receiving log events.
- Elasticsearch for indexing and storing logs.
- Kibana for querying and visualizing log data.
- SSH reverse tunneling for forwarding events from EC2 to the local environment.

### 5. Monitoring & Telemetry

- Grafana dashboard server.
- Host-level metrics and telemetry visualization.
- Centralized operational visibility.
- Foundation for monitoring resource utilization and application behavior.

---

## Technology Stack

| Category | Technologies |
|---|---|
| Application | Node.js, Express.js |
| Authentication | Google OAuth 2.0, TOTP, Speakeasy, QR codes |
| Containerization | Docker, multi-stage builds |
| Cloud Infrastructure | AWS EC2 |
| Orchestration | Kubernetes, Minikube |
| Log Collection | Filebeat |
| Log Processing | Logstash |
| Log Storage & Search | Elasticsearch 7.17.18 |
| Log Visualization | Kibana 7.17.18 |
| Monitoring | Grafana, Prometheus where configured |
| Operating Systems | Ubuntu Linux, Windows |
| Networking | HTTP, Docker networking, SSH reverse tunneling |
| Configuration | YAML, environment variables |
| Testing & Validation | Browser-based testing, API and deployment checks |

*Prometheus is part of the intended monitoring stack; verify that its server and scrape targets are configured before claiming active Prometheus-based metrics collection.*

---

## Infrastructure & Deployment

### AWS EC2 — Cloud Application

The production-style application runs in a Docker container on an AWS EC2 instance.

**Responsibilities:**
- Host the Express.js application.
- Handle incoming HTTP traffic.
- Manage authentication and protected routes.
- Write application logs to standard output and standard error.
- Expose container log files for collection by Filebeat.

The EC2 public address used during development is:

`13.127.233.58`

> Replace this address with your current deployment address if the instance IP changes. Avoid committing private keys, credentials, OAuth secrets, or other sensitive configuration.

### Docker — Application Containerization

The Dockerfile defines the application image and its runtime environment.

A multi-stage build can separate dependency installation and build steps from the final runtime image, reducing unnecessary files and improving image maintainability.

Build and run the application:

```bash
docker build -t portfolio-app .
docker run -d \
  --name portfolio-app \
  -p 80:8080 \
  --env-file .env \
  portfolio-app
```

**Important:** This port mapping assumes the application listens on port `8080` inside the container. Adjust it to match the actual port configured in `server.js`. Ensure the required environment variables are defined before starting the container.

### Kubernetes — Local Deployment

The `k8s-deployment.yaml` file defines the Kubernetes Deployment and Service.

Start Minikube and deploy the application:

```bash
minikube start

kubectl apply -f k8s-deployment.yaml

kubectl get deployments
kubectl get pods
kubectl get services
```

Check the deployment rollout:

```bash
kubectl rollout status deployment/portfolio-deployment
```

Inspect application logs:

```bash
kubectl logs deployment/portfolio-deployment
```

Access the application through Minikube:

```bash
minikube service portfolio-service
```

The configured NodePort is `30080`, forwarding traffic to the application's container port `8080`.

**Note:** The Kubernetes image must be available to the cluster. For a locally built image, configure Minikube's image environment or load the image into the cluster before deploying.

---

## Observability Pipeline

### End-to-End Log Flow

```text
Express.js + Morgan
        |
        v
Docker Container Logs
        |
        v
Filebeat Agent
        |
        v
SSH Reverse Tunnel
        |
        v
Logstash Beats Input :5044
        |
        v
Elasticsearch :9200
        |
        v
Kibana :5601
```

### Filebeat — Log Collection

Filebeat reads Docker container log files from the EC2 host.

Configured log path:

```text
/var/lib/docker/containers/*/*.log
```

The agent forwards collected events to the Logstash endpoint through the SSH reverse tunnel.

### Logstash — Event Processing

Logstash listens for Beats events on port `5044`. It can parse, normalize, enrich, and route incoming events before indexing them in Elasticsearch.

### Elasticsearch — Storage and Search

Elasticsearch stores searchable log events in indices matching the `logstash-*` naming convention.

The development environment uses Elasticsearch `7.17.18` in single-node mode.

### Kibana — Log Analysis

Kibana provides a visual interface for exploring application logs.

Example investigations include:

- Filtering HTTP request logs by status code.
- Searching for application errors.
- Examining request activity over time.
- Investigating authentication failures.
- Correlating events by timestamp and available fields.

### Grafana — Metrics Visualization

Grafana provides dashboards for host metrics and telemetry from configured data sources.

Depending on the installed exporters and integrations, dashboards can be extended to display CPU usage, memory utilization, disk activity, network traffic, and application-level metrics.

**Metrics distinction:** Grafana is a visualization platform, not a metrics collector. A working Prometheus integration requires a running Prometheus server, scrape configuration, and suitable exporters or instrumentation.

---

## Security Architecture

Security is addressed through authentication, container isolation, configuration management, and protected log transport.

### Authentication

- Google OAuth 2.0 for identity authentication.
- TOTP verification as a second authentication factor.
- Protected application routes.
- QR-code enrollment for compatible authenticator applications.

### Infrastructure and Transport

- Docker container isolation.
- SSH reverse tunneling for log transport.
- Environment variables for sensitive application configuration.
- Controlled access to monitoring endpoints and cloud services.

### Recommended Production Hardening

- Enforce HTTPS using a reverse proxy and valid TLS certificates.
- Restrict SSH access and disable password-based SSH authentication where appropriate.
- Use least-privilege IAM policies and avoid embedding AWS credentials in images.
- Keep OAuth secrets, session secrets, and MFA-related secrets out of source control.
- Use secure, HTTP-only, SameSite cookies and appropriate session expiration.
- Apply rate limiting to authentication endpoints.
- Restrict Elasticsearch, Kibana, Grafana, and Logstash access to trusted networks.
- Enable authentication and TLS for the Elastic Stack.
- Patch dependencies and use vulnerability scanning for container images.
- Configure log rotation, retention policies, and backups.
- Avoid logging passwords, access tokens, session cookies, or TOTP secrets.

The architecture demonstrates security-related controls but should not be described as fully zero-trust or production-hardened without additional enforcement, verification, and testing.

---

## Project Structure

```text
portfolio-devops/
├── k8s-deployment.yaml      # Kubernetes Deployment and Service
├── Dockerfile               # Multi-stage Docker build
├── package.json             # Dependencies and npm scripts
├── server.js                # Express application and routes
├── README.md                # Architecture and setup documentation
└── .gitignore               # Excluded local files and secrets
```

Additional deployment assets, such as Filebeat configuration, Logstash pipelines, Prometheus scrape configuration, Grafana dashboards, and Elasticsearch settings, can be added as the monitoring environment is formalized.

---

## Getting Started

### Prerequisites

Install or provision the following components as needed:

- Node.js and npm.
- Docker Engine or Docker Desktop.
- An AWS EC2 instance for cloud deployment.
- Minikube and `kubectl` for local Kubernetes testing.
- An Ubuntu VM for the monitoring stack.
- Elasticsearch, Logstash, Kibana, and Grafana.
- Filebeat on the application host.
- Prometheus and suitable exporters if Prometheus-based monitoring is enabled.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd portfolio-devops
```

Replace `<YOUR_REPOSITORY_URL>` with the actual Git repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a local `.env` file containing the variables required by `server.js`.

Typical configuration may include:

```dotenv
PORT=8080
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=replace_with_a_strong_random_secret
```

Add any additional variables required by the implementation, including OAuth callback URLs and MFA-related settings.

Do not commit the `.env` file.

### 4. Run Locally

```bash
npm start
```

If the project does not define a `start` script, use the entry point directly:

```bash
node server.js
```

Open `http://localhost:8080` if the application is configured to listen on port `8080`.

### 5. Build the Docker Image

```bash
docker build -t portfolio-app .
```

Run the image using the port mapping appropriate to the configured container port.

### 6. Deploy to Kubernetes

```bash
minikube start
kubectl apply -f k8s-deployment.yaml
kubectl get pods -o wide
kubectl get svc portfolio-service
```

### 7. Configure Observability

On the monitoring VM:

1. Start Elasticsearch and verify that it accepts requests.
2. Configure Logstash with a Beats input on port `5044`.
3. Configure the Logstash Elasticsearch output.
4. Configure Filebeat on the EC2 host to read Docker logs and send events through the tunnel.
5. Start and verify the SSH reverse tunnel.
6. Open Kibana and select the appropriate `logstash-*` data view.
7. Configure Grafana data sources and dashboards.
8. If using Prometheus, configure its scrape targets and verify that metrics are being collected.

---

## Access Points

The following addresses reflect the development environment described in this project. They are not guaranteed to remain available.

| Component | Address | Purpose |
|---|---|---|
| Portfolio application | `http://13.127.233.58/` | Application entry point |
| Protected dashboard | `http://13.127.233.58/protected/dashboard` | Authenticated dashboard |
| Kibana | `http://192.168.53.128:5601` | Centralized log analysis |
| Grafana | `http://192.168.53.128:3001` | Metrics dashboards |
| Elasticsearch | `http://192.168.53.128:9200` | Search and indexed log data |
| Local Kubernetes service | Minikube service URL | Application deployed through Kubernetes |

The `192.168.53.128` address is a private-network VM address. It is generally reachable only from a compatible local or virtual network, or through an explicitly configured secure connection.

Do not expose Elasticsearch or other administrative monitoring services directly to the public internet without appropriate access controls.

---

## Validation & Testing

Use the following checks to validate each part of the deployment.

### Application and Docker

```bash
docker ps
docker logs portfolio-app
docker inspect portfolio-app
```

Verify that the application starts successfully, routes respond as expected, and logs are being generated.

### Kubernetes

```bash
kubectl get deployments,pods,services
kubectl describe deployment portfolio-deployment
kubectl rollout status deployment/portfolio-deployment
```

Confirm that both replicas are ready and that the Service routes traffic to the intended pods.

### Logging

- Confirm Filebeat can read the container logs.
- Verify that the SSH tunnel is active.
- Confirm that Logstash receives Beats events.
- Check that new Elasticsearch documents are indexed.
- Search for recent events in Kibana.

### Monitoring

- Confirm that Grafana can connect to its configured data sources.
- Verify that dashboard panels display current data.
- If Prometheus is configured, check target health and query representative metrics.

### Authentication

- Test successful and unsuccessful Google OAuth flows.
- Verify that protected routes reject unauthenticated requests.
- Test valid, invalid, and expired TOTP codes.
- Verify session expiration and logout behavior.

---

## Future Enhancements

Potential next steps to improve the project's reliability, scalability, and production readiness:

- **CI/CD automation:** Add GitHub Actions for linting, testing, Docker image builds, and deployment.
- **Infrastructure as Code:** Provision cloud resources using Terraform.
- **Managed Kubernetes:** Deploy to Amazon EKS for a cloud-native orchestration environment.
- **HTTPS and ingress:** Add TLS termination, domain configuration, and an ingress or reverse proxy.
- **Prometheus instrumentation:** Add Node.js application metrics and configure alert rules.
- **Alerting:** Integrate Grafana Alerting or Alertmanager with email or messaging notifications.
- **Elastic security:** Enable authentication, encrypted transport, and controlled access to log data.
- **Container security:** Add image scanning, dependency auditing, and non-root container execution.
- **Reliability:** Add health checks, readiness and liveness probes, resource requests, and limits.
- **Log lifecycle management:** Configure index lifecycle policies and retention limits.
- **Automated recovery:** Add deployment rollback procedures and backup strategies.
- **Documentation:** Include sanitized configuration examples, deployment screenshots, and test evidence.

---

## Disclaimer

This repository is intended for educational, portfolio, and DevOps demonstration purposes.

The infrastructure addresses, software versions, and configuration details reflect a development environment and may change. Authentication, network security, monitoring integrations, and production readiness should be independently verified before deploying the system for real users.

Never publish private keys, credentials, session secrets, OAuth client secrets, MFA seeds, or sensitive logs in the repository.

---

## Author

**Rishik Srivathsava**

Integrated M.Tech — Computer Science, VIT-AP University

Areas of interest: Cloud Computing, DevOps, Containerization, Kubernetes, Application Security, and Observability.

---

*Built to demonstrate the complete lifecycle of deploying, securing, operating, and monitoring a containerized web application across cloud and local infrastructure.*
