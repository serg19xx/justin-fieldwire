# Electronic Signatures for Our Construction Platform  
## BoldSign vs DocuSign — Customer Briefing

**Purpose:** Help you choose an e-signature provider to integrate into our FieldWire-style application (send documents for signature from projects, schedule/job site files, client approvals, etc.).

**Audience:** Product owner / stakeholders  
**Date:** August 2026  
**Status:** Recommendation for decision — not a legal opinion. Confirm final compliance needs with your counsel if required.

---

## 1. What we need (product context)

We are **not** looking only for a standalone signing website. We need a provider we can **embed in our app** so that:

- A project manager (or admin) can send a PDF from the app for signature  
- The client / contractor receives a link (email; optionally SMS)  
- Signing can happen in a browser (and preferably inside our UI)  
- When signing is complete, our system stores the **signed PDF + audit trail** against the project  

That means we evaluate providers primarily on their **Developer / API** offering (embedded signing, webhooks, sandbox), not only on the consumer web app price.

An **envelope** = one signature request package (one or more documents to one or more signers). Signers usually **do not** need a paid account.

---

## 2. Short recommendation

| If your priority is… | Lean toward… |
|----------------------|--------------|
| **Lower cost**, clear API pricing, fast integration into *our* product | **BoldSign** |
| **Maximum brand recognition**, large-enterprise procurement already using DocuSign, deepest ecosystem | **DocuSign** |

For a construction operations app of our size, **BoldSign Enterprise API is usually the better fit on cost and transparency**, while remaining legally usable for common US/Canada e-signature use cases (ESIGN / eIDAS-class SES). Choose DocuSign if clients or partners *require* DocuSign specifically, or if you already have a corporate DocuSign contract.

---

## 3. Side-by-side comparison

### Pricing (API / embed path — indicative USD)

| | **BoldSign (Enterprise API)** | **DocuSign (Developer API)** |
|--|-------------------------------|------------------------------|
| Entry production API | From **~$30 / month**, includes **40 envelopes** | From **~$600 / year** (~$50 / month) Starter, ~**40 envelopes / month** |
| Extra envelopes | **$0.75** each (published PAYG) | Higher; depends on plan/contract (often **several dollars** per overage envelope on web plans; API tiers scale by annual package) |
| Mid volume example (~100 env/month) | ~$30 + 60×$0.75 ≈ **~$75 / month** | Often **hundreds $/month** equivalent on Intermediate (~$3,600 / year for ~100 env/month) |
| Free testing | **Free sandbox** (watermarked; test docs expire) | Free **developer/demo** account (not legally valid production envelopes) |
| Web-app-only plans | From $0 (25 env) / $5–$25 per user | Personal / Standard / Business Pro — popular but **not** the same as full API embed |

*Prices change and contracts vary. Treat numbers as planning estimates; confirm on vendor sites or with sales before purchase.*

**Sources for planning:**  
- BoldSign: [electronic-signature-pricing (API)](https://boldsign.com/electronic-signature-pricing/?plan=api)  
- DocuSign: [Developer plans & pricing](https://ecom.docusign.com/plans-and-pricing/developer)

---

### Product & technical fit for *our* app

| Topic | **BoldSign** | **DocuSign** |
|-------|--------------|--------------|
| Embed in our UI (signing / send flow) | Strong: embedded signing, requesting, templates | Strong: mature embedded/recipient experience |
| Webhooks (status → our DB) | Yes | Yes (Connect) — very mature |
| Templates & reusable forms | Yes (unlimited on API plan) | Excellent; widely used in enterprises |
| Branding (your logo on signing page) | Included on API plan | Available (plan-dependent) |
| Mobile signing | Responsive + mobile apps | Excellent, industry standard |
| SMS / WhatsApp delivery | Add-ons | Available (plan / add-on) |
| Identity verification / QES | Add-ons | Broad options; enterprise strength |
| Compliance messaging | ESIGN, eIDAS, SOC 2, GDPR; HIPAA add-on path | Market leader perception; extensive compliance portfolio |
| Vendor size / trust | Syncfusion ecosystem; growing, cost-focused | Global market leader; highest recognition with clients |

---

## 4. Strengths and weaknesses

### BoldSign

**Strengths**
- **Transparent, lower API cost** — easy to forecast ($30 base + $0.75 / envelope)  
- Built for **embedding** into SaaS products (embedded signing/requesting, webhooks, branding)  
- Free **sandbox** to prototype before paying  
- Signers do not need a BoldSign account  
- Audit trail / certificate of completion; tamper-evident completed documents  
- Good feature set for SMB and mid-market construction workflows  

**Weaknesses**
- **Brand recognition** lower than DocuSign — some clients may ask “Do you support DocuSign?”  
- Fewer third-party “already plugged into everything” expectations in large enterprises  
- Advanced options (ID verification, QES, SMS/WhatsApp) are **add-ons** — budget separately if needed  
- Smaller partner / consultant ecosystem than DocuSign  

---

### DocuSign

**Strengths**
- **Industry default** — many clients, lawyers, and GCs already know and trust it  
- Extremely mature **API, webhooks, templates, bulk, and enterprise admin**  
- Strong story for **procurement, security reviews, and enterprise IT**  
- Excellent signer UX and mobile experience  
- Deep add-on ecosystem (IAM, CLM, advanced ID, etc.) if you grow into agreement management  

**Weaknesses**
- **Significantly more expensive** for API-driven sending at our volumes  
- Pricing and plan matrix are **harder to predict** (annual API packages, overages, seat vs envelope rules)  
- Easy to overbuy features we will not use in v1  
- Go-live / production promotion process is more formal (extra process overhead for developers)  

---

## 5. Rough cost scenarios (planning only)

Assume we send envelopes **from our app via API**.

| Monthly volume | BoldSign (approx.) | DocuSign API (approx.) |
|----------------|--------------------|-------------------------|
| 40 envelopes | ~**$30** | ~**$50**/mo (Starter annual) |
| 100 envelopes | ~**$75** | Often ~**$300**/mo class (Intermediate) |
| 200 envelopes | ~**$150** | Higher mid/enterprise package |

If volume stays low at first (pilot: change orders / client acceptances only), BoldSign’s meter is forgiving. If a general contractor **mandates** DocuSign on their side, we can still support a “download PDF and send via their DocuSign” workaround — or add DocuSign later as a second connector.

---

## 6. Suggested decision for our product

**Recommended starting point: BoldSign Enterprise API**

1. Prototype in **free sandbox** inside our app (project document → send for signature → webhook → store signed file).  
2. Pilot with **1–2 document types** (e.g. client acceptance / change order).  
3. Measure real monthly envelope count for 1–2 months.  
4. Revisit DocuSign only if:
   - a major client **requires** DocuSign, or  
   - volume + enterprise features make a negotiated DocuSign deal competitive.

**Not recommended for v1:** building our own cryptographic signature stack — legal risk, audit burden, and cost exceed buying a specialist API.

---

## 7. Questions for you (so we size the plan correctly)

1. Which documents must be signed first (list 1–3 types)?  
2. About how many signature requests per month in year 1?  
3. Who signs — client, subcontractor, internal PM, or multiple parties?  
4. Is **email** enough, or do you need **SMS**?  
5. Must signing happen **inside our app**, or is a branded email link acceptable?  
6. Do any clients **require DocuSign by name** today?  
7. Do you need advanced ID verification / qualified signatures (QES), or is standard e-sign enough?

---

## 8. Next step (after your choice)

Once you pick a provider (or approve a BoldSign pilot), we will:

1. Open a sandbox account and wire **send / status / download signed PDF** into the app  
2. Attach signing to the agreed document types (project / schedule files)  
3. Show status in the UI: *Draft → Sent → Viewed → Completed / Declined*  
4. Store the signed file and completion certificate with the project record  

---

*Prepared for planning discussions. Final commercial terms should be confirmed with BoldSign / DocuSign sales. Legal sufficiency of e-signatures for specific contract types should be confirmed with your attorney for your jurisdictions (e.g. Ontario / Canada / US states).*
