# LuxeOS Production Deployment Guide

**Application:** LuxeOS  
**Target Domain:** `https://client.theluxestudio.in`  
**Hosting Provider:** AWS Amplify Hosting (Gen 2 SSR)  
**Database:** Supabase PostgreSQL  
**Email Engine:** Admin-Managed Direct SMTP (Nodemailer)

---

## Step 1: Set Up Supabase Database (2 Minutes)

1. Go to [https://supabase.com](https://supabase.com) and create a new project (e.g. `luxeos-db`).
2. In your Supabase Dashboard, open the **SQL Editor** tab from the left sidebar.
3. Open [`supabase_schema.sql`](file:///c:/Users/Sonali/Downloads/LuxeOS/supabase_schema.sql), copy its entire content, paste it into the Supabase SQL editor, and click **Run**.
   - This creates all 20 production tables, foreign keys, cascade deletes, and pre-seeds Studio Owner, Nitin, and the Kalajay project.
4. Go to **Project Settings &rarr; Database &rarr; Connection string**:
   - Under **URI**, copy the Connection Pooling string (`DATABASE_URL`).
   - Copy the Direct connection string (`DIRECT_URL`).

---

## Step 2: Push LuxeOS Repository to GitHub

Open PowerShell in `C:\Users\Sonali\Downloads\LuxeOS` and link to your private GitHub repository:

```powershell
git remote add origin https://github.com/your-username/luxeos.git
git branch -M main
git push -u origin main
```

*(All sensitive files like `.env` and SQLite `.db` are already strictly ignored in `.gitignore`).*

---

## Step 3: Deploy to AWS Amplify Hosting

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/amplify).
2. Click **Host web app** &rarr; select **GitHub** &rarr; choose your `luxeos` repository and branch `main`.
3. Amplify will automatically detect Next.js App Router and use [`amplify.yml`](file:///c:/Users/Sonali/Downloads/LuxeOS/amplify.yml).
4. In the **Environment Variables** section, add the following:

| Variable | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres...:6543/postgres?pgbouncer=true` | Supabase Pooler URI |
| `DIRECT_URL` | `postgresql://postgres...:5432/postgres` | Supabase Direct URI |
| `SMTP_ENCRYPTION_KEY` | *(Random 32-character string)* | AES-256 key for encrypted credentials |
| `APP_URL` | `https://client.theluxestudio.in` | Production Base URL |
| `NEXT_PUBLIC_APP_URL` | `https://client.theluxestudio.in` | Production Base URL |
| `NODE_ENV` | `production` | Production environment |

5. Click **Save and Deploy**. AWS Amplify will run:
   ```bash
   npm ci
   npx prisma generate
   npm run build
   ```
   and provision your serverless SSR environment across CloudFront.

---

## Step 4: Map Your Custom Domain (`client.theluxestudio.in`)

1. In the AWS Amplify console, go to **App Settings &rarr; Domain management**.
2. Click **Add domain** &rarr; enter `theluxestudio.in`.
3. Configure the subdomain prefix: `client` &rarr; pointing to branch `main`.
4. Copy the generated CNAME records into your DNS registrar (Cloudflare, GoDaddy, or Namecheap).
5. AWS Amplify will automatically provision a free SSL certificate.

---

## Step 5: Log in to the Production System

Once deployed, visit `https://client.theluxestudio.in`:

- **Studio Leadership Access**:
  - **Rahul Kushwaha (Super Admin)**: Handle `rahul` or `rahul.kushwaha@theluxestudio.in`
  - **Nitin Chandnani (Luxe PM)**: Handle `nitin` or `nitin.chandnani@theluxestudio.in`
- **Client Access**:
  - Each client is onboarded via the Studio Admin Workspace with their dedicated handle (e.g. `luxe_<brand>`).
  - Isolated multi-tenant security ensures clients can only see their own project.

---

## Step 6: Configure In-App SMTP for Transactional Emails

1. Sign in as **Studio Owner** &rarr; open **Studio Admin** surface &rarr; select **SMTP Engine** tab.
2. Enter your mail provider's SMTP details (Host, Port 587 or 465, Encryption, Username, Password).
3. Click **"Test Handshake & Verify"**:
   - The server performs an encrypted handshake and sends a test transmission to your inbox.
   - All client notifications, milestone sign-offs, and requirement alerts will dispatch through your verified mail server.

