# PARKO–ໂປຣແກຣມລະບົບຄຸ້ມຄອງບໍລິຫານບ່ອນຈອດລົດ

## 1. ພາບລວມລະບົບ

**PARKO** ແມ່ນໂປຣແກຣມລະບົບຄຸ້ມຄອງບໍລິຫານບ່ອນຈອດລົດ ຮອງຮັບລົດທຸກປະເພດ ທັງລົດມີປ້າຍ ແລະ ບໍ່ມີປ້າຍ. ໃຊ້ງານໄດ້ຜ່ານໂທລະສັບ ແລະ ຄອມພິວເຕີ ແທັບເລັດ ສາມາດພິມປີ້/ໃບຮັບເງິນຜ່ານ Thermal Printer (USB/Bluetooth).

ລະບົບເນັ້ນ High-Performance, Enterprise Security, Clean code, ລະບົບນິ່ງຄວາມສະຖຽນ ແລະ ຮອງຮັບການອັບເກຣດລະບົບໄດ້ໃນອານາຕົດ.

## 2. Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v3
- **Backend:** NestJS 11, TypeScript, Clean Architecture
- **Database:** PostgreSQL 16
- **ORM:** Prisma ORM 6
- **Realtime:** WebSocket Gateway (Socket.io)
- **Authentication:** JWT Access Token 15 ນາທີ + Refresh Token Rotation
- **Cache/Queue:** Redis 7
- **Printing:** Node.js Local Print Agent + ESC/POS
- **Gateway/Security:** Nginx + SSL/TLS
- **Deployment:** Docker, Docker Compose, Health Check ແລະ Auto Restart

**Architecture Flow**

```text
Mobile/Desktop → HTTPS/REST API → NestJS → PostgreSQL/Redis
WebSocket → Realtime Dashboard
Print Request → Local Print Agent → Thermal Printer
```

## 3. ໂຄງສ້າງໂປຣເຈັກ

```text
PARKO/
├── backend/
│   ├── prisma/          # Schema, Migration, Seed
│   ├── src/
│   │   ├── core/        # Database, Config, Health Check
│   │   ├── common/      # Guards, Pipes, Filters, Utilities
│   │   └── modules/     # Parking, Users, Payments, Reports
│   └── test/            # Unit & E2E Tests
├── frontend/
│   └── src/
│       ├── components/  # UI, Layout, Feedback
│       ├── features/    # Check-in, Check-out, Reports
│       ├── services/    # API Integration
│       ├── hooks/       # Custom React Hooks
│       ├── types/       # TypeScript Types
│       └── utils/       # Helper Functions
├── services/
│   └── print-agent/     # ຄວບຄຸມ Thermal Printer
├── infra/
│   ├── database/        # Database & Backup
│   ├── monitoring/      # Prometheus & Grafana
│   └── nginx/           # Gateway & SSL
├── scripts/             # Backup, Restore, Maintenance
├── logs/                # Runtime Logs
├── docker-compose.yml   # Production
├── docker-compose.dev.yml
├── deploy.sh
├── deploy.ps1
└── dev.bat
```

## 4. ໂມດູນຫຼັກ

### 4.1 ຜູ້ໃຊ້ ແລະ ສິດ (RBAC)

- **ADMIN:** ຈັດການຜູ້ໃຊ້, ລາຄາ, ລາຍງານການເງິນ ແລະ ອະນຸມັດປີ້ເສຍ.
- **STAFF:** ບັນທຶກລົດເຂົ້າ-ອອກ, ຮັບຊຳລະເງິນ ແລະ ແຈ້ງປີ້ເສຍ.

### 4.2 ຈັດການລົດເຂົ້າ-ອອກ

**Check-in**

- ເລືອກປະເພດລົດ: Car, Motorcycle, EV ຫຼື Truck/Other.
- ປ້ອນປ້າຍທະບຽນ ຫຼື ປະໄວ້ວ່າງ.
- ສ້າງ Ticket ID 5 ຕົວເລກ ແລະ QR Code; ບັນທຶກເວລາເຂົ້າ ແລະ ຜູ້ດຳເນີນການ.
- ພິມປີ້ອັດຕະໂນມັດ.

**Check-out**

- ຄົ້ນຫາປີ້ດ້ວຍ QR Code, Ticket ID ຫຼື ປ້າຍທະບຽນ.
- ຫ້າມອະນຸຍາດລົດອອກຖ້າບໍ່ມີຂໍ້ມູນຢືນຢັນໃນລະບົບ. ໃບປີ້ເຈ້ຍເປັນຫຼັກຖານສຳຮອງເພື່ອກວດສອບດ້ວຍມື.

### 4.3 ຄິດໄລ່ຄ່າຈອດ

ຮອງຮັບລາຄາລາຍຊົ່ວໂມງ, ເໝົາລາຍວັນ, ສະມາຊິກລາຍເດືອນ ແລະ ກົດເກນລາຄາຕາມຊ່ວງເວລາ.

```text
fee = pricing_strategy(entry_time, exit_time, vehicle_type, pricing_rule)
```

### 4.4 ຊຳລະເງິນ

- **Static QR:** QR ບັນຊີຂອງລານຈອດ.
- **Dynamic QR:** QR ທີ່ມີຍອດເງິນ; ວາງແຜນເຊື່ອມຕໍ່ API ທະນາຄານ.
- **Cash/Manual:** ຮັບເງິນສົດ ແລະ ອອກໃບຮັບເງິນ.

ສະຖານະ: `PENDING`, `PAID`, `MANUAL_PAID`.

### 4.5 ປີ້ເສຍ (Lost Ticket)

ຕ້ອງເກັບຫຼັກຖານ: ຮູບລົດ/ປ້າຍທະບຽນ, ຮູບໜ້າຜູ້ຂັບຂີ່, ຮູບເອກະສານຢືນຢັນຕົວຕົນ, ໝາຍເຫດ, ເວລາ ແລະ ຄ່າປັບໃໝ. Admin ຕ້ອງອະນຸມັດ, ບັນທຶກ `is_lost_ticket = true` ແລະ ເກັບ Audit Log.

### 4.6 ຄວາມຈຸລານຈອດ

ກຳນົດຈຳນວນລົດສູງສຸດຕາມປະເພດ ແລະ ແຈ້ງເຕືອນ Dashboard ເມື່ອບ່ອນຈອດໃກ້ເຕັມ.

### 4.7 ພິມປີ້ ແລະ ແຈ້ງເຕືອນ

- **Printing:** React ສົ່ງຄຳສັ່ງ HTTP/WebSocket ໄປ Local Print Agent (Node.js), ແປງເປັນ ESC/POS ແລະ ພິມຜ່ານ USB/Bluetooth ຂະໜາດ 58mm/80mm.
- **Notification:** Email (SMTP), Telegram Bot ແລະ Discord Webhook ສຳລັບເຫດສຳຄັນ, ປີ້ເສຍ ແລະ ລາຍການຊຳລະຜິດປົກກະຕິ.

### 4.8 Audit Log

ບັນທຶກ Login/Logout, Check-in/Check-out, ປີ້ເສຍ, ການອະນຸມັດ ແລະ ການປ່ຽນລາຄາ/ການຕັ້ງຄ່າ ເພື່ອກວດສອບຍ້ອນຫຼັງ.

## 5. ຖານຂໍ້ມູນ

ໃຊ້ PostgreSQL 16 + Prisma ORM 6.

| ຕາຕະລາງ           | ໜ້າທີ່                                             |
| ----------------- | -------------------------------------------------- |
| `users`           | ຜູ້ໃຊ້, ອີເມວ, Password Hash ແລະ Role              |
| `tickets`         | ປີ້, ປະເພດລົດ, ປ້າຍທະບຽນ, ເວລາເຂົ້າ-ອອກ ແລະ ສະຖານະ |
| `payments`        | ຍອດເງິນ, ວິທີຊຳລະ ແລະ ສະຖານະ                       |
| `pricing_rules`   | ກົດເກນລາຄາ                                         |
| `lost_tickets`    | ຫຼັກຖານ, ຄ່າປັບໃໝ ແລະ ຜູ້ອະນຸມັດ                   |
| `audit_logs`      | ປະຫວັດການກະທຳ ແລະ Metadata (JSONB)                 |
| `system_settings` | ການຕັ້ງຄ່າ Key-Value                               |

## 6. API ຫຼັກ

ທຸກ Endpoint ຕ້ອງມີ Data Validation ແລະ ກວດສິດຕາມຄວາມເໝາະສົມ.

| Method | Endpoint                  | ໜ້າທີ່                |
| ------ | ------------------------- | --------------------- |
| POST   | `/api/auth/login`         | ເຂົ້າລະບົບ            |
| POST   | `/api/auth/refresh`       | ຕໍ່ອາຍຸ Access Token  |
| POST   | `/api/parking/check-in`   | ບັນທຶກລົດເຂົ້າ        |
| POST   | `/api/parking/check-out`  | ລົດອອກ/ຄິດຄ່າ         |
| GET    | `/api/parking/:id`        | ລາຍລະອຽດປີ້           |
| POST   | `/api/payment/pay`        | ບັນທຶກການຊຳລະ         |
| GET    | `/api/payment/:ticket_id` | ກວດການຊຳລະ            |
| POST   | `/api/lost-ticket`        | ແຈ້ງປີ້ເສຍ            |
| GET    | `/api/stats`              | ສະຖິຕິ/ລາຍຮັບ (Admin) |
| POST   | `/api/pricing`            | ຈັດການລາຄາ (Admin)    |
| POST   | `/api/settings`           | ຕັ້ງຄ່າ (Admin)       |

## 7. ໜ້າຈໍລະບົບ

**Staff Portal**

- Check-in: ເປົ້າໝາຍບັນທຶກລົດພາຍໃນ 2 ຄລິກ ແລະ 2 ວິນາທີ.
- Check-out: ຄົ້ນຫາ ຫຼື ສະແກນ QR.
- Lost Ticket: ອັບໂຫຼດຫຼັກຖານ ແລະ ສະແດງຄ່າປັບໃໝ.

**Admin Dashboard**

- ສະແດງຈຳນວນລົດ, ບ່ອນວ່າງ ແລະ ລາຍຮັບ Real-time.
- ສົ່ງອອກລາຍງານ Excel/PDF.
- ຈັດການລາຄາ, ຜູ້ໃຊ້ ແລະ ສິດ.

WebSocket ອັບເດດຈຳນວນລົດ, ລາຍຮັບ ແລະ ເຫດສຳຄັນໃຫ້ Dashboard ທັນທີ.

## 8. ຄວາມປອດໄພ

- JWT Access Token ອາຍຸສັ້ນ ແລະ Refresh Token Rotation.
- RBAC Guards ກວດສິດທຸກ Endpoint.
- `class-validator` ກວດຂໍ້ມູນຂາເຂົ້າ.
- Redis Rate Limiting ປ້ອງກັນ Brute Force/DoS.
- Helmet ຊ່ວຍປ້ອງກັນ XSS, Clickjacking ແລະ MIME Sniffing.
- CORS ອະນຸຍາດສະເພາະ Origin ທີ່ກຳນົດ.
- ຮັບອັບໂຫຼດສະເພາະ PNG/JPG/WEBP ຂະໜາດບໍ່ເກີນ 5MB.
- ມີ Audit Log, Backup ແລະ Recovery.

## 9. ຕິດຕັ້ງ ແລະ ເລີ່ມໃຊ້ງານ

### 9.1 ຄວາມຕ້ອງການ

- **Docker:** Windows 10/11 + WSL2 ຫຼື Linux, Docker Engine 20.10+, Docker Compose 2+, RAM ຢ່າງໜ້ອຍ 4GB (ແນະນຳ 8GB), ພື້ນທີ່ 10GB.
- **Local Development:** Node.js 20+, npm 10+, PostgreSQL 16 ແລະ Redis 7.

### 9.2 Environment

ສ້າງ `.env` ຈາກ `.env.example`:

```powershell
Copy-Item .env.example .env
```

ຄ່າສຳຄັນ:

- `PARKO_PORT=39741`
- `PARKO_SSL_PORT=39742`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `REDIS_HOST_PORT=39745`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRATION=15m`
- `JWT_REFRESH_EXPIRATION=7d`

ຕ້ອງປ່ຽນລະຫັດຜ່ານ/Secret ຕົວຢ່າງກ່ອນ Production ແລະ ຫ້າມເກັບຄ່າລັບໃນ Source Code.

### 9.3 ຕິດຕັ້ງດ້ວຍ Docker

```powershell
.\deploy.ps1
```

ຫຼື:

```bash
docker compose up -d --build
```

ເມື່ອພ້ອມໃຊ້ງານ:

- HTTP: `http://localhost:39741`
- HTTPS: `https://localhost:39742`

Self-Signed Certificate ອາດມີຄຳເຕືອນໃນ Browser; Production ຄວນໃຊ້ Certificate ທີ່ເຊື່ອຖືໄດ້.

**ບັນຊີຕົວຢ່າງຕາມເອກະສານເດີມ** (ໃຊ້ໄດ້ກໍຕໍ່ເມື່ອ Seed Script ສ້າງໄວ້):

- Admin: `admin` / `admin123`
- Staff: `staff01` / `staff123`

ຕ້ອງປ່ຽນລະຫັດຜ່ານທັນທີ.

### 9.4 Local Development

1. ເປີດ PostgreSQL ແລະ Redis:

```bash
docker compose up -d postgres redis
```

2. ເລີ່ມ Backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

- Backend: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`

3. ເປີດ Terminal ໃໝ່ ແລະ ເລີ່ມ Frontend:

```bash
cd frontend
npm install
npm run dev
```

ກວດຄ່າ API URL ແລະ Environment ຕາມທີ່ໂປຣເຈັກກຳນົດ.

### 9.5 Backup/Restore

ໃຊ້ Script:

- `scripts/backup.sh` / `scripts/backup.ps1`
- `scripts/restore.sh` / `scripts/restore.ps1`

ສຳຮອງຂໍ້ມູນປະຈຳ ແລະ ທົດສອບການກູ້ຄືນ.

### 9.6 ແກ້ໄຂບັນຫາ

| ບັນຫາ                | ວິທີກວດສອບ/ແກ້ໄຂ                               |
| -------------------- | ---------------------------------------------- |
| Port ຊ້ຳ             | ປ່ຽນ Port ໃນ `.env`                            |
| Container ເປີດບໍ່ໄດ້ | ກວດ `docker compose logs backend` ແລະ Database |
| Login ບໍ່ໄດ້         | ກວດ Seed Script ແລະ ບັນຊີ                      |
| QR Scanner ບໍ່ໄດ້    | ກວດສິດກ້ອງ ແລະ HTTPS                           |

## 10. Seed Data

`prisma/seed.ts` ຄວນສ້າງບັນຊີ Admin/Staff, ກົດເກນຄ່າຈອດເລີ່ມຕົ້ນ ແລະ ປີ້ຕົວຢ່າງສຳລັບທົດສອບ Dashboard.

## 11. ປັບປຸງປະສິດທິພາບ

- **Database Indexing:** `ticket_code`, `license_plate`, `status`, `entry_time`.
- **Redis Caching:** Cache ສະຖິຕິ ແລະ Dashboard.
- **Server-Side Pagination:** ຮອງຮັບປີ້ຈຳນວນຫຼາຍ.
- **Code Splitting/Lazy Loading:** ໂຫຼດສະເພາະໂມດູນຈຳເປັນ.
- **Health Check/Auto Restart:** ກວດສອບ Service ແລະ ຟື້ນຄືນ Container ຕາມການຕັ້ງຄ່າ.

## 12. ແຜນພັດທະນາຕໍ່

1. ເຊື່ອມ Dynamic QR ກັບ API ທະນາຄານ.
2. ໃຊ້ AI License Plate Recognition (ALPR).
3. ພັດທະນາ Mobile App ດ້ວຍ Flutter.
4. ຂະຫຍາຍ Multi-branch ແລະ Smart City.

## 13. ເປົ້າໝາຍ

PARKO ຕ້ອງພ້ອມໃຊ້ໃນລານຈອດລົດຈິງ ໂດຍເນັ້ນ:

- **High-Performance:** ຕອບສະໜອງໄວ ແລະ ບໍ່ຄ້າງ.
- **Enterprise Security:** ລະບົບມີຄວາມປອດໄພສູງ.
- **Clean code:** Maintainable Code ໂຄ້ດສະອາດ
- **ນິ່ງຄວາມສະຖຽນ:** Health Check, Backup ແລະ Recovery.
