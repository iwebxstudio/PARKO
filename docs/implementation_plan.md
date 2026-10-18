# PARKO — Parking Management System

## implementation_plan.md (Production Version)

---

# 1. System Overview

PARKO คือระบบบริหารลานจอดรถแบบ Production-ready รองรับ:

* รถมีทะเบียน / ไม่มีทะเบียน
* ใช้งานผ่าน Mobile / Desktop
* พิมพ์ใบเสร็จผ่าน Thermal Printer (Bluetooth / USB)
* รองรับการขยายระบบ (Scalable Architecture)

---

# 2. High-Level Architecture

## 2.1 Components

* Frontend: React + Tailwind CSS v3
* Backend API: NestJS (TypeScript)
* Database: PostgreSQL
* Realtime: WebSocket Gateway
* Auth: JWT + Refresh Token
* Cache/Queue: Redis (Rate limit / job queue)
* Printer Layer:

  * Local Print Agent (Node.js)
* Deployment:

  * Docker + Docker Compose

---

## 2.2 Architecture Flow

Client (Mobile/Desktop)
→ REST API (NestJS)
→ PostgreSQL

Client → WebSocket → Real-time Dashboard

Client → Print Request → Local Print Agent → Thermal Printer

---

# 3. Core Modules

---

## 3.1 Authentication & RBAC

* JWT Access Token (short-lived)
* Refresh Token (secure rotation)
* Role:

  * ADMIN
  * STAFF

---

## 3.2 Parking Module

---

### 3.2.1 Check-in

#### Input:

* Vehicle Type:

  * Car
  * Motorcycle
  * EV
  * Truck / Other
* License Plate (optional)

#### Logic:

* Generate Ticket ID (5-digit unique)
* Generate QR Code
* Assign:

  * entry_time
  * created_by

#### Output:

* Ticket Data
* QR Code
* Print Receipt

---

### 3.2.2 Check-out (STRICT POLICY)

#### Allowed Methods:

* QR Code
* Ticket ID
* License Plate

#### IMPORTANT RULE:

* ❌ ห้ามปล่อยรถออกโดยไม่มีข้อมูลในระบบ
* ✅ Receipt ใช้เป็น fallback (manual lookup เท่านั้น)

---

### 3.2.3 Pricing Engine

รองรับ:

* Hourly Rate
* Daily Rate
* Monthly Subscription
* Custom Duration

#### Calculation:

```
fee = pricing_strategy(entry_time, exit_time, vehicle_type)
```

---

### 3.2.4 Payment System

#### Types:

* Static QR (default)
* Dynamic QR (future)

#### Status:

* PENDING
* PAID
* MANUAL_PAID

---

### 3.2.5 Lost Ticket Handling (HIGH SECURITY)

#### Required:

* Upload:

  * Car image
  * Driver image
  * ID/Passport/License
* Note (text)
* Auto timestamp

#### Logic:

* Apply Penalty Fee
* Require Admin Approval (optional config)
* Mark:

  * is_lost_ticket = true

#### Audit:

* Full logging (who/when/action)

---

## 3.3 Parking Capacity (Optional)

* Soft Limit (configurable)
* Alert when threshold exceeded

---

## 3.4 Printer System

---

### 3.4.1 Architecture

Browser (React)
→ API Request
→ Local Print Agent (Node.js)
→ Thermal Printer

---

### 3.4.2 Print Agent (Node.js)

#### Responsibilities:

* Receive print job via HTTP/WebSocket
* Format ESC/POS
* Send to:

  * Bluetooth Printer
  * USB Printer

---

### 3.4.3 API Example

```
POST /print
{
  "ticket_id": "12345",
  "content": "receipt data"
}
```

---

## 3.5 Notification System

* Email
* Telegram
* Discord

Trigger:

* Lost ticket
* System alert
* Payment issue

---

## 3.6 Audit Log System

บันทึกทุก action:

* login/logout
* check-in/out
* lost ticket
* config changes

---

# 4. Database Design (PostgreSQL)

---

## 4.1 Tables

### users

* id
* email
* password_hash
* role
* created_at

---

### tickets

* id
* ticket_code (unique)
* vehicle_type
* license_plate
* entry_time
* exit_time
* status
* created_by

---

### payments

* id
* ticket_id
* amount
* status (PENDING/PAID/MANUAL)
* paid_at

---

### pricing_rules

* id
* type (hourly/daily/monthly/custom)
* rate
* vehicle_type

---

### lost_tickets

* id
* ticket_id
* car_image
* driver_image
* id_document
* note
* penalty_fee
* approved_by
* created_at

---

### audit_logs

* id
* user_id
* action
* entity
* entity_id
* metadata (JSONB)
* created_at

---

### system_settings

* id
* key
* value

---

# 5. API Design (NestJS)

---

## Auth

* POST /auth/login
* POST /auth/refresh

---

## Parking

* POST /parking/check-in
* POST /parking/check-out
* GET /parking/:id

---

## Payment

* POST /payment/pay
* GET /payment/:ticket_id

---

## Lost Ticket

* POST /lost-ticket
* GET /lost-ticket/:id

---

## Admin

* GET /stats
* POST /pricing
* POST /settings

---

# 6. Frontend (React)

---

## Pages

### Staff

* Check-in Page (2 click UX)
* Check-out Page
* Lost Ticket Form

---

### Admin

* Dashboard (Realtime)
* Reports
* Pricing Config
* User Management
* System Settings

---

# 7. Realtime System

* WebSocket (NestJS Gateway)
* Broadcast:

  * car count
  * revenue
  * alerts

---

# 8. Security

* JWT + Refresh Token
* RBAC Guard
* Validation (class-validator)
* Rate Limiting (Redis)
* Helmet (HTTP security)
* CORS
* File Upload Security:

  * จำกัด type
  * จำกัด size

---

# 9. Deployment

---

## Docker Services

* app (NestJS)
* frontend (React)
* db (PostgreSQL)
* redis
* print-agent

---

## docker-compose.yml

ประกอบด้วย:

* network
* volume
* env config

---

# 10. Seed Data

* Admin user
* Default pricing
* Sample tickets

---

# 11. Performance Optimization

* DB Index:

  * ticket_code
  * license_plate
* Redis cache
* Pagination
* Lazy loading

---

# 12. Future Enhancements

* Dynamic QR Payment API
* AI License Plate Recognition
* Mobile App (Flutter)
* Multi-branch system

---

# ✅ FINAL GOAL

ระบบต้อง:

* ใช้งานได้จริงในลานจอดรถ
* รองรับผู้ใช้จำนวนมาก
* ปลอดภัย
* เสถียร
* ขยายระบบได้ในอนาคต

---
