# Windows code signing — Azure Trusted Signing

Storymaker's Windows build wrapper (`scripts/build-win.mjs`, run by
`npm run build:win`) will sign the installers with **Azure Trusted
Signing** the moment it finds the configuration below. Until then it
builds working **unsigned** installers exactly as before — Windows
SmartScreen just shows an "unknown publisher" warning on download.

Nothing about signing touches `package.json`'s `build` block, so a bare
`electron-builder` call anywhere else is unaffected.

---

## One-time Azure setup (you must do this — it needs your account)

### 1. Create a Trusted Signing account

Azure Portal → **Trusted Signing accounts** → Create. Pick a region and
note it — the `endpoint` follows from the region:

| Region        | endpoint                              |
|---------------|--------------------------------------|
| East US       | `https://eus.codesigning.azure.net`  |
| West US 2     | `https://wus2.codesigning.azure.net` |
| West Central US | `https://wcus.codesigning.azure.net` |
| West Europe   | `https://weu.codesigning.azure.net`  |
| North Europe  | `https://neu.codesigning.azure.net`  |

Note the **account name** you gave it.

Pricing: the **Basic** tier (~$9.99/month) includes a monthly signing
quota that is far more than an indie release cadence needs.

### 2. Complete identity validation

In the account → **Identity validations** → New.

- **Organization** — if "Wheelbarrow Studios" is a registered legal
  business. Fastest path; typically approved in **1–5 business days**.
  The validated legal name becomes the certificate's `CN` / the
  "publisher" Windows shows.
- **Individual** — otherwise. Slower and stricter (Microsoft wants
  multiple years of verifiable identity history at the address).

**Nothing signs until a validation is Approved.**

### 3. Create a certificate profile

Account → **Certificate profiles** → Create. Type: **Public Trust**
(this is what makes Windows trust the signature; "Test" chains to a test
root and is only for pipeline dry-runs). Note the **profile name**.

### 4. Create a service principal and grant it the signer role

1. Entra ID → **App registrations** → New registration. Note the
   **Directory (tenant) ID** and **Application (client) ID**.
2. That app → **Certificates & secrets** → new **client secret**. Copy
   the value now (shown once).
3. The Trusted Signing account → **Access control (IAM)** → Add role
   assignment → role **"Trusted Signing Certificate Profile Signer"** →
   assign to the app registration from step 1. (Scope it to the account,
   or narrow to the one profile.)

---

## Wire it into the build

Create **`signing.config.json`** in the repo root (git-ignored):

```json
{
  "publisherName": "Wheelbarrow Studios LLC",
  "endpoint": "https://eus.codesigning.azure.net",
  "codeSigningAccountName": "your-trusted-signing-account",
  "certificateProfileName": "your-certificate-profile"
}
```

`publisherName` must match the `CN` on the issued certificate exactly —
i.e. the legal name from your identity validation, not a nickname.

Set the service-principal credentials in the environment before building
(these are the actual secret — they go in env vars / CI secrets, never in
a file in the repo):

```
AZURE_TENANT_ID=<directory tenant id>
AZURE_CLIENT_ID=<application client id>
AZURE_CLIENT_SECRET=<the client secret value>
```

(An `AZURE_CLIENT_CERTIFICATE_PATH`, or `AZURE_USERNAME` + `AZURE_PASSWORD`,
also work — anything `Azure.Identity`'s `EnvironmentCredential` accepts.)

Then:

```bash
npm run build:win
```

The wrapper prints `Azure Trusted Signing ON` and passes the profile
through to electron-builder as `-c.win.azureSignOptions.*`. On first run
electron-builder installs the PowerShell `TrustedSigning` module
(≥ 0.5.0) from PSGallery at CurrentUser scope, then signs each `.exe`
via `Invoke-TrustedSigning`. No Windows SDK / signtool install is needed
for this path.

If the profile is present but the `AZURE_*` vars are missing (or vice
versa) the wrapper says so and builds unsigned rather than failing.

---

## Verifying a signed build

```powershell
Get-AuthenticodeSignature ".\dist-release\Wheelbarrow Studios Story Maker Setup <version>.exe" | Format-List
```

`Status` should be `Valid` and `SignerCertificate` should show your
validated identity as the subject, issued by a **Microsoft ID Verified
CS** intermediate.

SmartScreen reputation still builds over the first few hundred
downloads even with a valid signature — that is expected and resolves on
its own; it is not a signing failure.

---

## CI

CI currently runs tests only, not installer builds (see the CI/CD
decision). If installer builds are added to CI later, add
`AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` as repo
secrets and provide the `signing.config.json` values via
`STORYMAKER_SIGN_ENDPOINT` / `STORYMAKER_SIGN_ACCOUNT` /
`STORYMAKER_SIGN_PROFILE` / `STORYMAKER_SIGN_PUBLISHER` secrets — the
wrapper reads either the file or those env vars.
