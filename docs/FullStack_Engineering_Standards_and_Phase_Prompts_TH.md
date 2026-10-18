# มาตรฐาน Full Stack: React 19 + Tailwind CSS v3 + NestJS 11 + PostgreSQL

เอกสารนี้ใช้เป็นมาตรฐานการตรวจสอบและพัฒนาระบบด้วย Antigravity IDE / AI Coding Agent โดยทำงานทีละ Phase ห้ามแก้ไขทั้งโปรเจกต์พร้อมกันโดยไม่มีแผนและหลักฐาน

## เป้าหมาย

- ลดความเสี่ยงจาก Hardcoded Secrets, Configuration ที่ผิด และกฎธุรกิจที่ฝังไว้ผิดที่
- เพิ่ม Enterprise Security ด้วยมาตรการที่ตรวจสอบได้
- ปรับ Performance จาก Benchmark จริง ไม่ใช่การคาดเดา
- รักษา Clean Code, Maintainability, Testability และความเข้ากันได้ของระบบ
- ห้ามอ้างว่า Security หรือ Performance “100%” หากไม่มีหลักฐานวัดผล
- รักษาพฤติกรรมเดิมของระบบ เว้นแต่ได้รับอนุมัติให้เปลี่ยน

## Stack

- Frontend: React 19, TypeScript, Tailwind CSS v3
- Backend: Node.js, NestJS 11, TypeScript
- Database: PostgreSQL
- Deployment/Development: Docker Desktop, Docker Compose (ถ้ามีในโปรเจกต์)
- ใช้ ORM/Query Builder ที่โปรเจกต์เลือกอยู่แล้ว ห้ามเปลี่ยนเครื่องมือฐานข้อมูลโดยไม่มีเหตุผลและการอนุมัติ

---

# ส่วนที่ 1 — ข้อมูลที่ห้าม Hardcode โดยเรียงตามความร้ายแรง

## P0 — Critical Secrets

ห้ามฝังใน Source Code, Frontend Bundle, Git, Docker Image, Logs หรือเอกสารที่เปิดเผยได้:

1. Database passwords, privileged database credentials และ connection strings ที่มีรหัสผ่าน
2. JWT signing secrets, session secrets และ token signing keys
3. Private keys, encryption keys, key-encryption keys และ TLS private keys
4. Cloud credentials และ service account keys
5. API keys ที่ให้สิทธิ์เข้าถึงบริการจริง
6. OAuth client secrets
7. Admin/root default passwords และ credentials
8. Webhook signing secrets
9. Backup decryption keys
10. CI/CD deployment tokens, registry credentials และ signing credentials
11. Internal service tokens, Redis/message broker credentials
12. Recovery codes, reset tokens หรือ credentials ที่ยังใช้งานได้

แนวทาง:
- ใช้ Secret Manager หรือกลไก Secrets ของ Platform ที่เหมาะสม
- Environment Variables ใช้ได้สำหรับการตั้งค่าที่เหมาะสม แต่ไม่ใช่ Secret Manager ที่สมบูรณ์ในตัวเอง
- `.env.example` ต้องมีเฉพาะชื่อแปรและค่าตัวอย่างปลอม ห้ามมี Secret จริง
- ตรวจ `.gitignore`, Docker build context, CI logs และ frontend build output
- หากพบ Secret ที่เคย Commit แล้ว ให้ถือว่าอาจรั่วไหล: แจ้งผู้ใช้ก่อนดำเนินการหมุนเวียน/เพิกถอน และอย่าคิดว่าลบไฟล์แล้วปลอดภัย

## P1 — Environment / Security Configuration

13. Production API URLs และ service endpoints
14. Database hosts, ports, names และ connection settings
15. CORS origins, allowed hosts และ trusted proxies
16. OAuth redirect URIs
17. Cookie domain, Secure, SameSite และ session settings
18. Rate limits, throttling, request/body/upload limits
19. Session/token lifetime และ refresh policy
20. Password/MFA/account lockout policies
21. Allowed file types, upload size และ storage paths
22. Cache TTL, timeout, retry และ concurrency limits
23. Log level, error reporting และ monitoring endpoints
24. External service endpoints, email/SMS/payment settings
25. Data retention, backup และ restore policies
26. WebSocket origins และ connection authorization settings
27. Feature flags ที่จำเป็นต้องปรับโดยไม่แก้โค้ด
28. TLS/security settings และ deployment-specific options

## P2 — Business Data ที่เปลี่ยนแปลงได้

29. Product prices, discounts, promotions และ fees
30. Tax rates, currency และ exchange rates
31. Stock thresholds, reorder points, units และ conversion rules
32. Organization, branch, address, logo และ contact details
33. Order/payment/refund policies และ approval limits
34. Working hours, holidays, locale, language และ timezone
35. Document numbering rules และ external ID mappings
36. Notification preferences และ business workflow settings
37. Commission rules และ business policies ที่เปลี่ยนได้
38. Product/service availability restrictions ที่ต้องอัปเดตตามกฎหมาย

ข้อมูลเหล่านี้ควรอยู่ใน Database หรือ Configuration ที่ควบคุมได้ตามลักษณะการใช้งาน ไม่จำเป็นต้องย้ายทุกค่าคงที่ไป Database

## P3 — Maintainability / Magic Values

39. Magic numbers ที่ไม่อธิบายความหมาย
40. Magic strings, permission names และ event names ที่ซ้ำกัน
41. API paths ที่กระจายซ้ำหลายไฟล์
42. Error codes/messages ที่ไม่เป็นระบบ
43. Database identifiers ที่กระจายเป็น strings โดยไม่มีชั้นจัดการที่ชัดเจน
44. Validation rules ที่ซ้ำและขัดแย้งกัน
45. Dependencies/version assumptions ที่ไม่มีการควบคุม

ข้อยกเว้น: ค่าคงที่ที่เป็นส่วนหนึ่งของโปรแกรม เช่น domain enums, protocol constants และกฎที่ตั้งใจให้เป็น immutable สามารถอยู่ใน Source Code ได้ หากตั้งชื่อชัดเจน มีเหตุผล และมี Tests

---

# ส่วนที่ 2 — Enterprise Security Checklist

## Authentication / Account Security

- ใช้ password hashing ที่เหมาะสม เช่น Argon2id โดยตั้งค่าตามความเหมาะสมของระบบ
- ป้องกัน brute force และ credential stuffing ด้วย rate limiting และ monitoring
- Session/token มีอายุ การเพิกถอน และการจัดเก็บที่เหมาะสม
- หากใช้ Cookie Authentication ให้พิจารณา Secure, HttpOnly, SameSite และ CSRF protection
- Refresh token ต้องมีการหมุนเวียน/เพิกถอนตาม Threat Model
- Password reset token ต้องสุ่มอย่างปลอดภัย หมดอายุ และใช้ครั้งเดียว
- ป้องกัน account enumeration และ session fixation
- MFA สำหรับบัญชีหรือการดำเนินการที่มีความเสี่ยงสูง

## Authorization / Access Control

- ตรวจสิทธิ์ที่ Backend ทุก Request
- ป้องกัน BOLA/IDOR, privilege escalation และ mass assignment
- ใช้ least privilege และ default deny สำหรับข้อมูลที่ต้องป้องกัน
- ไม่เชื่อ role, user ID, tenant ID หรือ permission ที่ส่งมาจาก Frontend
- ตรวจสิทธิ์ในระดับ record/resource/action ตามความจำเป็น
- ทดสอบการเข้าถึงข้อมูลของผู้ใช้อื่นและการเปลี่ยน ID โดยตรง

## API / Input Validation

- ใช้ NestJS DTO validation และเปิด whitelist/forbidNonWhitelisted ตามความเหมาะสม
- Validate type, length, range, format และ business rules ที่ runtime
- ใช้ parameterized queries หรือ ORM ที่ปลอดภัย
- ป้องกัน XSS, CSRF (เมื่อเกี่ยวข้อง), SSRF, path traversal และ unsafe file upload
- จำกัด request body, batch size, pagination limit และ processing time
- ตรวจ content type, HTTP method และ webhook signatures
- มี error response ที่ไม่เปิดเผย stack traces หรือ internals ใน Production

## PostgreSQL / Data Integrity

- Application DB role ห้ามเป็น superuser
- ใช้ constraints, transactions และ isolation level ตามความต้องการ
- ป้องกัน race conditions สำหรับ stock, booking, payment และงานที่มี concurrency
- ใช้ RLS เมื่อเหมาะสมและทดสอบ context/connection pool อย่างละเอียด
- จำกัดสิทธิ์ migration account แยกจาก runtime account หากเหมาะสม
- มี backup/restore drills, retention policy และ migration tests
- ไม่บันทึก secrets หรือข้อมูลส่วนบุคคลเกินจำเป็นใน logs

## Infrastructure / Supply Chain

- ใช้ HTTPS/TLS ใน Production
- กำหนด CORS allowlist และ security headers/CSP อย่างเหมาะสม
- Container ใช้ non-root user เมื่อทำได้, จำกัด capabilities และ network exposure
- Database ไม่ควรเปิด public โดยไม่จำเป็น
- สแกน dependencies, container images และ secrets ใน CI
- จำกัดสิทธิ์ CI/CD และแยก credentials ตาม environment
- มี audit logs, alerts และ incident response plan
- ทดสอบ security controls จริง ไม่ใช่ตรวจเพียงว่ามี package ติดตั้งอยู่

## React 19

- ห้ามฝัง secrets ใน `VITE_*` หรือค่าที่ถูก bundle ไป Browser
- การซ่อน UI ไม่ใช่ authorization
- หลีกเลี่ยง `dangerouslySetInnerHTML`; หากจำเป็นต้อง sanitize อย่างเหมาะสม
- ไม่ใส่ secrets/PII ใน URL, console logs หรือ client error reporting
- ตรวจข้อมูลจาก API ก่อนนำไปใช้ และไม่เชื่อยอดเงิน/permission ที่ Client คำนวณเอง

---

# ส่วนที่ 3 — High Performance Checklist

## Frontend

- วัด production build และ bundle size
- Code split ตาม routes/features และ lazy-load เมื่อเหมาะสม
- ลด request waterfalls, duplicate requests และ payload ที่ไม่จำเป็น
- ใช้ pagination/server-side filtering สำหรับข้อมูลจำนวนมาก
- Virtualize large lists เมื่อมีประโยชน์
- ลด unnecessary renders; ใช้ memoization เมื่อวัดแล้วว่าช่วยจริง
- optimize images/fonts และ Tailwind content scanning
- วัด Core Web Vitals: LCP, INP, CLS

## Node.js / NestJS

- หลีกเลี่ยง synchronous/blocking operations ใน request path
- ตรวจ Event Loop Lag, heap growth และ memory leaks
- แยก CPU-heavy work ไป worker/background jobs เมื่อเหมาะสม
- กำหนด timeout, concurrency limits และ retry policy
- ป้องกัน retry storms และ duplicate side effects
- ใช้ pagination, selective fields และ efficient serialization
- ตรวจ overhead ของ guards/interceptors/middleware โดยใช้ profiling
- ใช้ structured logs ที่ไม่บันทึกข้อมูลลับ

## PostgreSQL

- วิเคราะห์ query ด้วย `EXPLAIN (ANALYZE, BUFFERS)` ใน environment ที่เหมาะสม
- ตรวจ N+1 queries, slow queries, lock contention และ deadlocks
- สร้าง indexes ตาม query patterns จริง
- เลือกเฉพาะ columns ที่จำเป็น
- ใช้ keyset pagination เมื่อเหมาะกับข้อมูลขนาดใหญ่
- ปรับ connection pool ตามจำนวน API instances และ DB capacity
- ลด long-running transactions
- พิจารณา caching/materialized views/partitioning เมื่อมีหลักฐานรองรับ
- ตรวจ vacuum/analyze และ table bloat ตาม workload

## Performance Evidence

ห้ามอ้างว่าเร็วขึ้นหากไม่มีการวัด ก่อน/หลังควรบันทึก:
- p50/p95/p99 latency
- throughput (requests/second)
- error rate
- CPU/RAM/heap/event loop lag
- DB query latency และ connection utilization
- frontend bundle size และ Core Web Vitals

เป้าหมายตัวเลขต้องตกลงตาม workload และ hardware จริง ไม่ตั้งตัวเลขสมมติว่าเป็นผลลัพธ์ที่รับประกัน

---

# ส่วนที่ 4 — Clean Code / Maintainability Checklist

## Architecture

- Frontend ใช้ feature-based architecture
- Backend ใช้ NestJS modules ตาม domain/business capability
- Controller บาง; business logic อยู่ใน service/domain layer ตามความเหมาะสม
- จำกัดการเข้าถึง internals ระหว่าง modules
- ป้องกัน circular dependencies
- ไม่เพิ่ม abstraction/design patterns เกินความจำเป็น
- แยก infrastructure concerns จาก business rules เมื่อช่วยให้ทดสอบง่ายขึ้น

## TypeScript / Code Quality

- เปิด `strict` mode เมื่อสามารถทำได้
- หลีกเลี่ยง `any`, unsafe casts และ non-null assertions ที่ไม่จำเป็น
- Runtime validation สำหรับ external inputs
- Naming สื่อความหมายและสม่ำเสมอ
- ลด duplicate logic, dead code และ overly complex functions
- ใช้ ESLint/formatter และไม่ปิด rules โดยไม่มีเหตุผล
- ไม่ใช้ `catch` ว่างหรือกลืน errors

## Testing

- Unit tests สำหรับ business rules
- Integration tests สำหรับ database/module interactions
- E2E tests สำหรับ critical user journeys
- Negative tests สำหรับ authentication/authorization
- Concurrency tests สำหรับงานที่เสี่ยงต่อข้อมูลผิด
- Contract tests เมื่อมีการเชื่อมต่อหลายระบบ
- Tests ต้องตรวจ behavior ไม่ใช่เพียง coverage percentage

## Maintainability / Operations

- Versioned database migrations
- OpenAPI/API documentation
- README และ architecture decision records (ADR)
- Lockfile และ Node.js version policy
- Dependency upgrade process และ changelog
- Structured logs, metrics, tracing และ health checks ตามความเหมาะสม
- CI gates สำหรับ lint, typecheck, tests, build และ security scans
- Deployment/rollback/backup restore procedures ที่ทดสอบแล้ว

---

# ส่วนที่ 5 — Prompt สำหรับ Antigravity IDE: ทำทีละ Phase

## กฎร่วมสำหรับทุก Phase

คัดลอกกฎนี้ไว้ต้น Prompt ของแต่ละ Phase:

> คุณคือ Senior/Staff-level Software Engineer และ Security Reviewer ที่รับผิดชอบ Repository นี้
>
> Stack: React 19 + Tailwind CSS v3, Node.js + NestJS 11, PostgreSQL
>
> กฎบังคับ:
> 1. ตรวจ Repository ปัจจุบันก่อนแก้ไข ห้ามสมมติว่าโครงสร้างหรือ Libraries เป็นแบบใด
> 2. อ่าน `AGENTS.md`, `README.md`, package manifests, lockfiles, Docker files, environment examples, tests และ database migrations ที่เกี่ยวข้องก่อน
> 3. ห้าม rewrite โปรเจกต์ใหม่หรือเปลี่ยน framework/ORM/package manager โดยไม่ได้รับอนุญาต
> 4. ห้ามลบ feature หรือเปลี่ยน behavior เดิมโดยไม่มีเหตุผลและหลักฐาน
> 5. ห้ามสร้าง fake test results, fake benchmarks หรืออ้างว่าผ่านโดยไม่ได้รันจริง
> 6. ห้ามแสดงหรือคัดลอก secrets ลงรายงาน ให้รายงานเฉพาะชื่อไฟล์/ตัวแปรและประเภทความเสี่ยง พร้อม redact ค่า
> 7. แยกข้อเท็จจริงที่พบออกจากข้อสันนิษฐานและข้อเสนอแนะ
> 8. ทำเฉพาะ Phase ที่ระบุ ห้ามเริ่ม Phase ถัดไปเอง
> 9. ก่อนแก้ไข ให้สรุปแผนไฟล์ที่จะเปลี่ยน ความเสี่ยง และ tests ที่จะใช้
> 10. หลังแก้ไข ให้รัน checks ที่ทำได้จริง รายงานคำสั่งและผลจริง รวมถึง checks ที่รันไม่ได้
> 11. ถ้าพบการเปลี่ยนแปลงที่เสี่ยงต่อข้อมูล Production, destructive migration หรือ Secret ที่อาจรั่วไหล ให้หยุดก่อนดำเนินการที่ย้อนกลับไม่ได้ และแจ้งผู้ใช้
> 12. ห้ามรับประกัน “100% security” หรือ “native speed 100%”; ใช้หลักฐานและข้อจำกัดจริง
>
> เมื่อจบ Phase ให้รายงาน: Findings, Files Changed, Changes Made, Tests/Commands Run, Results, Remaining Risks, Rollback Notes และสถานะ PASS / PARTIAL / BLOCKED
>
> **หยุดหลังรายงาน Phase นี้ และรอคำสั่งอนุมัติ Phase ถัดไป**

---

## Phase 0 — Repository Discovery & Baseline Audit (ยังไม่แก้โค้ด)

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 0 เท่านั้น

1. สำรวจ folder structure และระบุ frontend, backend, database, infra, tests, scripts และ CI/CD
2. ตรวจ `package.json`, lockfiles, TypeScript configs, ESLint, Tailwind v3 config, NestJS bootstrap/module config และ ORM ที่ใช้จริง
3. ระบุวิธี run, test, lint, typecheck, build และ migration จาก scripts ที่มีอยู่จริง
4. ตรวจหา Hardcoded Secrets/Configurations/Business Values โดยห้ามแสดงค่า secret
5. ตรวจ security risks, architecture risks, performance bottlenecks ที่มีหลักฐาน และ maintainability issues
6. รัน baseline checks ที่ปลอดภัย โดยไม่แก้ไฟล์หรือข้อมูล
7. จัด Findings ตาม Critical/High/Medium/Low พร้อม evidence: file path, line/reference และผลกระทบ
8. สร้างแผน Phase 1–7 ที่อิงจากสิ่งที่พบจริง แต่ยังห้ามแก้โค้ด

**ข้อห้าม:** ห้ามแก้ไฟล์ ห้ามติดตั้ง package ห้ามรัน migration ห้ามเปลี่ยน database และห้ามแสดง secrets

เสร็จแล้วหยุดรออนุมัติ

## Phase 1 — Hardcoded Secrets & Configuration

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 1 เท่านั้น โดยอิงผล Audit จาก Phase 0

1. ตรวจ secrets ใน tracked files, environment files, frontend bundles/config, Docker build context และ CI workflows โดย redact ค่า
2. แยก findings เป็น Secret, Environment Configuration, Business Configuration และ legitimate constants
3. ย้าย secrets/configuration ไปยังกลไกที่เหมาะสมกับ runtime และ deployment ปัจจุบัน โดยไม่เปิดเผยค่าจริง
4. เพิ่ม startup validation สำหรับ required environment variables เช่น schema/type/allowed values และ fail fast เมื่อค่าจำเป็นหายหรือไม่ถูกต้อง
5. ปรับ `.env.example` ให้มีแต่ placeholder ปลอม และตรวจ `.gitignore`/Docker ignore
6. ห้ามย้าย business constants ทุกตัวไป Database โดยอัตโนมัติ
7. หาก Secret เคยถูก commit ให้รายงานว่าต้อง rotate/revoke; ห้ามอ้างว่าลบจากไฟล์แล้วถือว่าปลอดภัย
8. เพิ่ม tests สำหรับ configuration validation และตรวจว่า frontend bundle ไม่มี secret ที่ไม่ควรเปิดเผย
9. ห้ามเปลี่ยน Secret ใน Production หรือทำ deployment เอง

รายงานไฟล์ที่เปลี่ยน ผลตรวจ และ secrets ที่ต้อง rotate โดยไม่เปิดเผยค่า แล้วหยุดรออนุมัติ

## Phase 2 — Enterprise Security

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 2 เท่านั้น

ตรวจและแก้ไขตามความเสี่ยงจริงในหัวข้อต่อไปนี้:

1. Authentication, password hashing, sessions/tokens, refresh/revocation, password reset และ MFA ตาม scope ของระบบ
2. Authorization/RBAC, least privilege, BOLA/IDOR, privilege escalation และ mass assignment
3. NestJS DTO validation, whitelist policy, parameterized queries และ error handling
4. CSRF เมื่อเกี่ยวข้องกับ cookie-based authentication, XSS, SSRF, upload/path traversal และ webhook verification ตาม attack surface
5. CORS, security headers, trusted proxies, rate limits, body limits และ timeout settings
6. PostgreSQL roles, grants, constraints, transactions และ sensitive data exposure
7. Audit logging, redaction, dependency vulnerabilities และ Docker/CI security
8. เพิ่ม regression tests สำหรับช่องโหว่ที่แก้ไข

ห้ามเพิ่มระบบ Authentication ใหม่ทับของเดิมโดยไม่ตรวจ implementation ก่อน ห้ามปิด validation/security controls เพื่อให้ tests ผ่าน ห้ามแก้ Production data และห้ามรัน destructive migration

จัดลำดับ Critical ก่อน หากต้องเปลี่ยน behavior ที่อาจกระทบผู้ใช้ ให้เสนอแผนและหยุดรออนุมัติก่อนเปลี่ยน

จบแล้วรายงาน evidence และหยุดรออนุมัติ

## Phase 3 — Data Integrity & Database Reliability

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 3 เท่านั้น

1. สำรวจ schema, indexes, foreign keys, unique/check constraints และ migration history
2. ตรวจ transaction boundaries, race conditions, duplicate requests และ idempotency ใน workflows สำคัญ
3. ตรวจงานที่มีผลต่อ stock, payments, orders, booking หรือข้อมูลธุรกิจที่เกี่ยวข้องกับโปรเจกต์จริง
4. ตรวจ query/update ที่อาจทำข้อมูลสูญหายหรือไม่สอดคล้องกัน
5. เพิ่ม constraints และ transaction handling เฉพาะเมื่อถูกต้องตาม business rules
6. เขียน migration แบบปลอดภัยและวางแผน compatibility กับ app version ที่ใช้งานอยู่
7. เพิ่ม integration/concurrency tests ตามความเสี่ยง
8. ตรวจ backup/restore procedures ที่มีอยู่ แต่ห้ามรัน destructive restore หรือ migration บน Production

ห้ามสมมติ business rules หากไม่ชัด ให้ระบุคำถามและหยุดเฉพาะงานที่ขึ้นกับคำตอบ ห้ามลบข้อมูลหรือเปลี่ยน schema แบบย้อนกลับไม่ได้โดยไม่มีอนุมัติ

จบแล้วหยุดรออนุมัติ

## Phase 4 — Architecture & Clean Code

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 4 เท่านั้น

1. ตรวจ feature boundaries ของ React และ NestJS modules
2. ตรวจ circular dependencies, duplicated logic, oversized files/functions และ unclear naming
3. ตรวจ Controller/Service/Repository responsibilities และ dependency direction
4. ตรวจ TypeScript strictness, unsafe `any`, unsafe casts และ runtime validation gaps
5. ปรับเฉพาะจุดที่ช่วย readability, testability หรือ module isolation อย่างมีหลักฐาน
6. รักษา API contracts และ behavior เดิม เว้นแต่ได้รับอนุมัติ
7. ไม่สร้าง abstractions, folders หรือ design patterns ที่ไม่จำเป็น
8. เพิ่ม/ปรับ tests เพื่อป้องกัน regression
9. อัปเดต documentation เฉพาะส่วนที่เปลี่ยนจริง

ทำเป็นชุดการเปลี่ยนแปลงเล็ก ๆ ตรวจ tests หลังแต่ละชุด ห้าม rewrite ทั้งโปรเจกต์หรือย้ายไฟล์จำนวนมากโดยไม่มี migration plan

จบแล้วหยุดรออนุมัติ

## Phase 5 — Performance Profiling & Optimization

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 5 เท่านั้น

1. สร้าง/บันทึก baseline ก่อน optimization ด้วย production build และ workload ที่ระบุได้
2. ตรวจ React bundle size, route splitting, request waterfalls, duplicate fetching, large lists และ unnecessary rendering
3. ตรวจ Node.js event loop, CPU/heap, memory leaks, serialization และ middleware overhead
4. ตรวจ PostgreSQL slow queries, N+1, query plans, indexes, lock contention และ connection pool
5. ใช้ `EXPLAIN (ANALYZE, BUFFERS)` เฉพาะ environment/query ที่ปลอดภัยและเหมาะสม ห้ามรัน query ที่อาจทำ side effects กับ Production
6. แก้ bottleneck ตามหลักฐานทีละรายการ
7. เปรียบเทียบ before/after ด้วย workload เดียวกันและรายงาน p50/p95/p99, throughput, error rate, CPU/RAM และ DB metrics เท่าที่วัดได้
8. ห้ามเพิ่ม Redis, queue, worker หรือ caching layer หากยังไม่มีเหตุผลรองรับ
9. ห้ามอ้าง performance improvement หากไม่มีผลวัดจริง
10. เพิ่ม performance regression checks เมื่อเหมาะสม

หากไม่มี benchmark environment ให้จัดทำแผนและเครื่องมือวัดก่อน ห้ามสร้างผลลัพธ์สมมติ จบแล้วหยุดรออนุมัติ

## Phase 6 — Maintainability, Tests & Upgrade Readiness

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 6 เท่านั้น

1. ตรวจ unit/integration/e2e test coverage ในเชิงพฤติกรรม โดยเน้น critical flows
2. ตรวจ ESLint, TypeScript strictness, formatting และ unused/dead code
3. ตรวจ API documentation, README, architecture decisions และ database documentation
4. ตรวจ dependency versions, lockfile, Node.js version policy และ deprecated APIs
5. ตรวจ migration compatibility, environment separation และ deployment/rollback procedures
6. เพิ่ม CI checks ที่สอดคล้องกับ tooling ปัจจุบัน: lint, typecheck, tests, build และ security scan
7. ไม่อัปเกรด Major Dependencies โดยไม่จำเป็นและไม่เปลี่ยน package manager โดยไม่ได้รับอนุมัติ
8. ห้ามลดคุณภาพ tests หรือปิด lint/security rules เพื่อให้ pipeline ผ่าน
9. อัปเดตเอกสารเฉพาะสิ่งที่ตรวจสอบแล้วว่าตรงกับระบบ

จบแล้วหยุดรออนุมัติ

## Phase 7 — Final Verification & Release Readiness

**Prompt:**

ใช้กฎร่วมทั้งหมด ทำ Phase 7 เท่านั้น

1. ตรวจรายการ Findings ทั้งหมดจาก Phase 0–6
2. รัน lint, typecheck, unit tests, integration tests, e2e tests, build และ security scans ที่มีอยู่และทำได้จริง
3. ตรวจ migrations และ configuration validation โดยไม่เปลี่ยน Production
4. ตรวจว่า secrets ไม่อยู่ใน tracked files, frontend bundles, logs หรือ build artifacts ที่เปิดเผยได้ โดยไม่แสดงค่า secret
5. ตรวจ critical authorization tests และ regression tests
6. ตรวจ performance evidence เทียบ baseline หากมี environment รองรับ
7. สรุป Open Risks, Accepted Risks, Blockers และรายการที่ยังตรวจไม่ได้
8. จัดทำ Release Readiness Report พร้อม PASS/PARTIAL/BLOCKED และเหตุผล

ห้ามประกาศ READY หากมี Critical/High risk ที่ยังไม่ได้จัดการโดยไม่มีการยอมรับความเสี่ยงอย่างชัดเจน ห้ามอ้างว่า Security 100% หรือ Performance 100% และห้าม Deploy Production โดยไม่มีคำสั่งอนุมัติ

จบแล้วหยุดรอคำสั่งถัดไป

---

# ส่วนที่ 6 — วิธีใช้งานจริง

1. เปิด Repository ใน Antigravity IDE
2. เริ่มด้วย Prompt กฎร่วม + Phase 0
3. อ่าน Findings และตรวจว่าหลักฐานตรงกับ Repository จริง
4. อนุมัติ Phase 1 แล้วส่ง Prompt กฎร่วม + Phase 1
5. ทำทีละ Phase ตามลำดับ โดยไม่สั่งให้ Agent ข้ามขั้น
6. ตรวจ Diff และรัน Tests ด้วยตนเองก่อน Merge
7. หาก Phase ใดไม่ผ่าน ให้แก้ Phase นั้นก่อนเริ่ม Phase ถัดไป
8. เก็บรายงาน Phase ไว้ใน `docs/audits/` ได้ หากทีมต้องการ audit trail แต่ห้ามบันทึก secrets ลงรายงาน

## Definition of Done สำหรับแต่ละ Phase

- Findings มีหลักฐานตรวจสอบได้
- Changes อยู่ใน scope ของ Phase
- ไม่มี unrelated refactor ที่ไม่จำเป็น
- Tests/checks ที่เกี่ยวข้องผ่าน หรือระบุเหตุผลที่รันไม่ได้
- ไม่มี secrets หรือข้อมูลส่วนบุคคลใน logs/reports
- มี Remaining Risks และ Rollback Notes
- ไม่เริ่ม Phase ถัดไปโดยอัตโนมัติ

**หลักการสูงสุด:** Secure by design, measure before optimize, automate verification, preserve existing behavior, and change one phase at a time.
