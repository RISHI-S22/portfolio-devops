
# Enterprise DevOps Portfolio: Cloud-Native Deployment & Observability Architecture

This repository contains the end-to-end DevOps implementation for a containerized Node.js web application featuring automated configuration, zero-trust MFA authentication, dual-tier container orchestration (AWS EC2 & Kubernetes), and a dedicated telemetry/observability pipeline (ELK Stack & Prometheus/Grafana).

---

## System Architecture

\`\`\`text
                                  +------------------------------------+
                                  |         Internet / Users           |
                                  +-----------------+------------------+
                                                    |
                                          HTTP:80   v
+---------------------------------------------------+---------------------------------------------------+
| AWS Cloud Infrastructure (EC2: 13.127.233.58)                                                         |
|                                                                                                       |
|   +-----------------------------------------------------------------------------------------------+   |
|   | Docker Container: portfolio-app                                                               |   |
|   |   - Express.js Portfolio Website                                                              |   |
|   |   - Google OAuth 2.0 Flow                                                                     |   |
|   |   - TOTP MFA Verification Engine (Speakeasy / QR Authenticator)                               |   |
|   |   - Morgan Logging Engine -> stdout/stderr                                                    |   |
|   +---------------------------------------+-------------------------------------------------------+   |
|                                           | Container JSON Logs                                       |
|                                           v                                                           |
|   +---------------------------------------+-------------------------------------------------------+   |
|   | Filebeat Agent (Systemd)                                                                      |   |
|   |   - Path: /var/lib/docker/containers/*/*.log                                                  |   |
|   |   - Output: 127.0.0.1:5044 (Encrypted Reverse SSH Tunnel)                                     |   |
|   +---------------------------------------+-------------------------------------------------------+   |
+-------------------------------------------|-----------------------------------------------------------+
                                            |
                         Port 5044 Tunnel   v (ssh -R 5044:localhost:5044)
+-------------------------------------------+-----------------------------------------------------------+
| Local Monitoring Platform (VMware Ubuntu VM: 192.168.53.128)                                          |
|                                                                                                       |
|   +---------------------------------------+-------------------------------------------------------+   |
|   | Logstash (Port 5044)                                                                          |   |
|   |   - Beats Input Plugin                                                                        |   |
|   |   - Output: Elasticsearch HTTP (:9200)                                                        |   |
|   +---------------------------------------+-------------------------------------------------------+   |
|                                           |                                                           |
|                                           v                                                           |
|   +---------------------------------------+-------------------------------------------------------+   |
|   | Elasticsearch 7.17.18 (Port 9200)                                                             |   |
|   |   - Cluster Mode: single-node                                                                 |   |
|   |   - Indices: logstash-*                                                                       |   |
|   +-------------------+---------------------------------------------------------------------------+   |
|                       |                                                                               |
|                       v                                                                               |
|   +-------------------+-------------------+       +-----------------------------------------------+   |
|   | Kibana 7.17.18 (Port 5601)            |       | Grafana Telemetry (Port 3001)                 |   |
|   |   - Web UI / Discover Visualizer      |       |   - Dashboard Server                          |   |
|   |   - Morgan Access Log Stream          |       |   - Host Metrics & Telemetry                  |   |
|   +-------------------+-------------------+       +-----------------------+-----------------------+   |
+-----------------------|---------------------------------------------------|---------------------------+
                        |                                                   |
                        +-------------------------+-------------------------+
                                                  | Port Access / LAN
                                                  v
+-------------------------------------------------+-----------------------------------------------------+
| Developer Workstation (Windows Host)                                                                  |
|                                                                                                       |
|   ├── Web Browser Access:                                                                             |
|   |     - Production App: http://13.127.233.58/protected/dashboard                                    |
|   |     - Log Analysis:   http://192.168.53.128:5601 (Kibana)                                         |
|   |     - Telemetry:      http://192.168.53.128:3001 (Grafana)                                        |
|   |                                                                                                   |
|   └── Minikube Local Cluster (Kubernetes Deployment & NodePort Service)                               |
|         - Pods: portfolio-deployment (2 Replicas)                                                     |
|         - Service: portfolio-service (NodePort 30080 -> Container 8080)                               |
+-------------------------------------------------------------------------------------------------------+
\`\`\`

---

## Project Structure

\`\`\`text
portfolio-devops/
├── k8s-deployment.yaml      # Kubernetes Deployment and Service definitions
├── Dockerfile               # Multi-stage container build definition
├── package.json             # Node.js dependencies and script entries
├── server.js                # Core Express application and route handlers
├── README.md                # Project architecture and execution manual
└── .gitignore               # Ignored local runtime artifacts and keys
\`\`\`
"@
