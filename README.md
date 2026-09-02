# PatchProof Assurance

PATCHPROOF AI — FRONTEND MVP MASTER BUILD PROMPT

Build a polished, responsive, clickable MVP web application for PatchProof AI, strictly based on the supplied business-plan concept and the product requirements described below.

This is an MVP demonstration application, not the final production platform.

The purpose of this MVP is to clearly demonstrate PatchProof AI's core Web Change Assurance workflow using realistic mock data.

Do not overengineer the product.

Do not add functionality, modules, user types, dashboards, tools, AI features, integrations, administrative systems, or workflows that are not explicitly requested in this prompt.

1. PRODUCT NAME

PatchProof AI

Use the product positioning:

Web Change Assurance

The core product idea is:

PatchProof AI helps organisations understand website changes and issues, determine their potential impact on business-critical functions, generate structured repair recommendations, assess the safety of proposed repairs, preview changes, validate important customer journeys, and create evidence showing that the issue was successfully resolved.

The core workflow represented throughout the application must be:

Detect Issue → Analyse Dependencies and Business Impact → Generate Repair Proposal → Assess Safety → Preview Repair → Approve → Validate Business Journey → Produce Proof-of-Repair Evidence

This workflow is the central concept of the entire MVP.

2. BUSINESS CONTEXT

PatchProof AI is a B2B SaaS platform designed around Autonomous Web-Change Assurance.

The problem it addresses is that organisations currently use disconnected tools for:

monitoring;

website maintenance;

visual testing;

vulnerability detection;

performance monitoring;

troubleshooting;

validation;

reporting.

Those tools often identify isolated technical issues but do not provide a complete process linking:

technical issue → affected dependency → business impact → repair → safety assessment → validation → evidence.

PatchProof AI is intended to provide this complete assurance workflow.

Do not position PatchProof AI as only:

a cybersecurity scanner;

uptime-monitoring software;

website analytics;

WordPress maintenance software;

AI coding software;

a generic DevOps dashboard.

The product must visually and functionally communicate website change assurance.

3. PRIMARY MVP USER

The initial MVP should be designed primarily for:

UK Web Agencies and Website Maintenance Providers

These users manage multiple client websites and need a more scalable way to understand website problems, review proposed fixes, validate customer-facing functionality and provide evidence of completed maintenance.

The interface should therefore assume that one logged-in agency user manages multiple client websites.

Do not create different application versions for:

healthcare;

charities;

SMEs;

enterprises;

e-commerce companies;

auditors;

partners.

These sectors can appear through mock client websites, but they should all exist inside the same agency account experience.

4. MVP DEVELOPMENT PRINCIPLE

This MVP must be:

frontend-first;

visually complete;

clickable;

realistic;

responsive;

presentation-ready;

based on mock business/product data;

simple enough to maintain;

structured enough to demonstrate the complete PatchProof workflow.

The application is not expected to perform genuine website assurance.

Therefore, all PatchProof operational functionality should use predefined realistic mock data and simulated frontend interactions.

5. IMPORTANT BACKEND RESTRICTION

Firebase must be used only for basic account/login data CRUD.

Do not use Firebase as the database for PatchProof website data.

Do not use Firebase Authentication.

Do not use Firebase Storage.

Do not use Firebase Cloud Functions.

Do not use Firebase Hosting-specific application logic.

Do not use Firebase Realtime Database.

Do not use Firebase for:

websites;

issues;

repairs;

validation results;

dependency graphs;

evidence;

journeys;

reports;

integrations;

dashboard metrics.

All PatchProof product data must remain mock data stored within the frontend application.

6. FIREBASE ACCOUNT SYSTEM

Use Firebase Firestore only for the custom prototype account system.

This is intentionally a basic CRUD-based login system for the MVP.

Do NOT implement Firebase Authentication.

Registration Flow

Provide a Create Account page containing:

Full Name

Agency Name

Email Address

Password

Confirm Password

Create Account button

When the user submits the form:

validate required fields;

validate email format;

confirm both passwords match;

check Firestore to determine whether that email already exists;

if the email does not exist, create a new document inside a Firestore collection called:

users

Store only information required for the prototype account.

Suggested fields:

id

fullName

agencyName

email

passwordHash

createdAt

Do not store passwords as readable plain text.

Because Firebase Authentication is intentionally not being used, create a simple deterministic password hash on the client for this prototype and store the resulting value.

This authentication mechanism is strictly for MVP/demo purposes and should not be presented as production security architecture.

After successful registration:

display a success message;

redirect the user to Login.

7. LOGIN FLOW

Login page fields:

Email Address

Password

Login button

link to Create Account

On Login:

query the users Firestore collection using the provided email address;

retrieve the matching account record;

hash the entered password using the same prototype hashing method;

compare it directly against the stored passwordHash;

if both match, allow the user into the application;

if they do not match, show:

Invalid email or password.

Do not use:

signInWithEmailAndPassword

or any Firebase Authentication APIs.

This must remain a direct Firestore CRUD/query-based prototype login mechanism.

Use lightweight browser session state so the user remains inside the application until they select Logout.

Do not create complex token/session infrastructure.

8. LOGOUT

Provide a simple Logout action.

When clicked:

clear the frontend login session;

redirect back to Login.

No Firebase Authentication sign-out operation should exist.

9. NO ADMIN

Do not build any admin interface.

Do not create:

Admin Dashboard

Super Admin

Admin Login

User Administration

Client Administration

Account Approval

System Administration

Platform Management

User Role Management

Admin Analytics

Admin Settings

There is only the normal customer-facing PatchProof application.

10. APPLICATION NAVIGATION

Use a clean left sidebar.

The MVP navigation should contain only:

Overview

Websites

Issues

Journeys

Evidence

At the bottom:

Settings

Logout

Do not create separate sidebar items for:

Dependency Graph;

AI Repair;

Safety Score;

Patch Preview;

Approvals.

These should exist naturally inside the Issue → Repair workflow.

This keeps the application lean.

11. OVERALL PRODUCT FLOW

The complete clickable demonstration should work like this:

Login

↓

Overview

↓

Select a website requiring attention

↓

Website Details

↓

Open detected issue

↓

Issue Details

↓

View business impact and dependencies

↓

View AI-generated repair proposal

↓

View safety assessment

↓

Open patch preview

↓

Approve proposed repair

↓

Simulate repair application

↓

Run simulated business-journey validation

↓

View successful result

↓

Generate/view Proof-of-Repair evidence

That must be the strongest interactive experience within the MVP.

12. MOCK AGENCY ACCOUNT

Use one fictional agency environment.

Example:

Northstar Digital Agency

The logged-in user manages multiple client websites through this account.

Provide approximately 5 realistic mock websites so the dashboard feels operational without becoming cluttered.

Recommended mock sites:

BrightCart UK

Type: E-commerce
Platform: WordPress / WooCommerce
Primary Journey: Checkout

Green Clinic

Type: Private Healthcare
Platform: WordPress
Primary Journey: Contact Form / Booking

Hope Foundation

Type: Charity
Platform: WordPress
Primary Journey: Donation

BookEasy Services

Type: Services
Platform: WordPress
Primary Journey: Booking

SaaSFlow

Type: SaaS
Platform: WordPress
Primary Journey: Registration / Lead Form

Keep WordPress dominant because the initial PatchProof MVP and agency workflows focus on WordPress.

The additional examples exist only to demonstrate different business journeys.

13. MOCK DATA PRINCIPLE

All PatchProof platform information must come from local mock data.

Use static JSON, TypeScript objects or equivalent frontend structures.

Example data structure:

Agency
│
├── Websites
│   ├── BrightCart UK
│   ├── Green Clinic
│   ├── Hope Foundation
│   ├── BookEasy Services
│   └── SaaSFlow
│
├── Issues
│   ├── Payment Script Change
│   ├── SMTP Delivery Failure
│   ├── Plugin Conflict
│   └── DNS Configuration Change
│
├── Journeys
│   ├── Checkout
│   ├── Contact Form
│   ├── Donation
│   ├── Booking
│   └── Registration
│
└── Evidence
    ├── PR-001
    ├── PR-002
    └── PR-003


Changes performed by the user during the demo can update frontend state.

They do not need to persist after refresh.

14. SCREEN 1 — LOGIN

Create a premium but simple authentication screen.

Include:

PatchProof AI branding;

heading: Welcome Back

short text such as:
Sign in to your Web Change Assurance workspace.

email input;

password input;

Login button;

Create Account link.

Do not add:

Google login;

Microsoft login;

social login;

forgot-password backend flows;

2FA;

magic links.

Keep it simple.

15. SCREEN 2 — CREATE ACCOUNT

Create Account screen.

Fields:

Full Name

Agency Name

Email

Password

Confirm Password

CTA:

Create Account

Secondary link:

Already have an account? Sign in

Use Firebase Firestore CRUD exactly as specified earlier.

16. SCREEN 3 — OVERVIEW DASHBOARD

After login, take the user to Overview.

The dashboard must immediately communicate the status of the agency's website portfolio.

Header:

Good morning, [First Name]

Subheading:

Monitor changes, review repairs and protect critical website journeys.

Use mock summary metrics such as:

Websites Monitored

Healthy Websites

Websites Requiring Attention

Critical Issues

Repairs Awaiting Review

Journeys Protected

Example:

5 Websites Monitored

3 Healthy

2 Require Attention

1 Critical Issue

2 Repairs Awaiting Review

8 Journeys Protected

Do not overwhelm the dashboard with excessive analytics.

17. WEBSITE STATUS SUMMARY

Include a prominent section:

Websites Requiring Attention

Table or card layout.

Columns:

Website

Issue

Business Impact

Risk

Status

Example:

BrightCart UK

Issue: Payment Script Change
Business Impact: Checkout / Revenue
Risk: High
Status: Repair Proposed

Green Clinic

Issue: SMTP Delivery Failure
Business Impact: Lead Capture
Risk: High
Status: Awaiting Review

Clicking the website should open its Website Details page.

Clicking the issue should open Issue Details.

18. RECENT ACTIVITY

Dashboard should contain a short Recent Activity timeline.

Examples:

Payment script change detected on BrightCart UK

AI repair proposal generated

Contact form journey validated

Plugin repair approved

Proof-of-Repair record generated

Each item should have:

event;

website;

timestamp;

status icon.

This is mock information.

19. SCREEN 4 — WEBSITES

Create a clean multi-site portfolio screen.

Header:

Websites

Subheading:

View the assurance status of the websites managed by your agency.

Use cards or a table containing:

Website Name

Client / organisation

URL

Platform

Assurance Status

Open Issues

Protected Journeys

Last Checked

Status options:

Healthy

Attention Required

Critical

Provide filtering only if simple.

Example filter:

All / Healthy / Attention Required / Critical

Do not build advanced filtering.

20. ADD WEBSITE — FRONTEND SIMULATION ONLY

Provide:

Add Website

Open a modal with:

Website Name

Client Name

Website URL

Platform

Use WordPress as the main platform option.

Optionally include Shopify as a secondary mock option because PatchProof is designed to be platform-agnostic in the longer term.

Do not connect to the website.

Do not crawl the URL.

Do not validate DNS.

Do not call CMS APIs.

On submission show:

Website added successfully.

Temporarily add it to frontend state.

No Firebase storage.

21. SCREEN 5 — WEBSITE DETAILS

When the user opens a website, display a focused website-assurance overview.

Example:

BrightCart UK

URL: brightcart.co.uk
Platform: WordPress / WooCommerce
Status: Attention Required

Top metrics:

Assurance Status

Open Issues

Critical Journeys

Pending Repairs

Example:

Assurance Status — Attention Required

Open Issues — 2

Critical Journeys — 2

Pending Repairs — 1

22. WEBSITE BASELINE / DIGITAL TWIN SUMMARY

Represent the business plan's lightweight Website Digital Twin in a very compact way.

Do not build an entire separate Digital Twin module.

Add a section:

Website Baseline

Example information:

Platform
WordPress / WooCommerce

SSL
Active

DNS
Healthy

CMS Components
18 Plugins

Third-Party Services
Stripe, Google Analytics

Business Functions
Checkout, Login, Contact Form

Last Baseline
Recently captured

The purpose is simply to demonstrate that PatchProof maintains an operational representation of the website.

Do not create real baseline collection.

23. WEBSITE BUSINESS JOURNEYS

Website Details should contain:

Protected Journeys

Example:

Checkout

Status: At Risk

Account Login

Status: Healthy

Contact Form

Status: Healthy

Each journey links to Journey Details.

24. RECENT WEBSITE CHANGES

Show a simple history:

Payment script changed

Plugin updated

Analytics script modified

Theme configuration changed

Include:

date/time;

risk;

outcome.

No real change tracking is performed.

25. ACTIVE ISSUES

Website Details should show active issues.

Example:

Payment Script Modification Detected

Severity: Critical
Business Impact: Checkout / Payment / Revenue
Status: Repair Proposed

CTA:

View Issue

26. SCREEN 6 — ISSUES

Create an Issues page containing all detected mock issues across agency websites.

Columns:

Issue

Website

Category

Severity

Business Impact

Status

Detected

Suggested categories derived from the product:

CMS / Plugin

Third-Party Script

DNS / Email

Security Configuration

Integration

Functional

Performance

Suggested statuses:

Detected

Analysed

Repair Proposed

Awaiting Approval

Validation Required

Resolved

Keep filters minimal:

All

Critical

High

Medium

Resolved

27. HERO DEMONSTRATION ISSUE

Use one primary issue to demonstrate the entire workflow.

Recommended scenario:

Payment Script Modification Detected

Website:

BrightCart UK

Severity:

Critical

Category:

Third-Party Integration

Detected:

Use a realistic recent timestamp.

Description:

A change has been detected in a payment-related script used within the website's checkout journey. The modification may affect checkout completion and payment processing.

This should be the deepest and most interactive record in the MVP.

28. ISSUE DETAILS STRUCTURE

Issue Details should use one page with tabs or sections:

Overview

Dependencies

Repair

Safety

Do not create unnecessary separate pages for each.

29. ISSUE OVERVIEW TAB

Display:

Issue title

Website

Severity

Detection time

Technical component

Category

Current status

Add:

Issue Description

Explain what changed.

Then:

Potential Business Impact

Use business-focused cards.

Example:

Checkout Completion

High Impact

Payment Processing

High Impact

Revenue Generation

Critical Impact

Analytics Attribution

Medium Impact

The product must always communicate why the technical issue matters commercially.

30. DEPENDENCY VIEW

Create a lightweight visual representation of the Web Change Assurance Graph.

Do not build a complex graph-generation system.

Use clean connected nodes.

Example:

Payment Script

↓

Checkout Page

↓

Payment Gateway

↓

Payment Confirmation

↓

Order Completion

↓

Revenue

The interface should visually distinguish:

Technical Components

from

Business Outcomes

Another mock dependency example can be:

Contact Form

↓

SMTP

↓

DNS / Email Authentication

↓

Email Delivery

↓

Lead Enquiry

The graph is static mock information.

31. WEB CHANGE INTELLIGENCE PURPOSE

The dependency section should communicate:

This issue does not exist in isolation. PatchProof maps the affected website components to the business journeys that depend on them.

Avoid excessive technical explanation.

The objective is clarity.

32. AI REPAIR PROPOSAL

Inside the Repair tab display:

AI Repair Proposal

This is mock content.

Do not call an external AI API.

The repair recommendation should appear structured and context-aware.

Include:

Root Cause

Example:

The current payment-script version appears incompatible with the website's existing checkout configuration.

Proposed Repair

Example:

Restore the compatible payment-script configuration and update the associated checkout initialization settings.

Components Affected

Checkout integration

Payment gateway

Confirmation flow

Expected Outcome

Restore reliable payment processing without affecting other checkout functionality.

Validation Required

Checkout initiation

Payment processing

Confirmation page

Order confirmation

Rollback Plan

Restore the previous payment-script configuration if validation fails.

Do not make the mock AI conversational.

It should look like a professional structured remediation system.

33. SAFETY AND AUTOMATION CONTROL

Inside the Safety tab display the concept of PatchProof's risk-bounded automation.

Use a mock safety score.

Example:

Repair Safety Assessment

Safety Score: 72 / 100

Risk Level: Medium

Decision: Human Approval Required

Then show the factors used conceptually by the business:

Repair Confidence

High

Dependency Exposure

Medium

Business Impact

High

Operational Uncertainty

Low

The result should clearly state:

Human Approval Required

Do not implement the actual Energy-Based Safety Model.

Do not calculate real risk.

This is mock data representing the business-plan concept.

34. POSSIBLE SAFETY OUTCOMES

Support these mocked states:

Low Risk

Eligible for automatic execution

Medium Risk

Human approval required

High Risk

Escalation required

Unsafe

Automation blocked

Do not actually auto-execute any real change.

These are interface states only.

35. PATCH PREVIEW

Provide a CTA:

View Patch Preview

Open either a dedicated screen or large modal.

Header:

Patch Preview

Show:

Current State

Example:

Payment Script: Existing Version
Checkout Integration: Current Configuration


Proposed State

Payment Script: Compatible Version
Checkout Integration: Updated Configuration


Then show:

Expected Effect

Restore payment-processing reliability.

Business Journey Affected

Checkout

Risk Level

Medium

Rollback

Available

Validation Required

Checkout and payment journey

Buttons:

Reject

Approve Repair

Do not build a real staging environment or simulation engine.

36. APPROVAL INTERACTION

For the hero issue, clicking:

Approve Repair

should update the frontend state.

Change status from:

Awaiting Approval

to:

Approved

Then simulate:

Applying Repair...

for a short visual transition.

After that display:

Repair Applied

and:

Validation Required

No real website should be modified.

37. REJECT INTERACTION

If the user chooses Reject:

Change the mock repair status to:

Rejected

Show:

The repair has not been applied.

Provide an option to return to the issue.

Do not create complex approval histories.

38. SCREEN 7 — JOURNEYS

Create a Journey Validation area.

This represents the business-plan requirement that technical success must be measured against real business outcomes.

Journeys page should contain:

JourneyWebsiteTypeStatusCheckoutBrightCart UKTransactionalAt RiskContact FormGreen ClinicLead GenerationHealthyDonationHope FoundationTransactionalHealthyBookingBookEasy ServicesBookingHealthyRegistrationSaaSFlowRegistrationHealthy

Use statuses:

Healthy

At Risk

Validation Required

Failed

39. JOURNEY DETAILS

Opening a journey should show its individual steps.

For the hero Checkout journey:

Checkout Journey

Website:

BrightCart UK

Status before repair:

At Risk

Steps:

Product Page

Add to Cart

Checkout

Payment Gateway

Payment Confirmation

Order Confirmation

If validation has not yet occurred, show:

Validation Required

CTA:

Run Validation

40. SIMULATED VALIDATION

When the user clicks:

Run Validation

show a short simulated progress sequence.

Example:

Testing Product Page...

Testing Add to Cart...

Testing Checkout...

Testing Payment Gateway...

Testing Confirmation...

Then show:

Product Page

✓ Passed

Add to Cart

✓ Passed

Checkout

✓ Passed

Payment Gateway

✓ Passed

Payment Confirmation

✓ Passed

Order Confirmation

✓ Passed

Final message:

Journey Validated Successfully

The checkout journey continues to function correctly after the repair.

This must be completely mock/frontend driven.

Do not use:

Selenium;

Playwright;

browser automation;

real payment testing;

external APIs.

41. MULTI-LAYER VALIDATION CONCEPT

The business plan includes multiple potential validation layers.

You may show these as small labels or categories where relevant:

Security

DNS / Email

Visual

Functional

Transactional

User Access

SEO

Accessibility

Performance

Do not build separate modules for every category.

Use only the validation categories needed for the current mock issue.

For the hero issue:

Functional

and

Transactional

are enough.

42. PROOF-OF-REPAIR EVIDENCE

After successful validation, provide:

View Proof-of-Repair

This opens the most important final screen.

Header:

Proof-of-Repair

Display a clear chronological evidence record.

43. PROOF-OF-REPAIR CONTENT

The Evidence record should contain:

Evidence ID

Example: PR-2026-001

Website

BrightCart UK

Original Issue

Payment Script Modification

Original Risk

Critical

Business Impact

Checkout / Payment Processing / Revenue

Dependency Analysis

Payment Script → Checkout → Payment Gateway → Order Completion → Revenue

Proposed Repair

Short structured summary

Safety Assessment

Medium Risk — Human Approval Required

Approval

Approved

Patch Preview

Reviewed

Repair Status

Applied

Validation Performed

Checkout Journey

Validation Outcome

Passed

Rollback

Available / Not Required

Final Outcome

Resolved

Evidence Status

Verified

Also show mock timestamps for major stages.

44. BEFORE / AFTER EVIDENCE

Include a simple comparison.

Before Repair

Checkout Journey:

At Risk

Payment Validation:

Failed / Warning

After Repair

Checkout Journey:

Passed

Payment Validation:

Passed

The purpose is to communicate evidence clearly.

Do not implement screenshot-generation infrastructure.

Static mock thumbnails/placeholders are sufficient.

45. SCREEN 8 — EVIDENCE

Create an Evidence page that acts as the history of completed assurance events.

Table columns:

Evidence ID

Website

Issue

Risk

Final Outcome

Date

Example entries:

PR-2026-001

BrightCart UK
Payment Script Modification
High
Resolved

PR-2026-002

Green Clinic
SMTP Delivery Failure
High
Resolved

PR-2026-003

Hope Foundation
Plugin Update
Medium
Validated

Clicking an evidence record opens Proof-of-Repair details.

No separate complicated reporting system is required.

46. SETTINGS

Keep Settings very small.

Sections:

Profile

Display:

Full Name

Agency Name

Email

Allow simple Firestore CRUD updates for these account fields.

Do not include PatchProof operational settings.

Do not create:

security policy configuration;

API management;

advanced notification settings;

team administration;

roles;

integrations management;

billing;

compliance settings.

Settings exists only to support the basic user account.

47. FIREBASE CRUD OPERATIONS ALLOWED

Firebase Firestore should only perform:

CREATE

Create user account.

READ

Find user during login and read their account information.

UPDATE

Update basic profile information.

DELETE

Optionally provide a simple Delete Account action within Settings.

If Delete Account is included:

request simple confirmation;

delete the Firestore user record;

clear local session;

redirect to Create Account/Login.

Do not store any other application data in Firebase.

48. DO NOT BUILD REAL ISSUE DETECTION

Issue Detection is represented by mock data.

Do not build:

crawlers;

website scanners;

vulnerability scanners;

DNS scanners;

SSL scanners;

page-speed scanning;

CMS scanning;

script monitoring;

uptime monitoring.

The Issues UI should behave as though these results were detected.

49. DO NOT BUILD REAL AI

AI Repair Generation should be represented using predefined mock repair recommendations.

Do not integrate:

OpenAI;

Gemini;

Claude;

external LLM APIs;

RAG;

embeddings;

vector databases;

AI agents.

The objective is to show what the future AI-generated repair experience looks like.

50. DO NOT BUILD THE REAL ENERGY-BASED SAFETY MODEL

Display mock:

safety score;

risk level;

confidence;

dependency exposure;

business impact;

automation decision.

Do not create:

machine-learning models;

energy calculations;

training pipelines;

historical calibration systems.

51. DO NOT BUILD REAL PATCHING

Do not:

modify WordPress websites;

modify Shopify;

change DNS;

update Cloudflare;

modify scripts;

install plugins;

execute code;

deploy patches;

manage containers;

create staging environments.

All repair actions are simulated frontend states.

52. DO NOT BUILD REAL JOURNEY TESTING

Do not perform:

actual checkout transactions;

payment calls;

real form submissions;

real registrations;

browser automation;

email tests.

All results are mock data.

53. DO NOT BUILD REAL INTEGRATIONS

Do not integrate:

WordPress APIs;

Shopify APIs;

Cloudflare;

hosting platforms;

cPanel;

DNS providers;

Google Workspace;

Microsoft 365;

CI/CD;

Jira;

ticketing systems;

payment gateways.

The product may display the names of relevant services within mock website data.

Do not actually connect them.

54. DO NOT BUILD BILLING

Do not create:

Stripe integration;

subscriptions;

checkout;

invoices;

payment history;

usage billing;

plan upgrades.

Commercial subscription infrastructure is outside this MVP.

55. DO NOT BUILD ENTERPRISE FEATURES

Exclude:

SSO;

enterprise APIs;

complex access control;

advanced audit retention;

multi-region architecture;

custom connectors;

enterprise configuration;

enterprise governance systems.

56. DO NOT BUILD TEAM MANAGEMENT

Do not create:

invite user;

team members;

developer roles;

approver roles;

client roles;

auditor roles;

custom permissions.

For this MVP there is one normal logged-in agency user.

The approval functionality is performed by that user as part of the demo workflow.

57. DO NOT BUILD CLIENT PORTALS

Do not build:

client login;

separate customer dashboard;

public report portal;

white-label client portal.

Evidence is viewed directly inside the agency application.

58. DO NOT BUILD NOTIFICATION INFRASTRUCTURE

Do not implement:

email notifications;

SMS;

push notifications;

Slack notifications;

notification preferences.

Recent Activity inside the dashboard is sufficient.

59. DO NOT ADD CHATBOTS

Do not add:

AI chat;

support chatbot;

floating assistant;

Copilot sidebar;

ask-AI interface.

PatchProof's AI is represented by the structured AI Repair Proposal, not a chatbot.

60. DO NOT ADD ADMIN FUNCTIONALITY

This requirement is strict.

There must be absolutely no:

admin sidebar;

admin dashboard;

admin database management;

admin user list;

admin impersonation;

admin reports;

super-admin controls;

moderation system.

61. REQUIRED FRONTEND STATES

Use a small consistent set of statuses.

Website Status

Healthy

Attention Required

Critical

Issue Status

Detected

Analysed

Repair Proposed

Awaiting Approval

Approved

Validation Required

Resolved

Rejected

Risk

Low

Medium

High

Critical

Journey

Healthy

At Risk

Validation Required

Passed

Failed

Evidence

Verified

Pending

Do not introduce unnecessary terminology.

62. UI/UX DIRECTION

The product should feel like a trustworthy modern B2B SaaS assurance platform.

Visual personality:

professional;

technical;

calm;

reliable;

transparent;

intelligent;

modern.

Avoid:

overly futuristic AI interfaces;

cyberpunk visuals;

neon dashboards;

gaming aesthetics;

excessive gradients;

excessive glassmorphism;

excessive animations;

cluttered enterprise dashboards.

The interface should feel appropriate for:

web agencies;

developers;

digital operations teams;

business owners.

63. BRAND DIRECTION

Take inspiration from the PatchProof AI business-plan branding.

Primary visual direction:

white / very light backgrounds;

deep navy;

professional blue;

subtle light-blue accents;

clean neutral borders;

clear status colours where necessary.

Use the visual feeling of:

trust + assurance + technology

rather than generic cybersecurity.

64. TYPOGRAPHY

Use a modern professional sans-serif typeface.

Prioritise:

readability;

clear hierarchy;

medium/semibold headings;

compact dashboard typography;

clean tables.

Avoid decorative fonts.

65. COMPONENT STYLE

Use:

subtle rounded cards;

light borders;

restrained shadows;

clear status badges;

compact metric cards;

clean tables;

contextual tooltips only where useful;

simple icons;

spacious layouts.

Do not make every section a giant card.

Maintain strong information hierarchy.

66. SIDEBAR

Desktop:

Use a fixed left sidebar.

Include:

PatchProof AI logo/name.

Navigation:

Overview

Websites

Issues

Journeys

Evidence

Bottom:

Settings

Logout

Use clear active-page highlighting.

Mobile:

Collapse sidebar into a drawer.

67. TOPBAR

Use a lightweight topbar containing:

current page title;

optional breadcrumb where useful;

logged-in user's initials/avatar;

agency name.

Do not add unnecessary notification centres or global search unless needed for layout balance.

68. STATUS COLOURS

Use semantic status differentiation.

Examples:

Healthy / Passed / Resolved:
positive state

Attention / Medium:
warning state

Critical / Failed:
danger state

Pending:
neutral state

Maintain accessibility and readable contrast.

69. INTERACTIONS

Keep animations short and subtle.

Use animations only for:

navigation;

modal appearance;

progress during simulated repair;

progress during validation;

status transitions;

graph emphasis.

Do not use large page entrance animations or decorative effects.

70. RESPONSIVENESS

The entire application must work properly on:

desktop;

laptop;

tablet;

mobile.

Desktop should be the primary design target because the product is operational B2B software.

Tables should convert gracefully on smaller screens.

71. LOADING STATES

For simulated processes use short loading states.

Examples:

Analysing dependencies...

Generating repair proposal...

Preparing patch preview...

Applying repair...

Validating checkout journey...

These processes are simulated.

Do not create unnecessary long delays.

72. EMPTY STATES

Provide simple empty states where required.

Example:

No critical issues detected.

All monitored websites are currently healthy.

No evidence records available yet.

Do not create complex onboarding tours.

73. ERROR STATES

Handle basic frontend errors.

Authentication:

Invalid email or password.

Registration:

An account with this email already exists.

Firebase unavailable:

Unable to complete the request. Please try again.

Other mock operations should not require elaborate backend error handling.

74. SUGGESTED COMPONENT STRUCTURE

Keep component architecture reusable but uncomplicated.

Suggested high-level structure:

App
│
├── Authentication
│   ├── Login
│   └── Register
│
├── AppLayout
│   ├── Sidebar
│   └── Topbar
│
├── Overview
│
├── Websites
│   ├── WebsiteList
│   ├── AddWebsiteModal
│   └── WebsiteDetail
│
├── Issues
│   ├── IssueList
│   └── IssueDetail
│       ├── Overview
│       ├── DependencyGraph
│       ├── RepairProposal
│       ├── SafetyAssessment
│       └── PatchPreview
│
├── Journeys
│   ├── JourneyList
│   └── JourneyDetail
│
├── Evidence
│   ├── EvidenceList
│   └── ProofOfRepair
│
└── Settings


Do not create a huge micro-component architecture.

75. MOCK HERO FLOW — REQUIRED

Make this flow fully clickable:

Step 1

User logs into:

Northstar Digital Agency

Step 2

Overview shows:

BrightCart UK — Critical Issue

Step 3

User opens:

Payment Script Modification Detected

Step 4

Issue page explains:

Technical component affected.

Potential impact:

Checkout / Payments / Revenue

Step 5

Dependency view shows:

Payment Script → Checkout → Payment Gateway → Confirmation → Revenue

Step 6

AI Repair Proposal appears.

Step 7

Safety Assessment:

72/100 — Medium Risk — Human Approval Required

Step 8

User opens Patch Preview.

Step 9

User clicks:

Approve Repair

Step 10

Display:

Applying Repair...

Step 11

Repair state becomes:

Validation Required

Step 12

User opens Checkout Journey.

Step 13

User clicks:

Run Validation

Step 14

Show each journey step passing.

Step 15

Final result:

Journey Validated Successfully

Step 16

User opens:

Proof-of-Repair

Step 17

Final status:

Resolved — Evidence Verified

This is the central MVP demonstration.

76. SECONDARY MOCK ISSUES

Other records can be displayed without full workflows.

Examples consistent with the PatchProof concept:

SMTP Delivery Failure

Website: Green Clinic
Business Impact: Lead Generation
Status: Resolved

Plugin Conflict

Website: BookEasy Services
Business Impact: Booking Journey
Status: Awaiting Approval

Donation Integration Change

Website: Hope Foundation
Business Impact: Donation Processing
Status: Validated

These exist primarily to make the platform feel realistic.

77. WHAT SUCCESS LOOKS LIKE

When someone uses the MVP, they must understand within a few minutes:

PatchProof monitors multiple websites.

It identifies an issue.

It explains which technical components are affected.

It translates that technical issue into business impact.

It generates a structured repair proposal.

It evaluates whether the repair is safe.

It allows the user to preview the proposed repair.

It requires human approval when appropriate.

It validates whether the business-critical customer journey still works.

It produces evidence showing what happened and whether the issue was successfully resolved.

If this story is clear, the MVP has achieved its purpose.

78. FINAL SCOPE — BUILD

Build:

responsive login;

create-account flow;

Firestore CRUD-based prototype account storage;

Overview dashboard;

multi-website portfolio;

Website Details;

compact Website Baseline;

Issues list;

Issue Details;

business-impact analysis;

simple dependency visual;

mock AI Repair Proposal;

mock Safety Assessment;

human approval interaction;

Patch Preview;

simulated repair state;

Journeys list;

Journey Details;

simulated Journey Validation;

Proof-of-Repair Evidence;

Evidence history;

minimal profile Settings;

Logout.

79. FINAL SCOPE — DO NOT BUILD

Do NOT build:

admin functionality;

Firebase Authentication;

Firebase Storage;

Firebase Cloud Functions;

Firebase product-data storage;

real website monitoring;

website crawling;

vulnerability scanning;

SSL scanning;

DNS scanning;

CMS scanning;

real AI;

LLM APIs;

AI agents;

real Energy-Based Safety Model;

machine learning;

actual website repairs;

staging environments;

real patch simulation;

real rollback;

real business-journey testing;

browser automation;

WordPress integrations;

Shopify integrations;

Cloudflare integrations;

DNS-provider integrations;

hosting integrations;

CI/CD;

ticketing integrations;

payment gateways;

billing;

subscriptions;

enterprise SSO;

enterprise APIs;

complex user permissions;

team management;

client portals;

white-label portals;

compliance dashboards;

partner portals;

notification infrastructure;

chatbots;

mobile application;

unnecessary analytics;

functionality not explicitly defined above.

80. DEVELOPMENT PRIORITY

Prioritise development in this order:

Priority 1

Authentication CRUD + application layout.

Priority 2

Overview + Websites.

Priority 3

Issue Details + Business Impact + Dependency View.

Priority 4

AI Repair + Safety Assessment + Patch Preview.

Priority 5

Journey Validation.

Priority 6

Proof-of-Repair Evidence.

Priority 7

Responsive polish and Settings.

Do not begin adding secondary functionality before the complete hero workflow works from start to finish.

81. FINAL PRODUCT PRINCIPLE

The MVP should visually answer this question:

What changed, why does it matter to the business, what repair is proposed, is that repair safe, what will change, does the important business journey still work afterwards, and can we prove the outcome?

Every major screen should support that story.

Build a focused PatchProof AI MVP, not a generic website-management platform and not a representation of every future feature mentioned in the wider business plan.

The final product must feel cohesive, realistic and ready to demonstrate to the founder/client while remaining intentionally lightweight and mock-data driven.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3376d400-85e6-49ae-96b1-5deca82aa48b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
