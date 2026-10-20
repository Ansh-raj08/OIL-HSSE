# OIL HSSE Enterprise SIF-Precursor Decision-Support Platform

## 1. Project Overview

This codebase is a decision-support dashboard built for Oil India Limited’s HSSE operations, specifically to help teams detect and assess Serious Injury & Fatality (SIF) precursors in unsafe acts, unsafe conditions, and near-miss reports. The app does not try to replace the human safety professional; instead, it acts as an industrial command-layer tool that shortens the time between event reporting and supervisory action.

The central challenge in the domain is information overload. In upstream oil and gas operations, daily reports are numerous, highly variable in wording, and often contain ambiguous sentences where the hazard is described in a way that can be mistaken for a routine operational observation. For example, phrases like “without secondary lanyard attached,” “not depressurized,” or “bypassed lockout” contain a disproportionately high risk signal even when embedded inside otherwise ordinary narrative text. This application is designed to surface those hidden high-risk signals quickly and cleanly.

The platform combines three things:

- a structured risk triage interface for safety supervisors,
- a domain-aware explainability panel that shows why a report was flagged,
- a human validation workflow that lets officers confirm or override the AI recommendation with justification.

This makes it an example of a human-in-the-loop safety monitoring system: the model or rule-based decision engine suggests risk, but a trained professional remains responsible for escalation and authorization.

---

## 2. Why the App Exists

The problem statement highlights a common real-world issue in safety governance: reports are collected at scale but often not prioritized correctly. Many low-severity observations are easy to ignore, while some actual high-energy hazards are buried in text that looks ordinary at first glance. The system aims to reduce that blind spot.

The dashboard organizes this process by:

1. ingesting incident narratives,
2. classifying them by risk priority,
3. mapping them to IOGP Life-Saving Rules,
4. detecting safety-negation patterns that raise risk,
5. showing a hierarchy-of-controls response,
6. letting an officer approve or override the result.

This is not a general-purpose app; it is domain-specific and built to feel like a safety operations control room, not a generic admin dashboard.

---

## 3. Product Workflow and User Experience

The UI is designed as a high-density monitoring console with three main zones:

### Zone 1: Navigation and KPI Header
At the very top, the app displays an operational header with:

- the OIL-branded identity,
- location and basin context,
- live time tracking in IST,
- an active engine status beacon,
- four KPI cards summarizing operational health.

This gives the screen a command-center feel and makes the dashboard appear like an enterprise safety monitoring layer rather than a prototype.

### Zone 2: Priority Triage Stream
The left-side stream is the event queue. It displays incident cards in ranked order based on risk severity. Each record contains:

- the risk badge (CRITICAL, HIGH, MEDIUM, LOW),
- incident ID,
- timestamp,
- site location,
- a shortened narrative summary,
- the mapped Life-Saving Rule,
- the category of incident,
- the validation status.

The triage panel also supports:

- search by site, ID, narrative, or LSR title,
- filter chips for risk bands and pending review state,
- card selection so the user can inspect one case in detail.

This creates a simplified but realistic safety command workflow where an operator can quickly scan and drill down into only the most relevant events.

### Zone 3: Explainability Console
The right-hand panel is where the app explains itself. When an incident is selected, it displays:

- the full raw narrative,
- the risk score and meter,
- the exact domain triggers that contributed to the flag,
- semantic tokens marked as negation-aware triggers,
- the matching Life-Saving Rule violation,
- the recommended hierarchical controls,
- interactive buttons for confirm and escalate or override.

This gives the platform its explainable-AI behavior. It does not simply say “this is critical”; it says “this is critical because the text contains X, Y, and Z safety violations in a hazardous context.”

---

## 4. Technical Architecture

This project is built using Next.js 16 with React and TypeScript. The app is front-end driven, and the state is managed centrally through a context reducer rather than a large external store. This keeps the code simple while still giving a clear source of truth for incidents, filters, selected records, and actions.

### Core Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide React icons
- anime.js for motion support
- Recharts is included in dependencies but is not the focus of the current UI

The architecture is intentionally simple and dashboard-centric rather than backend-heavy. This reflects the current stage of the project: it behaves like a polished front-end prototype for a safety intelligence portal, with simulated data and client-side state transitions.

---

## 5. Core Data Structures

The type system is defined in the file that models the domain objects for safety incidents.

### SafetyIncident
Each incident includes:

- id
- timestamp
- site
- basin
- reportedBy
- category
- rawNarrative
- truncatedNarrative
- riskScore
- riskLevel
- isSifPrecursor
- lsrCategory
- lsrTitle
- lsrViolations
- xaiTriggers
- hierarchyActions
- validationStatus
- reviewedBy
- reviewedAt
- overrideJustification
- escalationNotes

These fields create a comprehensive representation of a field event and the system’s decision around it.

### Risk and Status Types
The project defines risk labels such as:

- CRITICAL
- HIGH
- MEDIUM
- LOW

It tracks validation states such as:

- PENDING
- CONFIRMED
- OVERRIDDEN

This matters because all operations in the app depend on risk state and human review state.

### Life-Saving Rule Mapping
The app maps incidents to IOGP/HSSE principle categories using codes like:

- LSR-01: Energy Isolation / LOTO
- LSR-03: Working at Height
- LSR-04: Hot Work
- LSR-07: H₂S / Toxic Gas Exposure
- LSR-09: Mechanical Lifting Operations

This allows the app to align each scenario with domain-specific safety compliance and control standards instead of using generic labels.

---

## 6. The Safety Context and State Model

The main state management is centralized in the project’s SafetyContext provider. This is the operational brain of the dashboard.

The state contains:

- incidents: the full list of safety reports
- selectedIncident: the current incident selected by the user
- filter: active severity filter
- searchQuery: current text search input
- isIngestionModalOpen: whether the input modal is open
- isOverrideModalOpen: whether the justification dialog is open

The reducer handles multiple actions:

- SET_FILTER
- SET_SEARCH
- SELECT_INCIDENT
- CONFIRM_AND_ESCALATE
- OVERRIDE_INCIDENT
- ADD_INCIDENT
- OPEN_INGESTION_MODAL
- CLOSE_INGESTION_MODAL
- OPEN_OVERRIDE_MODAL
- CLOSE_OVERRIDE_MODAL

This design is important because it keeps the application logic predictable and testable. The UI never directly mutates the data; it dispatches actions, and the central reducer updates the state.

### KPI Computation
The context calculates live KPI values such as:

- total incidents ingested,
- flagged SIF precursors,
- pending review count,
- compliance rate.

These metrics are recalculated from the current incident array using useMemo, so they update instantly whenever the dataset changes.

---

## 7. How Risk Scoring Works

The system uses deterministic risk values stored in each incident, such as 94, 91, 88, and so on. Those risk scores are not random; they are designed to reflect unsafe conditions with high severity, low control adherence, and serious consequence potential.

Examples from the sample dataset include:

- working at height without tie-off → critical risk
- bypassing lockout and not depressurizing a high-pressure line → critical risk
- H₂S exposure without gas monitors or EEBA → critical risk
- hot work without permits and explosive gas checks → critical risk

Each incident also contains a risk level derived from the score, and the app visually emphasizes severity using red, amber, and yellow color themes. This makes the user’s attention quickly move to serious hazards.

The score is paired with explainability data, giving the user a rational explanation rather than a black-box flag.

---

## 8. Explainability and Negation-Aware Triggering

The most important logic in the codebase is not the color badge—it is the explainability model expressed through xaiTriggers.

Each trigger contains:

- token: the specific phrase or keyword detected
- weight: contribution strength to the risk score
- context: surrounding phrase from the original narrative
- isNegation: whether the phrase indicates absence or violation, such as “without safety harness,” “not maintained,” or “no isolation certificate”

This is a meaningful design choice. In safety language, negation changes the meaning dramatically. A sentence is not merely “harness present” or “wall secure”; it may mean the controls are missing. The app is structured to recognize these absence-based triggers and weigh them heavily.

Examples of negation-aware triggers in the dataset include:

- “without secondary lanyard”
- “not maintained”
- “not depressurized”
- “no isolation certificate”
- “without personal gas monitors”

This is what makes the system feel domain-aware and operationally useful rather than generic AI text classification.

---

## 9. Hierarchy of Controls and Response Logic

Each incident includes a series of hierarchyActions representing the recommended controls, ordered by control priority. The structure uses a typical industrial safety response ladder:

- ELIMINATION: stop the task or remove the hazard
- SUBSTITUTION: replace dangerous process or method
- ENGINEERING: install or modify control hardware
- ADMINISTRATIVE: permits, audits, training, stand-downs
- PPE: personal protective equipment and rescue equipment

This is deeply aligned with real safety management systems. Instead of simply saying “wear PPE,” the app recommends control layers from most effective to least effective. That is an important principle in industrial safety.

Examples from the incident data include:

- stop-work order
- install barrier or anchor controls
- enforce permit-to-work verification
- inspect or reissue PPE
- evacuate and ventilate affected work zone

This makes the project much more than a visual dashboard—it becomes a safety intervention recommendation engine.

---

## 10. Human-in-the-Loop Validation Workflow

The app does not automatically escalate all incidents without review. It includes a specific validation flow:

### Confirm and Escalate
When the officer confirms an incident, the application updates the record to CONFIRMED and adds escalation information. It also notes who reviewed it and when. This simulates a field escalation system where a high-risk recommendation is passed to management or operational leadership.

### Override and Downgrade
If the supervisor believes the recommended SIF flag is not valid, the app allows an override with justification. The incident’s validation status becomes OVERRIDDEN and the reason is stored. This is important because it shows compliance with safety governance and human accountability.

This is a very realistic model for a safety review process because it recognizes that context and professional judgment are essential. It also allows the app to remain explainable and auditable instead of making hidden decisions.

---

## 11. Application State Transitions in Practice

The user journey is intentionally simple and strongly aligned with the domain.

1. The app boots with a predefined list of incident records.
2. The first incident is selected by default.
3. The user scans the triage stream and filters by severity or keyword.
4. The user clicks an incident card.
5. The explainability console displays the narrative and triggering tokens.
6. The user reviews the risk, LSR mapping, and recommended control actions.
7. The user either confirms the hazard for escalation or overrides it with written justification.
8. The state updates instantly and the KPI summary reflects the new review status.

This creates a compact safety decision loop that mirrors how high-risk event analysis might happen in an operations control room.

---

## 12. Demo Data and Domain Simulation

The project uses synthetic incident data stored in a mockIncidents file. The incidents are not random placeholders; they are crafted to resemble real upstream field conditions in Assam basin operations, including:

- drilling rigs,
- gas gathering stations,
- well workover operations,
- tank farm maintenance,
- H₂S exposure scenarios,
- unsafe acts and unsafe conditions.

This mock dataset is highly useful because it demonstrates the intended real-world behavior of the platform without requiring a live database or real-time sensor integration.

The incidents contain realistic names, locations, people, and operational contexts. That detail is important because it makes the dashboard feel credible to simulations and stakeholder demos.

---

## 13. Current Project Progress and Current Maturity Level

At the current stage, the codebase is best described as a polished front-end safety operations prototype with a strong domain design foundation.

### What is already in place

- complete dashboard layout and visual design,
- structured incident model and domain types,
- central state management with reducer logic,
- filtering and search capabilities,
- incident selection and detail view,
- risk score and validation badges,
- explainability panel with token triggers,
- environmental and safety domain logic,
- mock dataset with realistic incident narratives,
- confirm and override workflows,
- enterprise-style display for OIL HSSE operations.

### What is still open or not yet fully implemented

- no real backend or database layer,
- no authentication or authorization model,
- no persistent storage for escalations or overrides,
- no true NLP pipeline or model-based classification,
- no external rules engine integration,
- no real-time ingestion from field systems,
- no integration with live incident management systems,
- no automated tests or broader QA harness visible in the current structure.

This means the app is functionally strong as a demo and concept simulator, but it is not yet a production-critical operational system with live enterprise data pipelines.

---

## 14. Design Philosophy of the Codebase

The architecture clearly prioritizes clarity and demonstration over abstraction-heavy complexity. The code is intentionally readable and domain-oriented. It uses direct naming conventions such as:

- SafetyContext
- TriageStream
- ExplainabilityConsole
- IngestionModal
- LSR_DICTIONARY
- MOCK_INCIDENTS

This makes the codebase understandable to someone who is not deeply familiar with enterprise dashboards. All major concepts are visible in the naming itself, which is a strong engineering decision for hackathon or demo-driven projects.

It also uses a visual industrial palette rather than a standard SaaS color scheme. Dark surfaces, gold accents, red severity states, and compact dense information blocks all communicate the sense of an operations command desk rather than a consumer app.

---

## 15. Why This Project Is Important in Context

This project sits at the intersection of process safety, industrial operations, and decision intelligence. It recognizes that the biggest risk in safety operations is not always a lack of data; it is often the inability to prioritize and interpret the data at the correct speed.

By making risk signals visible and explainable, the platform improves the decision quality of supervisors. It helps the organization:

- discover hidden SIF precursors quickly,
- align field observations with regulatory controls,
- reduce the chance of missing high-severity events,
- support a traceable review process,
- deliver more confident operational escalations.

In other words, the app is not just a UI—it is a risk governance workflow wrapped in a streamlined operator experience.

---

## 16. Practical Assessment of the Current Build

The codebase is already a capable prototype and a strong demonstration of product thinking. The user experience is coherent, the domain logic is mapped clearly, and the app reads as a real operational tool rather than a generic project scaffold.

The most notable strengths are:

- explicit domain modeling,
- good separation between UI and state,
- strong visual hierarchy,
- realistic field narratives,
- explainability and human review loops,
- operational theme and regulatory framing.

The biggest opportunities for future enhancement are:

- real backend services,
- live ingestion and persistence,
- connected model evaluation,
- richer analytical pipelines,
- production compliance and audit logging,
- broader expansion into fleet-wide reporting.

---

## 17. Summary

This project is a front-end enterprise dashboard designed for safety supervision in upstream oil and gas operations. It organizes incidents into a triage workflow, computes risk scores, matches them to Life-Saving Rules, explains the trigger phrases behind the risk, and provides a human review step for confirmation or override.

It is a strong example of a purpose-built operational interface: visually disciplined, domain-aware, risk-oriented, and designed to help high-stakes safety decisions move faster and with better transparency. The current codebase is a mature prototype with a clear product vision and a realistic workflow, even though it still relies on mock data and client-side state rather than a full production backend.

That combination—clear product intent, realistic domain logic, and polished interface design—is the core reason this project stands out as a serious concept demonstration for HSSE risk decision support.
