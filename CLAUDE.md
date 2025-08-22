# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AWS Lambda function that handles form submissions for SioSalud. It's deployed via API Gateway HTTP and processes contact form submissions by sending emails through SendGrid.

## Architecture

- **Runtime**: Node.js 22 with ES modules (`.mjs`)
- **Entry Point**: `index.mjs` - AWS Lambda handler function
- **Email Service**: SendGrid for email delivery
- **API Type**: AWS API Gateway HTTP (v2)
- **Environment**: Lambda function with environment variables

## Available Endpoints

- `GET /pingardo` - Health check endpoint, returns `{success: true, message: "Pong!"}`
- `POST /contact` - Contact form submission endpoint
  - Required fields: `email`, `nombre`, `consulta`
  - Sends email to address configured in `TO_EMAIL` environment variable

## Environment Variables

Required in `.env` file or Lambda environment:
- `SENDGRID_API_KEY` - SendGrid API key for email sending
- `TO_EMAIL` - Recipient email address (default: pablo@dolphintech.io)
- `FROM_EMAIL` - Sender email address (must be verified in SendGrid)

## Commands

```bash
# Install dependencies
npm install

# Run tests (when implemented)
npm test

# Deploy (manual trigger via GitHub Actions)
# Workflow: .github/workflows/cicd.yaml
# Triggered manually from GitHub Actions UI on main branch
```

## Deployment

The Lambda function is deployed through GitHub Actions:
1. Manual workflow dispatch from main branch
2. Builds and zips the entire project including node_modules
3. Updates AWS Lambda function code directly
4. Requires AWS secrets configured in GitHub repository

## CORS Configuration

All endpoints include CORS headers for cross-origin requests:
- Handles OPTIONS preflight requests with 204 status
- Allows all origins (`*`)
- Supports GET, POST, OPTIONS methods

## API Gateway Notes

When working with API Gateway HTTP (v2):
- Path is available at `event.rawPath` or `event.path`
- HTTP method is at `event.requestContext?.http?.method` or `event.httpMethod`
- Request body comes as string in `event.body` and needs JSON parsing