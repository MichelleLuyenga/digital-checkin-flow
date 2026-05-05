# Digital Check-in Flow: Secure Mobile-First PWA

[![Status: Demo](https://img.shields.io/badge/Status-Demo-gold)](#)
[![Stack: Next.js 14](https://img.shields.io/badge/Stack-Next.js%2014-black)](#)
[![Security: JWT Auth](https://img.shields.io/badge/Security-JWT%20QR%20Auth-blue)](#)

## 🏨 Project Overview
A mobile-first Progressive Web App (PWA) simulating a contactless guest arrival journey. This project was built to bridge the gap between a polished user interface and the high-complexity PMS (Property Management System) integrations required for real-world deployment.

### Core Journey:
*   **Secure Pre-Arrival:** Automated email link delivery leading to a scoped check-in environment.
*   **Verification & Selection:** Identity verification stub followed by room preference selection.
*   **Digital Key Delivery:** QR-code generation tied to a unique, verified reservation ID.

## 🛡️ Security & Architecture
*   **Scoped JWT Authentication:** Auth is not user-based but scoped strictly to the **Reservation ID**. Links are single-use and programmatically expire at check-out to prevent unauthorized access.
*   **PMS Modeling:** Designed around the **HTNG check-in message format**, accounting for over 60 required fields for a standard reservation sync.
*   **Integration Layer:** Architected to handle reservation status polling and room assignment awareness in real-time.

## 🛠️ Technical Stack
*   **Framework:** Next.js & TypeScript
*   **Database:** Supabase
*   **Authentication:** QR-based Auth & JWT
*   **Distribution:** PWA (Progressive Web App)

---
**Role:** Software Engineer & AI Strategist | [michellevision.com](https://michellevision.com)
