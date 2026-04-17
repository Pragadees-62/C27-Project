# GitHub Webhook → Jenkins Auto-Deploy Setup

This guide shows how to configure GitHub to automatically trigger Jenkins builds on every push.

---

## Prerequisites

- Jenkins server running and accessible (e.g., `http://your-jenkins-server:8080`)
- GitHub repository: `https://github.com/Pragadees-62/C27-Project`
- Jenkins has the **GitHub Plugin** installed (usually pre-installed)

---

## Step 1: Configure Jenkins

### 1.1 Install GitHub Plugin (if not already installed)

1. Go to **Jenkins Dashboard** → **Manage Jenkins** → **Manage Plugins**
2. Click **Available** tab
3. Search for **GitHub Plugin**
4. Check the box and click **Install without restart**

### 1.2 Create Jenkins Credentials for GitHub

1. Go to **Manage Jenkins** → **Manage Credentials**
2. Click **(global)** domain
3. Click **Add Credentials**
4. Fill in:
   - **Kind:** Username with password
   - **Username:** Your GitHub username
   - **Password:** Your GitHub Personal Access Token (PAT)
     - Generate PAT at: https://github.com/settings/tokens
     - Required scopes: `repo`, `admin:repo_hook`
   - **ID:** `github-credentials`
   - **Description:** GitHub Access Token
5. Click **Create**

### 1.3 Configure Jenkins Job

1. Go to your Jenkins job (or create a new **Pipeline** job)
2. Under **Build Triggers**, check:
   - ☑ **GitHub hook trigger for GITScm polling**
3. Under **Pipeline**, set:
   - **Definition:** Pipeline script from SCM
   - **SCM:** Git
   - **Repository URL:** `https://github.com/Pragadees-62/C27-Project.git`
   - **Credentials:** Select `github-credentials`
   - **Branch Specifier:** `*/main`
   - **Script Path:** `Jenkinsfile`
4. Click **Save**

---

## Step 2: Configure GitHub Webhook

### 2.1 Get Jenkins Webhook URL

Your Jenkins webhook URL format:
```
http://your-jenkins-server:8080/github-webhook/
```

**Important:** The trailing `/` is required.

### 2.2 Add Webhook in GitHub

1. Go to your GitHub repo: https://github.com/Pragadees-62/C27-Project
2. Click **Settings** (top right)
3. Click **Webhooks** (left sidebar)
4. Click **Add webhook**
5. Fill in:
   - **Payload URL:** `http://your-jenkins-server:8080/github-webhook/`
   - **Content type:** `application/json`
   - **Secret:** (leave blank for now, or set a secret and configure it in Jenkins)
   - **Which events would you like to trigger this webhook?**
     - Select **Just the push event**
   - ☑ **Active**
6. Click **Add webhook**

### 2.3 Test the Webhook

1. GitHub will immediately send a test ping
2. Check the webhook page — you should see a green ✓ next to the recent delivery
3. If you see a red ✗, click it to see the error details:
   - **Connection refused** → Jenkins is not accessible from the internet
   - **404 Not Found** → Wrong URL (check the trailing `/`)
   - **403 Forbidden** → Jenkins security settings blocking webhooks

---

## Step 3: Make Jenkins Accessible (if behind firewall)

If your Jenkins is on `localhost` or behind a firewall, GitHub can't reach it. Options:

### Option A: Use ngrok (for testing)

```bash
ngrok http 8080
```

Copy the `https://xxxx.ngrok.io` URL and use:
```
https://xxxx.ngrok.io/github-webhook/
```

### Option B: Deploy Jenkins on a public server

- Use AWS EC2, DigitalOcean, or any cloud VM
- Open port 8080 in security groups/firewall
- Use the public IP: `http://your-public-ip:8080/github-webhook/`

### Option C: Use GitHub Actions instead

If Jenkins is not publicly accessible, use GitHub Actions (see `GITHUB_ACTIONS_SETUP.md`).

---

## Step 4: Test the Full Flow

1. Make a small change to any file (e.g., add a comment to `README.md`)
2. Commit and push:
   ```bash
   git add README.md
   git commit -m "test: trigger webhook"
   git push origin main
   ```
3. Check Jenkins — a new build should start automatically within seconds
4. Check the build console output to see the pipeline stages

---

## Troubleshooting

### Webhook shows "Connection refused"
- Jenkins is not accessible from the internet
- Use ngrok or deploy Jenkins on a public server

### Webhook shows "404 Not Found"
- Wrong URL — make sure it ends with `/github-webhook/` (with trailing slash)

### Jenkins build doesn't start
- Check **Manage Jenkins** → **System Log** for errors
- Verify the job has **GitHub hook trigger for GITScm polling** enabled
- Check Jenkins firewall/security settings

### Build fails at "Build Docker Images"
- Docker is not installed on the Jenkins agent
- Jenkins user doesn't have Docker permissions — add to docker group:
  ```bash
  sudo usermod -aG docker jenkins
  sudo systemctl restart jenkins
  ```

### Build fails at "Health Check"
- Backend container didn't start — check logs:
  ```bash
  docker logs sms-backend
  ```
- MongoDB connection failed — check `MONGO_URI` in docker-compose.yml

---

## Pipeline Stages Explained

1. **Checkout** — Pulls latest code from GitHub
2. **Install Backend Dependencies** — Runs `npm ci` in backend/
3. **Lint & Validate** — Checks JS syntax with `node --check`
4. **Build Docker Images** — Builds backend + frontend + MongoDB containers
5. **Deploy Containers** — Stops old containers, starts new ones
6. **Health Check** — Hits `/api/teachers` to verify backend is responding

---

## Environment Variables

Set these in Jenkins job configuration or docker-compose.yml:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — Secret key for JWT tokens
- `TEACHER_CODE` — Secret code for teacher registration
- `PORT` — Backend port (default: 3000)

---

## Security Notes

- **Never commit `.env` files** — they contain secrets
- Use Jenkins credentials store for sensitive values
- Set a webhook secret in GitHub and validate it in Jenkins for production
- Use HTTPS for Jenkins in production (Let's Encrypt + Nginx reverse proxy)

---

## Next Steps

- Set up SSL/TLS for Jenkins (use Nginx + Certbot)
- Add automated tests to the pipeline
- Set up Slack/email notifications on build failure
- Use Jenkins Blue Ocean for a better UI
