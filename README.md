# PARKO — ລະບົບຄຸ້ມຄອງລານຈອດລົດອັດສະລິຍະ (Parking Management System)

## ແຜນການພັດທະນາ ແລະ ຄູ່ມືການຕິດຕັ້ງລະບົບ (Production Version)

---

# 1. ພາບລວມຂອງລະບົບ (System Overview)

**PARKO** ແມ່ນລະບົບຄຸ້ມຄອງ ແລະ ບໍລິຫານລານຈອດລົດທີ່ພ້ອມໃຊ້ງານໃນລະດັບອົງກອນ (Production-ready Enterprise System) ເຊິ່ງຮອງຮັບ:

* **ຮອງຮັບຍານພາຫະນະທຸກຮູບແບບ:** ທັງລົດທີ່ມີປ້າຍທະບຽນ ແລະ ບໍ່ມີປ້າຍທະບຽນ
* **ຮອງຮັບຫຼາຍອຸປະກອນ:** ໃຊ້ງານໄດ້ຢ່າງສະດວກທັງເທິງ ໂທລະສັບມືຖື (Mobile) ແລະ ຄອມພິວເຕີ (Desktop)
* **ລະບົບພິມໃບບິນ:** ພິມປີ້ ແລະ ໃບຮັບເງິນຜ່ານເຄື່ອງພິມຄວາມຮ້ອນ Thermal Printer (ຮອງຮັບທັງ Bluetooth ແລະ USB)
* **ສະຖາປັດຕະຍະກຳຮອງຮັບການຂະຫຍາຍຕົວ:** ອອກແບບດ້ວຍ Scalable Clean Architecture ຮອງຮັບການຮອງຮັບຜູ້ໃຊ້ຈຳນວນຫຼາຍ ແລະ ຫຼາຍສາຂາໃນອະນາຄົດ

---

# 2. ສະຖາປັດຕະຍະກຳລະບົບລະດັບສູງ (High-Level Architecture)

## 2.1 ອົງປະກອບຫຼັກ (Components)

* **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v3
* **Backend API:** NestJS 11 (TypeScript, Clean Architecture)
* **Database:** PostgreSQL 16 (ພ້ອມລະບົບ Indexing ແລະ ປັບແຕ່ງປະສິດທິພາບສູງ)
* **ORM:** Prisma ORM 6
* **Realtime:** WebSocket Gateway (Socket.io)
* **Authentication:** JWT Access Token (ອາຍຸສັ້ນ) + Refresh Token Rotation
* **Cache & Queue:** Redis 7 (Rate Limiting, Session, ແລະ ຈັດຄິວວຽກ)
* **Hardware Printer Layer:** Local Print Agent Daemon (Node.js ESC/POS Engine)
* **Reverse Proxy & Security:** Nginx Gateway ພ້ອມ SSL/TLS (Self-Signed / Production Cert)
* **Deployment Orchestration:** Docker & Docker Compose ພ້ອມ Health Check ແລະ ລະບົບ Restart ອັດຕະໂນມັດ

---

## 2.2 ຂະບວນການໄຫຼວຽນຂອງຂໍ້ມູນ (Architecture Flow)

```text
[ Client: Mobile / Desktop ]
       │
       ├─► [ HTTPS / REST API ] ──► [ NestJS Core API ] ──► [ PostgreSQL 16 ]
       │                                     │
       │                                     └──► [ Redis 7 Cache ]
       │
       ├─► [ WebSockets ] ───────► [ Realtime Dashboard Gateway ]
       │
       └─► [ Print Request ] ────► [ Local Print Agent ] ──► [ Thermal Printer (USB/BT) ]
```

---

## 2.3 ໂຄງສ້າງໂຄງການ (Project Structure - Enterprise Standard)

ໂຄງສ້າງໂຟນເດີໄດ້ຮັບການຈັດລະບຽບຕາມມາດຕະຖານສາກົນ (Global Enterprise Standard) ເພື່ອຄວາມຍືດຍຸ່ນໃນການຂະຫຍາຍລະບົບ (Upscaling) ແລະ ງ່າຍຕໍ່ການບຳລຸງຮັກສາໃນໄລຍະຍາວ:

```text
PARKO/
├── backend/                       # NestJS REST & WebSocket API (Clean Architecture)
│   ├── prisma/                    # Schema ຖານຂໍ້ມູນ, Migration ແລະ Script Seed ຂໍ້ມູນ
│   ├── src/
│   │   ├── core/                  # ໂຄງສ້າງພື້ນຖານຫຼັກ (Database, Config, Health Check)
│   │   ├── common/                # Shared Decorators, Guards, Filters, Pipes, Utilities
│   │   └── modules/               # ໂມດູນທຸລະກິດ (Parking, Users, Reports, Payments, Settings)
│   └── test/                      # Unit Tests ແລະ E2E Integration Tests
│
├── frontend/                      # React + Vite + TypeScript (Feature-Driven Architecture)
│   ├── src/
│   │   ├── assets/                # ໄຟລ໌ຄົງທີ່ (Fonts, Icons, Images)
│   │   ├── components/
│   │   │   ├── ui/                # UI Kit ມາດຕະຖານ (Button, Input, Modal, Table, Badge ຯລຯ)
│   │   │   ├── feedback/          # EmptyState, ConfirmDialog, LoadingSpinner
│   │   │   └── layout/            # ໂຄງຮ່າງໜ້າເວັບ ແລະ ເມນູນຳທາງ (AppLayout Navigation)
│   │   ├── constants/             # ຄ່າຄົງທີ່ (Route paths, Vehicle types, Storage keys)
│   │   ├── features/              # ໂມດູນຕາມໜ້າທີ່ (Check-in, Check-out, Membership, Reports)
│   │   ├── hooks/                 # Custom React Hooks (useDebounce, useModal, usePagination)
│   │   ├── services/              # ລະບົບເຊື່ອມຕໍ່ API ແຍກຕາມໂມດູນພ້ອມ TypeScript Type
│   │   ├── types/                 # Domain Types ພ້ອມ Root Barrel Export
│   │   └── utils/                 # ເຄື່ອງມືຊ່ວຍຈັດຮູບແບບຂໍ້ມູນ ແລະ LocalStorage Helper
│
├── services/                      # ບໍລິການເສີມຂະໜາດນ້ອຍ (Microservices)
│   └── print-agent/               # ໂປຣແກຣມ Daemon ຄວບຄຸມເຄື່ອງພິມ Thermal Printer ຜ່ານ ESC/POS
│
├── infra/                         # ໂຄງສ້າງພື້ນຖານ Infrastructure as Code & DevOps
│   ├── database/                  # ສະຄຣິບເລີ່ມຕົ້ນ PostgreSQL ແລະ ໂຟນເດີສຳຮອງຂໍ້ມູນ
│   ├── monitoring/                # ການຕັ້ງຄ່າລະບົບຕິດຕາມ Prometheus & Grafana
│   └── nginx/                     # Reverse proxy, ໃບຢັ້ງຢືນ SSL, ໄຟລ໌ຄອນຟິກ Gateway
│
├── scripts/                       # ສະຄຣິບລະບົບອັດຕະໂນມັດ (Backup, Restore, Maintenance)
│   ├── backup.sh / backup.ps1     # ສະຄຣິບສຳຮອງຖານຂໍ້ມູນອັດຕະໂນມັດ
│   └── restore.sh / restore.ps1   # ສະຄຣິບກູ້ຄືນຖານຂໍ້ມູນ
├── logs/                          # ບ່ອນເກັບບັນທຶກ Runtime Logs ຂອງລະບົບ
├── docker-compose.yml             # ໄຟລ໌ຄວບຄຸມ Docker Multi-container ສຳລັບ Production
├── docker-compose.dev.yml         # ໄຟລ໌ Docker Compose ສຳລັບສະພາບແວດລ້ອມພັດທະນາ
├── deploy.sh / deploy.ps1         # ສະຄຣິບຕິດຕັ້ງ ແລະ ເລີ່ມຕົ້ນລະບົບແບບ One-Click
└── dev.bat                        # ປຸ່ມລັດເລີ່ມຕົ້ນພັດທະນາເທິງ Windows (Backend + Frontend)
```

---

# 3. ໂມດູນຫຼັກຂອງລະບົບ (Core Modules)

---

## 3.1 ລະບົບຢືນຢັນຕົວຕົນ ແລະ ກຳນົດສິດ (Authentication & RBAC)

* **JWT Access Token:** ອາຍຸການໃຊ້ງານສັ້ນ (15 ນາທີ) ເພື່ອຄວາມປອດໄພສູງສຸດ
* **Refresh Token Rotation:** ລະບົບໝູນວຽນ Token ໃໝ່ທຸກຄັ້ງທີ່ຮ້ອງຂໍ ປ້ອງກັນການລັກລອບນຳໃຊ້
* **ບົດບາດຜູ້ໃຊ້ (Role-Based Access Control):**
  * `ADMIN`: ຜູ້ເບິ່ງແຍງລະບົບສູງສຸດ (ຈັດການຜູ້ໃຊ້, ຕັ້ງຄ່າລາຄາ, ເບິ່ງລາຍງານການເງິນ, ອະນຸມັດປີ້ເສຍ)
  * `STAFF`: ເຈົ້າໜ້າທີ່ປະຈຳຈຸດ (ບັນທຶກລົດເຂົ້າ, ບັນທຶກລົດອອກ, ຮັບຊຳລະເງິນ, ແຈ້ງປີ້ເສຍ)

---

## 3.2 ໂມດູນຈັດການລານຈອດລົດ (Parking Module)

### 3.2.1 ການບັນທຶກລົດເຂົ້າ (Check-in)

#### ຂໍ້ມູນຂາເຂົ້າ (Input):
* **ປະເພດຍານພາຫະນະ (Vehicle Type):**
  * ລົດໃຫຍ່ (Car)
  * ລົດຈັກ (Motorcycle)
  * ລົດໄຟຟ້າ (EV)
  * ລົດບັນທຸກ / ປະເພດອື່ນໆ (Truck / Other)
* **ປ້າຍທະບຽນລົດ (License Plate):** ລະບຸ ຫຼື ບໍ່ລະບຸກໍໄດ້ (Optional)

#### ຂັ້ນຕອນການປະມວນຜົນ (Logic):
* ສ້າງລະຫັດປີ້ອັດສະລິຍະ (5-digit unique Ticket ID)
* ສ້າງ QR Code ທີ່ບັນຈຸລະຫັດປີ້ ແລະ ຂໍ້ມູນການເຂົ້າ
* ບັນທຶກເວລາເຂົ້າ (`entry_time`) ແລະ ລະຫັດເຈົ້າໜ້າທີ່ຜູ້ບັນທຶກ (`created_by`)

#### ຜົນຮັບ (Output):
* ຂໍ້ມູນປີ້ຈອດລົດໃນຖານຂໍ້ມູນ
* ພາບ QR Code
* ສັ່ງພິມໃບຮັບປີ້ຜ່ານ Thermal Printer ອັດຕະໂນມັດ

---

### 3.2.2 ການບັນທຶກລົດອອກ (Check-out - STRICT POLICY)

#### ຮູບແບບການກວດສອບທີ່ຮອງຮັບ:
* ສະແກນ QR Code ຈາກປີ້
* ປ້ອນລະຫັດປີ້ (Ticket ID)
* ຄົ້ນຫາຜ່ານປ້າຍທະບຽນລົດ (License Plate)

#### ມາດຕະການຄວາມປອດໄພເຂັ້ມງວດ (Important Rule):
* ❌ **ຫ້າມເດັດຂາດ:** ບໍ່ອະນຸຍາດໃຫ້ປ່ອຍລົດອອກໂດຍບໍ່ມີຂໍ້ມູນໃນລະບົບ
* ✅ **ໃບບິນເຈ້ຍ:** ໃຊ້ເປັນພຽງຂໍ້ມູນສຳຮອງສຳລັບການກວດສອບຄືນດ້ວຍມື (Manual lookup) ເທົ່ານັ້ນ

---

### 3.2.3 ລະບົບຄຳນວນຄ່າບໍລິການ (Pricing Engine)

ຮອງຮັບຮູບແບບລາຄາຫຼາກຫຼາຍ:
* ຄິດໄລ່ຕາມຊົ່ວໂມງ (Hourly Rate)
* ຄິດໄລ່ແບບເໝົາລວມລາຍວັນ (Daily Flat Rate)
* ສະມາຊິກລາຍເດືອນ (Monthly Subscription)
* ຮູບແບບກຳນົດເອງຕາມຊ່ວງເວລາ (Custom Pricing Rule)

#### ສູດການຄຳນວນ:
```text
fee = pricing_strategy(entry_time, exit_time, vehicle_type, pricing_rule)
```

---

### 3.2.4 ລະບົບການຊຳລະເງິນ (Payment System)

#### ຮູບແບບການຊຳລະ:
* **Static QR Code:** ສະແກນຈ່າຍຜ່ານ QR ບັນຊີຫຼັກຂອງລານຈອດ
* **Dynamic QR Code:** ສ້າງຍອດເງິນພ້ອມຈ່າຍອັດຕະໂນມັດ (ຮອງຮັບການເຊື່ອມຕໍ່ລະບົບທະນາຄານໃນອະນາຄົດ)
* **ເງິນສົດ (Cash / Manual):** ຮັບເງິນສົດພ້ອມອອກໃບຮັບເງິນ

#### ສະຖານະການຊຳລະ:
* `PENDING`: ລໍຖ້າການຊຳລະ
* `PAID`: ຊຳລະເງິນສຳເລັດແລ້ວ
* `MANUAL_PAID`: ເຈົ້າໜ້າທີ່ຢືນຢັນການຮັບເງິນສົດ

---

### 3.2.5 ການຈັດການກໍລະນີປີ້ເສຍ (Lost Ticket Handling - HIGH SECURITY)

ມາດຕະການປ້ອງກັນການສໍ້ໂກງ ແລະ ຄວາມປອດໄພລະດັບສູງ:
* **ອັບໂຫຼດຫຼັກຖານບັງຄັບ:**
  * ຮູບພາບລົດ ແລະ ປ້າຍທະບຽນ
  * ຮູບພາບໃບໜ້າຜູ້ຂັບຂີ່
  * ຮູບພາບເອກະສານຢືນຢັນຕົວຕົນ (ບັດປະຈຳຕົວ / ໜັງສືຜ່ານແດນ / ໃບຂັບຂີ່)
* ບັນທຶກຂໍ້ຄວາມລາຍລະອຽດເພີ່ມເຕີມ (Note)
* ບັນທຶກວັນທີ ແລະ ເວລາອັດຕະໂນມັດ (Auto Timestamp)
* ຄິດໄລ່ຄ່າປັບໃໝຕາມທີ່ຕັ້ງຄ່າໄວ້ (Penalty Fee)
* ຮຽກຮ້ອງໃຫ້ຜູ້ເບິ່ງແຍງລະບົບອະນຸມັດ (Admin Approval)
* ບັນທຶກສະຖານະ `is_lost_ticket = true`
* ບັນທຶກລົງ Audit Log ຢ່າງຄົບຖ້ວນ (ຜູ້ດຳເນີນການ, ເວລາ, ຫຼັກຖານ)

---

## 3.3 ການຄຸ້ມຄອງຄວາມຈຸຂອງລານຈອດລົດ (Parking Capacity)

* **Soft Limit:** ກຳນົດຈຳນວນລົດສູງສຸດທີ່ຮອງຮັບໄດ້ຕາມປະເພດລົດ
* **ລະບົບແຈ້ງເຕືອນ:** ສົ່ງສັນຍານເຕືອນເທິງ Dashboard ເມື່ອບ່ອນຈອດໃກ້ເຕັມ (ເກີນເກນທີ່ກຳນົດ)

---

## 3.4 ລະບົບການພິມໃບບິນ ແລະ ປີ້ (Printer System)

### 3.4.1 ສະຖາປັດຕະຍະກຳການພິມ:
```text
Browser (React Frontend)
       │ (HTTP Request / WebSocket)
       ▼
Local Print Agent Daemon (Node.js)
       │ (ESC/POS Binary Data)
       ▼
Thermal Printer (USB / Bluetooth 58mm / 80mm)
```

### 3.4.2 ໜ້າທີ່ຂອງ Print Agent:
* ຮັບຄຳສັ່ງພິມຜ່ານ HTTP POST ຫຼື WebSocket Localhost
* ແປງຂໍ້ມູນເປັນຮູບແບບຄຳສັ່ງມາດຕະຖານ ESC/POS
* ສົ່ງຂໍ້ມູນໄປຍັງພອດ USB ຫຼື Bluetooth ໂດຍກົງ ພ້ອມຕັດເຈ້ຍອັດຕະໂນມັດ

---

## 3.5 ລະບົບການແຈ້ງເຕືອນ (Notification System)

ຮອງຮັບການແຈ້ງເຕືອນຜ່ານຊ່ອງທາງ:
* **Email (SMTP)**
* **Telegram Bot**
* **Discord Webhook**

ເຫດການທີ່ກະຕຸ້ນການແຈ້ງເຕືອນ (Triggers):
* ເມື່ອມີການແຈ້ງປີ້ເສຍ (Lost Ticket)
* ການແຈ້ງເຕືອນຄວາມຜິດພາດຂອງລະບົບ (System Critical Alert)
* ຍອດເງິນ ຫຼື ລາຍການຊຳລະເງິນຜິດປົກກະຕິ

---

## 3.6 ລະບົບບັນທຶກປະຫວັດການເຮັດວຽກ (Audit Log System)

ບັນທຶກທຸກການກະທຳຂອງຜູ້ໃຊ້ໃນລະບົບເພື່ອຄວາມໂປ່ງໃສ:
* ປະຫວັດການເຂົ້າ-ອອກລະບົບ (Login / Logout)
* ປະຫວັດການບັນທຶກລົດເຂົ້າ ແລະ ລົດອອກ (Check-in / Check-out)
* ການດຳເນີນການປີ້ເສຍ ແລະ ການອະນຸມັດ (Lost Ticket Actions)
* ການປ່ຽນແປງການຕັ້ງຄ່າລາຄາ ແລະ ການຕັ້ງຄ່າລະບົບ (Configuration Changes)

---

# 4. ການອອກແບບຖານຂໍ້ມູນ (Database Design - PostgreSQL)

ລະບົບໃຊ້ PostgreSQL 16 ພ້ອມອອກແບບຕາມມາດຕະຖານຖານຂໍ້ມູນລະດັບສູງ:

* `users`: ເກັບຂໍ້ມູນຜູ້ໃຊ້ງານ, ອີເມວ, ລະຫັດຜ່ານທີ່ເຂົ້າລະຫັດດ້ວຍ bcrypt, ບົດບາດ (`ADMIN`, `STAFF`)
* `tickets`: ເກັບຂໍ້ມູນປີ້ຈອດລົດ, ລະຫັດປີ້ (unique), ປະເພດພາຫະນະ, ປ້າຍທະບຽນ, ເວລາເຂົ້າ-ອອກ, ສະຖານະ (`ACTIVE`, `COMPLETED`, `LOST`)
* `payments`: ເກັບຂໍ້ມູນການຊຳລະເງິນ, ຈຳນວນເງິນ, ຮູບແບບການຊຳລະ, ສະຖານະ (`PENDING`, `PAID`, `MANUAL`)
* `pricing_rules`: ຕາຕະລາງກົດເກນລາຄາຕາມປະເພດລົດ ແລະ ໄລຍະເວລາ
* `lost_tickets`: ເກັບຂໍ້ມູນ ແລະ ຫຼັກຖານຮູບພາບຂອງປີ້ເສຍ, ຄ່າປັບໃໝ, ຜູ້ອະນຸມັດ
* `audit_logs`: ຕາຕະລາງບັນທຶກການກະທຳພ້ອມຂໍ້ມູນ Metadata ແບບ JSONB
* `system_settings`: ເກັບຄ່າຕັ້ງຄ່າລະບົບແບບ Key-Value

---

# 5. ການອອກແບບ API (API Design - NestJS)

ທຸກ Endpoint ມີລະບົບກວດສອບຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ (Data Validation) ແລະ ປ້ອງກັນດ້ວຍ Guards:

| Method | Endpoint | ຄຳອະທິບາຍ | ສິດການເຂົ້າເຖິງ |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | ເຂົ້າສູ່ລະບົບ ແລະ ຮັບ JWT Token | ສາທາລະນະ |
| `POST` | `/api/auth/refresh` | ຂໍຕໍ່ອາຍຸ Access Token ດ້ວຍ Refresh Token | ສາທາລະນະ |
| `POST` | `/api/parking/check-in` | ບັນທຶກລົດເຂົ້າ ແລະ ສ້າງປີ້ຈອດລົດ | Staff / Admin |
| `POST` | `/api/parking/check-out` | ບັນທຶກລົດອອກ ແລະ ຄຳນວນຄ່າບໍລິການ | Staff / Admin |
| `GET` | `/api/parking/:id` | ດຶງຂໍ້ມູນລາຍລະອຽດປີ້ຈອດລົດ | Staff / Admin |
| `POST` | `/api/payment/pay` | ບັນທຶກການຊຳລະເງິນ | Staff / Admin |
| `GET` | `/api/payment/:ticket_id` | ກວດສອບສະຖານະການຊຳລະເງິນຂອງປີ້ | Staff / Admin |
| `POST` | `/api/lost-ticket` | ແຈ້ງປີ້ເສຍພ້ອມອັບໂຫຼດຫຼັກຖານ | Staff / Admin |
| `GET` | `/api/stats` | ດຶງສະຖິຕິລວມຂອງລານຈອດລົດ ແລະ ລາຍຮັບ | Admin ເທົ່ານັ້ນ |
| `POST` | `/api/pricing` | ຕັ້ງຄ່າກົດເກນຄິດໄລ່ຄ່າຈອດລົດ | Admin ເທົ່ານັ້ນ |
| `POST` | `/api/settings` | ປັບປຸງການຕັ້ງຄ່າລະບົບ | Admin ເທົ່ານັ້ນ |

---

# 6. ສ່ວນຕິດຕໍ່ຜູ້ໃຊ້ (Frontend - React)

ອອກແບບໃຫ້ໃຊ້ງານງ່າຍ, ໂຫຼດໄວ, ແລະ ມີຄວາມຄ່ອງຕົວສູງ:

### ສຳລັບພະນັກງານ (Staff Portal):
* **ໜ້າບັນທຶກລົດເຂົ້າ (Check-in Page):** ອອກແບບ 2-Click UX ເພື່ອຄວາມວ່ອງໄວ ສາມາດບັນທຶກລົດເຂົ້າໄດ້ພາຍໃນ 2 ວິນາທີ
* **ໜ້າບັນທຶກລົດອອກ (Check-out Page):** ຮອງຮັບການສະແກນ QR Code ຜ່ານກ້ອງທັນທີ
* **ໜ້າຟອມປີ້ເສຍ (Lost Ticket Modal/Page):** ລະບົບອັບໂຫຼດຫຼັກຖານພ້ອມສະແດງຍອດປັບໃໝ

### ສຳລັບຜູ້ເບິ່ງແຍງລະບົບ (Admin Dashboard):
* **Dashboard ເວລາຈິງ (Realtime Monitoring):** ສະແດງຈຳນວນລົດໃນລານ, ບ່ອນຈອດວ່າງ, ແລະ ລາຍຮັບປະຈຳວັນ
* **ລາຍງານ ແລະ ສະຖິຕິ (Reports):** ສົ່ງອອກລາຍງານເປັນ Excel / PDF ໄດ້ທັນທີ
* **ຕັ້ງຄ່າລາຄາ (Pricing Management):** ກຳນົດອັດຕາຄ່າບໍລິການຕາມຊ່ວງເວລາ
* **ຄຸ້ມຄອງຜູ້ໃຊ້ (User Management):** ເພີ່ມ, ລຶບ, ແກ້ໄຂສິດ ແລະ ຣີເຊັດລະຫັດຜ່ານພະນັກງານ

---

# 7. ລະບົບເວລາຈິງ (Realtime WebSocket System)

* ນຳໃຊ້ NestJS WebSocket Gateway (Socket.io)
* ກະຈາຍຂໍ້ມູນແບບ Real-time ໄປຍັງທຸກ Dashboard ທີ່ເປີດຢູ່:
  * ອັບເດດຈຳນວນລົດເຂົ້າ-ອອກທັນທີ (Car Count Counter)
  * ອັບເດດຍອດເງິນລາຍຮັບສົດ (Live Revenue Counter)
  * ສົ່ງສັນຍານເຕືອນເມື່ອເກີດເຫດການສຸກເສີນ ຫຼື ປີ້ເສຍ (Instant Alert Broadcast)

---

# 8. ຄວາມປອດໄພຂອງລະບົບ (Security Architecture)

* **JWT + Refresh Token:** ລະບົບຮັກສາຄວາມປອດໄພຂອງ Session ມາດຕະຖານສູງ
* **RBAC Guards:** ປ້ອງກັນ Endpoint ຕາມລະດັບສິດທິຢ່າງເຂັ້ມງວດ
* **Data Validation:** ໃຊ້ `class-validator` ກັ່ນຕອງຂໍ້ມູນຂາເຂົ້າທຸກຈຸດ
* **Rate Limiting:** ປ້ອງກັນການໂຈມຕີແບບ Brute Force ແລະ DoS ຜ່ານ Redis Throttler
* **HTTP Security Headers:** ປ້ອງກັນດ້ວຍ Helmet (XSS, Clickjacking, MIME Sniffing)
* **CORS Protection:** ອະນຸຍາດສະເພາະ Origin ທີ່ກຳນົດໄວ້ເທົ່ານັ້ນ
* **File Upload Security:** ຈຳກັດປະເພດໄຟລ໌ (ສະເພາະຮູບພາບ PNG, JPG, WEBP) ແລະ ຈຳກັດຂະໜາດສູງສຸດບໍ່ເກີນ 5MB

---

# 9. ຄູ່ມືການຕິດຕັ້ງ ແລະ ເລີ່ມຕົ້ນໃຊ້ງານລະບົບ (INSTALLATION & QUICK START GUIDE)

ພາກສ່ວນນີ້ແມ່ນຄູ່ມືການຕິດຕັ້ງລະບົບ PARKO ຢ່າງລະອຽດ ເຊິ່ງທ່ານສາມາດເລືອກຕິດຕັ້ງໄດ້ 2 ຮູບແບບ:
1. **ວິທີທີ 1:** ຕິດຕັ້ງຜ່ານ **Docker & Docker Compose** (ແນະນຳສຳລັບການນຳໃຊ້ງານຈິງ ຫຼື Production)
2. **ວິທີທີ 2:** ຕິດຕັ້ງສຳລັບສະພາບແວດລ້ອມການພັດທະນາໂດຍກົງ (**Local Development / Non-Docker**)

---

## 9.1 ຄວາມຕ້ອງການຂັ້ນຕ່ຳຂອງລະບົບ (Prerequisites)

### ສຳລັບການຕິດຕັ້ງຜ່ານ Docker:
* ລະບົບປະຕິບັດການ: Windows 10/11 (64-bit) ພ້ອມ WSL2 ຫຼື Linux (Ubuntu 20.04+, Debian 11+)
* **Docker Desktop** (ສຳລັບ Windows) ຫຼື **Docker Engine** (ເວີຊັນ 20.10 ຂຶ້ນໄປ)
* **Docker Compose** (ເວີຊັນ v2.0 ຂຶ້ນໄປ)
* RAM ຂັ້ນຕ່ຳ: 4 GB (ແນະນຳ 8 GB ຂຶ້ນໄປ)
* ພື້ນທີ່ວ່າງໃນ Hard Disk: ຢ່າງຕ່ຳ 10 GB

### ສຳລັບການຕິດຕັ້ງແບບ Local Development (ບໍ່ຜ່ານ Docker):
* **Node.js:** ເວີຊັນ 20.0.0 ຂຶ້ນໄປ
* **npm:** ເວີຊັນ 10.0.0 ຂຶ້ນໄປ
* **PostgreSQL:** ເວີຊັນ 16
* **Redis:** ເວີຊັນ 7

---

## 9.2 ການຕັ້ງຄ່າຕົວປ່ຽນສະພາບແວດລ້ອມ (Environment Variables Configuration)

ກ່ອນເລີ່ມຕົ້ນການຕິດຕັ້ງ, ໃຫ້ສ້າງໄຟລ໌ `.env` ຈາກຕົວຢ່າງ `.env.example`:

```bash
# ສຳລັບ Linux / macOS:
cp .env.example .env

# ສຳລັບ Windows (PowerShell):
Copy-Item .env.example .env
```

### ຕົວແປສຳຄັນພາຍໃນໄຟລ໌ `.env`:
```ini
# ພອດຫຼັກສຳລັບເຂົ້າໃຊ້ງານລະບົບຜ່ານ Nginx Reverse Proxy
PARKO_PORT=39741              # HTTP Gateway
PARKO_SSL_PORT=39742          # HTTPS Gateway (SSL Secure)

# ຖານຂໍ້ມູນ PostgreSQL
POSTGRES_USER=parko
POSTGRES_PASSWORD=parko_secret_2024
POSTGRES_DB=parko_db
POSTGRES_HOST_PORT=39744

# Cache & Rate Limit Redis
REDIS_HOST_PORT=39745

# ຄວາມປອດໄພ JWT
JWT_SECRET=parko-enterprise-secure-jwt-secret-key-32chars-min!
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

---

## 9.3 ວິທີການຕິດຕັ້ງແບບທີ 1: ຕິດຕັ້ງຜ່ານ Docker (ແນະນຳສຳລັບ Production)

ລະບົບ PARKO ຖືກຕັ້ງຄ່າໃຫ້ເປັນແບບ **Zero-Config & Self-Healing** ເຊິ່ງລະບົບຈະສ້າງຖານຂໍ້ມູນ, Run Migration, Seed ຂໍ້ມູນເລີ່ມຕົ້ນ, ສ້າງໃບຮັບຮອງ SSL ແລະ ເປີດໃຊ້ງານ Nginx ໃຫ້ອັດຕະໂນມັດ 100%.

### ຮູບແບບ ກ: ແລ່ນຜ່ານສະຄຣິບອັດຕະໂນມັດ (ແນະນຳ - ງ່າຍທີ່ສຸດ)

**ເທິງ Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**ເທິງ Windows (ເປີດ PowerShell ໃນຖານະ Administrator):**
```powershell
.\deploy.ps1
```

*ສະຄຣິບຈະກວດສອບໄຟລ໌ `.env`, ສ້າງໂຟນເດີທີ່ຈຳເປັນ, Build Container, ກວດສອບ Health Check ແລະ ລໍຖ້າຈົນທຸກ Service ພ້ອມໃຊ້ງານ.*

---

### ຮູບແບບ ຂ: ແລ່ນດ້ວຍຄຳສັ່ງ Docker Compose ໂດຍກົງ (One-Command Run)

ເປີດ Terminal ຢູ່ໂຟນເດີຫຼັກຂອງໂຄງການ (`D:\PARKO`) ແລ້ວພິມຄຳສັ່ງ:

```bash
docker compose up -d --build
```
*(ຫຼື `docker-compose up -d --build` ສຳລັບ Docker Compose ເວີຊັນເກົ່າ)*

---

### ຊ່ອງທາງການເຂົ້າເຖິງລະບົບ (Access Gateways):
ເມື່ອລະບົບເລີ່ມຕົ້ນສຳເລັດແລ້ວ ສາມາດເຂົ້າໃຊ້ງານຜ່ານ Web Browser ໄດ້ທັນທີ:
* **ຊ່ອງທາງ HTTP ປົກກະຕິ:** [http://localhost:39741](http://localhost:39741)
* **ຊ່ອງທາງ HTTPS ປອດໄພສູງ:** [https://localhost:39742](https://localhost:39742) *(ຮອງຮັບ SSL Self-Signed Enterprise)*

#### ຂໍ້ມູນບັນຊີເຂົ້າໃຊ້ງານເລີ່ມຕົ້ນ (Default Credentials):
* 👑 **ຜູ້ເບິ່ງແຍງລະບົບສູງສຸດ (Admin):**
  * ຊື່ຜູ້ໃຊ້ (Username): `admin`
  * ລະຫັດຜ່ານ (Password): `admin123`
* 🚗 **ເຈົ້າໜ້າທີ່ປະຈຳຈຸດ (Staff):**
  * ຊື່ຜູ້ໃຊ້ (Username): `staff01`
  * ລະຫັດຜ່ານ (Password): `staff123`

---

## 9.4 ວິທີການຕິດຕັ້ງແບບທີ 2: ສຳລັບສະພາບແວດລ້ອມການພັດທະນາ (Local Development / Non-Docker)

ຖ້າຕ້ອງການພັດທະນາ Code ຫຼື ແກ້ໄຂລະບົບໂດຍບໍ່ໃຊ້ Docker Container ສາມາດເຮັດຕາມຂັ້ນຕອນດັ່ງນີ້:

### ຂັ້ນຕອນທີ 1: ຕິດຕັ້ງ ແລະ ເລີ່ມຕົ້ນຖານຂໍ້ມູນ
ກວດສອບໃຫ້ແນ່ໃຈວ່າ PostgreSQL ແລະ Redis ໃນເຄື່ອງຂອງທ່ານກຳລັງເຮັດວຽກຢູ່. ຫຼື ໃຊ້ Docker ເປີດສະເພາະ Database & Redis ໄດ້ດ້ວຍຄຳສັ່ງ:
```bash
docker compose up -d postgres redis
```

---

### ຂັ້ນຕອນທີ 2: ຕິດຕັ້ງ ແລະ ເລີ່ມຕົ້ນ Backend (NestJS API)
```bash
# 1. ເຂົ້າໄປຍັງໂຟນເດີ backend
cd backend

# 2. ຕິດຕັ້ງ Dependencies
npm install

# 3. ສ້າງ Prisma Client ແລະ Migrate ຖານຂໍ້ມູນ
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed ຂໍ້ມູນຕັ້ງຕົ້ນ (ສ້າງ User Admin ແລະ ກົດເກນລາຄາ)
npm run prisma:seed

# 5. ເລີ່ມຕົ້ນ Backend Server ໃນໂໝດ Development (Hot-Reload)
npm run start:dev
```
*Backend ຈະເລີ່ມເຮັດວຽກທີ່: `http://localhost:3000` (ພ້ອມ Swagger API Docs ທີ່: `http://localhost:3000/api/docs`)*

---

### ຂັ້ນຕອນທີ 3: ຕິດຕັ້ງ ແລະ ເລີ່ມຕົ້ນ Frontend (React + Vite)
ເປີດ Terminal ໃໝ່ອີກໜ້າຕ່າງໜຶ່ງ:
```bash
# 1. ເຂົ້າໄປຍັງໂຟນເດີ frontend
cd frontend

# 2. ຕິດຕັ້ງ Dependencies
npm install

# 3. ເລີ່ມຕົ້ນ Frontend Dev Server
npm run dev
```
*Frontend ຈະເລີ່ມເຮັດວຽກທີ່: `http://localhost:5173`*

---

### ປຸ່ມລັດສຳລັບ Windows (One-Click Dev Launcher):
ເທິງ Windows ສາມາດດັບເບິນຄລິກທີ່ໄຟລ໌ [dev.bat](file:///D:/PARKO/dev.bat) ເພື່ອເປີດທັງ Backend ແລະ Frontend ພ້ອມກັນໃນຄລິກດຽວ:
```cmd
.\dev.bat
```

---

## 9.5 ການຕິດຕັ້ງ ແລະ ເຊື່ອມຕໍ່ເຄື່ອງພິມຄວາມຮ້ອນ (Hardware Thermal Printer Setup)

1. ເຊື່ອມຕໍ່ເຄື່ອງພິມ Thermal Printer (ຂະໜາດ 58mm ຫຼື 80mm) ເຂົ້າກັບຄອມພິວເຕີຜ່ານສາຍ USB ຫຼື Bluetooth
2. ຕິດຕັ້ງ Driver ຂອງເຄື່ອງພິມໃຫ້ຮຽບຮ້ອຍ
3. ໂມດູນ `services/print-agent` ຈະດັກຈັບຄຳສັ່ງພິມອັດຕະໂນມັດຜ່ານ Port `39746`
4. ທົດສອບການພິມຜ່ານໜ້າຈໍ Check-in ເທິງລະບົບ PARKO

---

## 9.6 ການຄຸ້ມຄອງ, ສຳຮອງ ແລະ ກູ້ຄືນຖານຂໍ້ມູນ (Database Maintenance: Backup & Restore)

ລະບົບມີ Container ສຳຮອງຂໍ້ມູນອັດຕະໂນມັດທຸກໆ 12 ຊົ່ວໂມງ ໂດຍເກັບໄຟລ໌ໄວ້ທີ່ `./infra/database/backup/` (ເກັບຍ້ອນຫຼັງ 30 ວັນ). ນອກຈາກນີ້ທ່ານຍັງສາມາດສັ່ງງານດ້ວຍຕົນເອງໄດ້ທັນທີ:

### ການສຳຮອງຂໍ້ມູນ (Manual Backup):
* **ເທິງ Linux:**
  ```bash
  ./scripts/backup.sh
  ```
* **ເທິງ Windows (PowerShell):**
  ```powershell
  .\scripts\backup.ps1
  ```

### ການກູ້ຄືນຂໍ້ມູນ (Database Restore):
* **ເທິງ Linux:**
  ```bash
  ./scripts/restore.sh [ເສັ້ນທາງໄຟລ໌_backup.sql]
  ```
* **ເທິງ Windows (PowerShell):**
  ```powershell
  .\scripts\restore.ps1 [ເສັ້ນທາງໄຟລ໌_backup.sql]
  ```
*(ໝາຍເຫດ: ຖ້າບໍ່ລະບຸຊື່ໄຟລ໌ ລະບົບຈະເລືອກໄຟລ໌ Backup ຫຼ້າສຸດມາກູ້ຄືນໃຫ້ໂດຍອັດຕະໂນມັດ)*

---

## 9.7 ການກວດສອບ ແລະ ແກ້ໄຂບັນຫາທີ່ພົບເລື້ອຍ (Troubleshooting & FAQs)

| ບັນຫາທີ່ພົບ | ສາເຫດທີ່ອາດເກີດຂຶ້ນ | ວິທີແກ້ໄຂ |
| :--- | :--- | :--- |
| **Port ຊ້ຳກັນ (Port Conflict)** | Port `39741` ຫຼື `39742` ຖືກໂປຣແກຣມອື່ນໃຊ້ງານຢູ່ | ແກ້ໄຂຄ່າ `PARKO_PORT` ຫຼື `PARKO_SSL_PORT` ໃນໄຟລ໌ `.env` ແລ້ວຣັນ `docker compose up -d` ໃໝ່ |
| **Container ບໍ່ສາມາດເລີ່ມຕົ້ນໄດ້** | ຖານຂໍ້ມູນຍັງບໍ່ພ້ອມ ຫຼື Memory ບໍ່ພຽງພໍ | ກວດສອບ Log ດ້ວຍຄຳສັ່ງ `docker compose logs backend` |
| **ເຂົ້າສູ່ລະບົບບໍ່ໄດ້** | ຍັງບໍ່ໄດ້ Seed ຂໍ້ມູນ User ເລີ່ມຕົ້ນ | ຣັນຄຳສັ່ງ `docker compose exec backend npm run prisma:seed` |
| **ກ້ອງສະແກນ QR Code ບໍ່ເຮັດວຽກ** | ບຣາວເຊີປິດກັ້ນການເຂົ້າເຖິງກ້ອງຖ້າບໍ່ແມ່ນ HTTPS | ເຂົ້າໃຊ້ງານຜ່ານ HTTPS ທີ່ `https://localhost:39742` ແທນ HTTP |

---

# 10. ຂໍ້ມູນຕັ້ງຕົ້ນຂອງລະບົບ (Seed Data)

ລະບົບມາພ້ອມກັບ script ສຳລັບສ້າງຂໍ້ມູນຕັ້ງຕົ້ນ (`prisma/seed.ts`):
* **Admin User:** ບັນຊີຜູ້ດູແລລະບົບລະດັບສູງສຸດ
* **Staff User:** ບັນຊີເຈົ້າໜ້າທີ່ທົດສອບລະບົບ
* **Default Pricing Rules:** ອັດຕາຄ່າບໍລິການເລີ່ມຕົ້ນສຳລັບ ລົດໃຫຍ່, ລົດຈັກ ແລະ ລົດໄຟຟ້າ
* **Sample Tickets:** ຂໍ້ມູນຕົວຢ່າງປີ້ຈອດລົດສຳລັບທົດສອບສະຖິຕິເທິງ Dashboard

---

# 11. ການເພີ່ມປະສິດທິພາບຂອງລະບົບ (Performance Optimization)

* **Database Indexing:** ສ້າງ Index ພິເສດເທິງຟິວ `ticket_code`, `license_plate`, `status`, ແລະ `entry_time` ເພື່ອໃຫ້ຄົ້ນຫາໄດ້ໄວໃນລະດັບມິນລີວິນາທີ (Sub-millisecond)
* **Redis Caching:** ພັກຂໍ້ມູນສະຖິຕິ ແລະ Dashboard Data ໄວ້ໃນ Memory ເພື່ອຫຼຸດພາລະຂອງຖານຂໍ້ມູນ
* **Server-Side Pagination:** ຮອງຮັບການສະແດງຜົນລາຍການປີ້ຈຳນວນຫຼາຍແສນລາຍການໂດຍບໍ່ເຮັດໃຫ້ລະບົບຊ້າ
* **Code Splitting & Lazy Loading:** ແຍກໂມດູນ Frontend ໃຫ້ໂຫຼດສະເພາະໜ້າທີ່ກຳລັງເປີດໃຊ້ງານ

---

# 12. ແຜນພັດທະນາຕໍ່ຍອດໃນອະນາຄົດ (Future Enhancements)

* ລະບົບຊຳລະເງິນຜ່ານ Dynamic QR Code ເຊື່ອມຕໍ່ API ທະນາຄານໂດຍກົງ
* ລະບົບກ້ອງ AI ອ່ານປ້າຍທະບຽນລົດອັດຕະໂນມັດ (AI License Plate Recognition - ALPR)
* ແອັບພລິເຄຊັນເທິງມືຖືສຳລັບລູກຄ້າ (Mobile App ພັດທະນາດ້ວຍ Flutter)
* ລະບົບຄຸ້ມຄອງຫຼາຍສາຂາແບບລວມສູນ (Multi-branch Enterprise Management)

---

# ✅ ເປົ້າໝາຍສູງສຸດຂອງໂຄງການ (FINAL GOAL)

ລະບົບ PARKO ຕ້ອງບັນລຸມາດຕະຖານ:
1. **ນຳໃຊ້ໄດ້ຕົວຈິງໃນລານຈອດລົດ:** ທົນທານ, ບໍ່ຄ້າງ, ຕອບສະໜອງວ່ອງໄວ
2. **ຮອງຮັບຜູ້ໃຊ້ຈຳນວນຫຼາຍ:** ທົນທານຕໍ່ການໂຫຼດຂໍ້ມູນຢ່າງຕໍ່ເນື່ອງ
3. **ຄວາມປອດໄພສູງ:** ປ້ອງກັນການສໍ້ໂກງ ແລະ ມີ Audit Log ກວດສອບຍ້ອນຫຼັງໄດ້ທຸກຂັ້ນຕອນ
4. **ສະຖຽນລະພາບສູງ:** ມີລະບົບກວດສອບຕົນເອງ ແລະ ຟື້ນຟູອັດຕະໂນມັດ (Self-healing)
5. **ຮອງຮັບການຂະຫຍາຍຕົວ:** ພ້ອມຕໍ່ຍອດໄປສູ່ລະບົບ Smart City ໃນອະນາຄົດ

---
