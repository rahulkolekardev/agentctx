# AgentCtx Security Rules

Never include raw content from:

- `.env`
- `.env.*`
- `*.pem`
- `*.key`
- `id_rsa`
- `id_ed25519`
- private credentials

Secret-like patterns to flag:

- `OPENAI_API_KEY=`
- `ANTHROPIC_API_KEY=`
- `GITHUB_TOKEN=`
- `AWS_ACCESS_KEY_ID=`
- `AWS_SECRET_ACCESS_KEY=`
- `-----BEGIN PRIVATE KEY-----`
- `-----BEGIN RSA PRIVATE KEY-----`
- `sk-`
- `xoxb-`
- `ghp_`
- `gho_`
- `github_pat_`

When a secret-like value is found in a generated context file, report it as critical and do not copy the value into responses.
