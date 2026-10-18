--
-- PostgreSQL database dump
--

\restrict 2KFW7OpuFDiatvGxY7Kf2LrC6QOmtfjZAwlWlqU5Pb16yAb9x9Iz2YgFNfyeNWP

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: parko
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO parko;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: parko
--

COMMENT ON SCHEMA public IS '';


--
-- Name: LostTicketResolution; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."LostTicketResolution" AS ENUM (
    'PENDING',
    'RESOLVED',
    'ESCALATED'
);


ALTER TYPE public."LostTicketResolution" OWNER TO parko;

--
-- Name: MemberStatus; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."MemberStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public."MemberStatus" OWNER TO parko;

--
-- Name: MemberType; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."MemberType" AS ENUM (
    'WEEKLY',
    'MONTHLY',
    'CUSTOM'
);


ALTER TYPE public."MemberType" OWNER TO parko;

--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'EMAIL',
    'TELEGRAM',
    'DISCORD'
);


ALTER TYPE public."NotificationChannel" OWNER TO parko;

--
-- Name: ParkingType; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."ParkingType" AS ENUM (
    'HOURLY',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'CUSTOM'
);


ALTER TYPE public."ParkingType" OWNER TO parko;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'QR_PAYMENT',
    'TRANSFER'
);


ALTER TYPE public."PaymentMethod" OWNER TO parko;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'UNPAID',
    'PAID',
    'WAIVED',
    'PENDING'
);


ALTER TYPE public."PaymentStatus" OWNER TO parko;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'STAFF'
);


ALTER TYPE public."Role" OWNER TO parko;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: parko
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'LOST'
);


ALTER TYPE public."TicketStatus" OWNER TO parko;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO parko;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    user_id uuid,
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(100),
    old_data jsonb,
    new_data jsonb,
    ip_address character varying(45),
    user_agent character varying(500),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO parko;

--
-- Name: lost_ticket_cases; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.lost_ticket_cases (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    vehicle_photo_url text,
    driver_photo_url text,
    id_card_photo_url text,
    notes text NOT NULL,
    resolution public."LostTicketResolution" DEFAULT 'PENDING'::public."LostTicketResolution" NOT NULL,
    penalty_amount numeric(12,2) DEFAULT 0 NOT NULL,
    resolved_at timestamp(3) without time zone,
    resolved_by uuid,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lost_ticket_cases OWNER TO parko;

--
-- Name: memberships; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.memberships (
    id uuid NOT NULL,
    member_code character varying(20) NOT NULL,
    plate_number character varying(20) NOT NULL,
    plate_province character varying(50),
    vehicle_type_id integer NOT NULL,
    member_type public."MemberType" NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0 NOT NULL,
    payment_method public."PaymentMethod" DEFAULT 'CASH'::public."PaymentMethod" NOT NULL,
    status public."MemberStatus" DEFAULT 'ACTIVE'::public."MemberStatus" NOT NULL,
    notes text,
    created_by uuid NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.memberships OWNER TO parko;

--
-- Name: notification_configs; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.notification_configs (
    id uuid NOT NULL,
    channel public."NotificationChannel" NOT NULL,
    config jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notification_configs OWNER TO parko;

--
-- Name: parking_tickets; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.parking_tickets (
    id uuid NOT NULL,
    ticket_number character varying(10) NOT NULL,
    vehicle_type_id integer NOT NULL,
    plate_number character varying(20),
    plate_province character varying(50),
    qr_code_data text NOT NULL,
    status public."TicketStatus" DEFAULT 'ACTIVE'::public."TicketStatus" NOT NULL,
    parking_type public."ParkingType" DEFAULT 'HOURLY'::public."ParkingType" NOT NULL,
    custom_start timestamp(3) without time zone,
    custom_end timestamp(3) without time zone,
    prepaid_amount numeric(12,2),
    check_in_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    check_out_at timestamp(3) without time zone,
    total_amount numeric(12,2),
    payment_status public."PaymentStatus" DEFAULT 'UNPAID'::public."PaymentStatus" NOT NULL,
    checked_in_by uuid NOT NULL,
    checked_out_by uuid,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    membership_id uuid,
    plate_letters character varying(10)
);


ALTER TABLE public.parking_tickets OWNER TO parko;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method public."PaymentMethod" NOT NULL,
    reference_number character varying(100),
    received_by uuid NOT NULL,
    paid_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payments OWNER TO parko;

--
-- Name: pricing_rules; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.pricing_rules (
    id uuid NOT NULL,
    vehicle_type_id integer NOT NULL,
    pricing_type public."ParkingType" NOT NULL,
    base_price numeric(12,2) DEFAULT 0 NOT NULL,
    hourly_rate numeric(12,2) DEFAULT 0 NOT NULL,
    daily_rate numeric(12,2) DEFAULT 0 NOT NULL,
    weekly_rate numeric(12,2) DEFAULT 0 NOT NULL,
    monthly_rate numeric(12,2) DEFAULT 0 NOT NULL,
    yearly_rate numeric(12,2) DEFAULT 0 NOT NULL,
    free_minutes integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    effective_from timestamp(3) without time zone,
    effective_to timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pricing_rules OWNER TO parko;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token character varying(500) NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO parko;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.system_settings (
    id uuid NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description character varying(255),
    updated_at timestamp(3) without time zone NOT NULL,
    updated_by uuid
);


ALTER TABLE public.system_settings OWNER TO parko;

--
-- Name: users; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    display_name character varying(100) NOT NULL,
    role public."Role" DEFAULT 'STAFF'::public."Role" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    phone_number character varying(20)
);


ALTER TABLE public.users OWNER TO parko;

--
-- Name: vehicle_types; Type: TABLE; Schema: public; Owner: parko
--

CREATE TABLE public.vehicle_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    label character varying(100) NOT NULL,
    icon character varying(50) NOT NULL,
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vehicle_types OWNER TO parko;

--
-- Name: vehicle_types_id_seq; Type: SEQUENCE; Schema: public; Owner: parko
--

CREATE SEQUENCE public.vehicle_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehicle_types_id_seq OWNER TO parko;

--
-- Name: vehicle_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parko
--

ALTER SEQUENCE public.vehicle_types_id_seq OWNED BY public.vehicle_types.id;


--
-- Name: vehicle_types id; Type: DEFAULT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.vehicle_types ALTER COLUMN id SET DEFAULT nextval('public.vehicle_types_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f83aba5a-f130-45f9-b5ed-5912eb0fda69	30eb133247d86aff60728e1a226fdbdd76c03c6f3247d86bbc48eb782fae3caa	2026-05-01 14:30:18.479701+00	20260501141913_init	\N	\N	2026-05-01 14:30:17.884689+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;

\.


--
-- Data for Name: lost_ticket_cases; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.lost_ticket_cases (id, ticket_id, staff_id, vehicle_photo_url, driver_photo_url, id_card_photo_url, notes, resolution, penalty_amount, resolved_at, resolved_by, created_at, updated_at) FROM stdin;
cb3e32a9-be7e-486d-9d69-e6b0cc1d4026	88f8f3b6-638f-4f62-a011-4bdfaafa5054	e779f0bf-302e-41dd-b520-399e0a218403	/uploads/a54e4bb6-af10-458c-b404-01128883a927.png	/uploads/26da5b42-9999-426e-9c91-85373c7a4c30.png	/uploads/0c266e40-7539-4273-8723-34fcdf435dd3.png	kkkk	PENDING	100000.00	\N	\N	2026-05-03 12:52:21.095	2026-05-03 12:52:21.095
70070a65-3ff9-48f8-90f1-ee595fe7080a	c3169f58-8630-4a2e-a455-e832d9ea5b46	e779f0bf-302e-41dd-b520-399e0a218403	/uploads/4be5db27-4092-471a-ab46-f81633a91903.png	/uploads/886bffdf-4457-40d9-b854-1117d3e2184a.png	/uploads/1981b030-2647-4cb8-b5cc-3ade7f4e0b9c.png	kkk	PENDING	1000000.00	\N	\N	2026-05-03 12:54:21.113	2026-05-03 12:54:21.113
\.


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.memberships (id, member_code, plate_number, plate_province, vehicle_type_id, member_type, start_date, end_date, paid_amount, payment_method, status, notes, created_by, created_at, updated_at) FROM stdin;
cee18701-e06f-4b9c-b408-cc6226136e89	M-00002	ກກ 1234	ວຽງຈັນ	2	MONTHLY	2026-05-04 00:00:00	2026-06-04 00:00:00	150000.00	CASH	ACTIVE	ສະ	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 08:24:11.191	2026-05-04 08:24:11.191
46e41468-5a0e-44f6-9789-d4db4e2e4a53	M-00003	aa 1234	ນະຄອນຫຼວງ	2	WEEKLY	2026-05-04 00:00:00	2026-05-11 00:00:00	80000.00	CASH	ACTIVE		e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 10:43:22.403	2026-05-04 10:43:22.403
a770635a-8860-40d7-8465-48daaed82401	M-00004	aa 1234		2	WEEKLY	2026-05-04 00:00:00	2026-05-11 00:00:00	80000.00	CASH	ACTIVE		e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 10:44:17.24	2026-05-04 10:44:17.24
d44aacd9-4555-416f-b08a-2a918b3a83d9	M-00006	aa 9999	ນະຄອນຫຼວງ	2	WEEKLY	2026-05-04 00:00:00	2026-05-11 00:00:00	80000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 12:10:32.699	2026-05-04 12:10:32.699
bf3b8c63-8d44-4950-93a5-8c1f702e00e9	M-00005	aa 1234	ນະຄອນຫຼວງ	2	WEEKLY	2026-05-04 00:00:00	2026-05-11 00:00:00	80000.00	CASH	CANCELLED		e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 10:44:38.968	2026-05-04 12:10:52.739
b3f1933f-80ef-47f8-8eb4-9da8d5292baa	M-00007	aa 9999	ນະຄອນຫລວງ	2	MONTHLY	2026-05-04 00:00:00	2026-06-04 00:00:00	150000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 12:19:39.436	2026-05-04 12:19:39.436
2b091c45-968d-4436-89fe-5a075c8043fa	M-00008	aa 9999	ນະຄອນຫລວງ	1	MONTHLY	2026-05-04 00:00:00	2026-06-04 00:00:00	250000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 12:20:04.65	2026-05-04 12:20:04.65
3d5838ad-e81f-4de7-8a6c-5ae0ddbf6398	M-00010	AA 1111	ໄຊຍະບູລີ	2	WEEKLY	2026-05-06 00:00:00	2026-05-13 00:00:00	80000.00	CASH	ACTIVE	ok	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:04:56.005	2026-05-06 07:04:56.005
6ca5c0d2-79bb-476f-b294-689cdfc9071c	M-00011	BB 9999	ນະຄອນຫລວງ	2	WEEKLY	2026-05-06 00:00:00	2026-05-13 00:00:00	80000.00	CASH	ACTIVE	ok	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:56:28.474	2026-05-06 07:56:28.474
d6c5992a-681b-47e3-8043-afd237ef0297	M-00012	CC 9999	ນະຄອນຫລວງ	2	WEEKLY	2026-05-06 00:00:00	2026-05-13 00:00:00	0.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 08:12:27.278	2026-05-06 08:12:27.278
03129b53-2d6a-4e4b-8502-1c23bfbc4fe9	M-00013	AB 9999	ນະຄອນຫລວງ	2	MONTHLY	2026-05-06 00:00:00	2026-06-06 00:00:00	150000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 08:13:28.286	2026-05-06 08:13:28.286
3e6e89fe-dd57-4b4e-8a9b-b6ed5971c8d5	M-00014	AS 1111	ນະຄອນຫລວງ	2	WEEKLY	2026-05-06 00:00:00	2026-05-13 00:00:00	80000.00	CASH	ACTIVE	ok	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 09:02:46.922	2026-05-06 09:02:46.922
8628d1be-6245-4bb9-8df1-e33437df618e	M-00018	AF 9999	ນະຄອນຫລວງ	2	MONTHLY	2026-05-06 00:00:00	2026-06-06 00:00:00	150000.00	CASH	ACTIVE	okkk	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 11:05:30.497	2026-05-06 11:05:30.497
404139da-a792-455d-9ddf-45c71bb1139c	M-00021	ກຂ 1234	ວຽງຈັນ	2	MONTHLY	2026-05-06 00:00:00	2026-06-06 00:00:00	150000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 12:19:58.135	2026-05-06 12:19:58.135
aaa4417e-6b27-4226-b5dd-89c710b6d231	M-00009	BB 1111	ນະຄອນຫລວງ	2	WEEKLY	2026-05-04 00:00:00	2026-05-11 00:00:00	80000.00	CASH	CANCELLED	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 12:29:19.882	2026-05-06 13:04:22.695
44493b88-0f85-4b31-a00d-fe0f03cf68c7	M-00015	AB 9999	ຜົ້ງສາລີ	2	MONTHLY	2026-05-06 00:00:00	2026-06-06 00:00:00	150000.00	CASH	ACTIVE	oiuo	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 09:03:44.695	2026-05-06 13:27:53.498
33200e42-10cd-4f96-a869-b4e4913c5278	M-00020		\N	1	WEEKLY	2026-05-06 00:00:00	2026-05-13 00:00:00	100000.00	CASH	CANCELLED	ລົດບໍ່ມີປ້າຍ	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 11:09:54.626	2026-05-06 13:28:07.79
9decb039-0c61-4fa4-a8a7-17a5084b4a03	M-00022	ກກ 4444	ນະຄອນຫລວງ	2	WEEKLY	2026-05-06 00:00:00	2026-05-13 00:00:00	80000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 17:07:50.1	2026-05-06 17:07:50.1
be2b95b2-1ade-4ee4-a50a-278286d67d12	M-00023	ກກ 8888	ໄຊຍະບູລີ	2	WEEKLY	2026-05-08 00:00:00	2026-05-15 00:00:00	80000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 05:20:21.484	2026-05-08 05:20:21.484
a2db9670-8bc5-496e-b07f-eea41aa48128	M-00024	ກຫ 2222	ໄຊຍະບູລີ	2	WEEKLY	2026-05-08 00:00:00	2026-05-15 00:00:00	80000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 10:35:59.99	2026-05-08 10:35:59.99
33ce82f3-462b-41f4-891a-cdc6d55f252d	M-00025	ສນ 1111	ນະຄອນຫລວງ	4	WEEKLY	2026-05-08 00:00:00	2026-05-15 00:00:00	250000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 10:37:16.156	2026-05-08 10:37:16.156
6200dc34-fdd0-45e7-8715-d3e1fce27666	M-00026	ກຮ 3333	ໄຊສົມບູນ	1	MONTHLY	2026-05-08 00:00:00	2026-06-08 00:00:00	260000.00	CASH	ACTIVE	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 10:37:47.723	2026-05-08 10:37:47.723
e72563fc-1d4e-4701-9fcf-8851fab5acae	M-00019		\N	4	WEEKLY	2026-05-06 00:00:00	2026-05-13 00:00:00	250000.00	CASH	CANCELLED	ooooo	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 11:05:59.094	2026-05-08 11:07:48.795
\.


--
-- Data for Name: notification_configs; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.notification_configs (id, channel, config, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: parking_tickets; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.parking_tickets (id, ticket_number, vehicle_type_id, plate_number, plate_province, qr_code_data, status, parking_type, custom_start, custom_end, prepaid_amount, check_in_at, check_out_at, total_amount, payment_status, checked_in_by, checked_out_by, notes, created_at, updated_at, membership_id, plate_letters) FROM stdin;
11b86aa2-99d1-44b4-bdb7-29b9cc6d9ade	17391	2	8028	ຈຈ	{"ticketNumber":"17391","vehicleType":"motorcycle","plateNumber":"8028","checkInAt":"2026-05-01T15:11:03.819Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	\N	2026-05-01 15:11:03.825	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-01 15:11:03.825	2026-05-01 15:11:03.825	\N	\N
c9b85c1d-8e57-4657-a16a-6e25a95e701c	45705	3	\N	\N	{"ticketNumber":"45705","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-01T15:17:10.015Z","system":"PARKO"}	ACTIVE	HOURLY	\N	\N	\N	2026-05-01 15:17:10.018	\N	\N	UNPAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-01 15:17:10.018	2026-05-01 15:17:10.018	\N	\N
c1d4ab24-93be-4e41-a332-2846a828c76f	10774	1	3333	ໄຊສົມບູນ	{"ticketNumber":"10774","vehicleType":"car","plateNumber":"ກຮ 3333","plateProvince":"ໄຊສົມບູນ","checkInAt":"2026-05-08T15:26:06.675Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	0.00	2026-05-08 15:26:06.679	\N	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-08 15:26:06.679	2026-05-08 15:26:06.679	6200dc34-fdd0-45e7-8715-d3e1fce27666	ກຮ
0e6f9f77-4e6f-43de-9b7e-fb81a8ff6dcf	11576	2	7689	ສສ	{"ticketNumber":"11576","vehicleType":"motorcycle","plateNumber":"7689","checkInAt":"2026-05-01T16:35:14.942Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	\N	2026-05-01 16:35:14.95	2026-05-01 16:37:07.754	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-01 16:35:14.95	2026-05-01 16:37:07.757	\N	\N
1892dd22-9aeb-4206-8ce6-e7f1b1a14abc	93897	2	ກກ 6790	ບໍລິຄຳໄຊ	{"ticketNumber":"93897","vehicleType":"motorcycle","plateNumber":"ກກ 6790","checkInAt":"2026-05-01T16:58:45.830Z","system":"PARKO"}	ACTIVE	HOURLY	\N	\N	\N	2026-05-01 16:58:45.834	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-01 16:58:45.834	2026-05-01 16:58:45.834	\N	\N
e6af9449-2422-43da-9746-c0a8ea8f6a58	41690	2	ກກ 2345	ສະຫວັນນະເຂດ	{"ticketNumber":"41690","vehicleType":"motorcycle","plateNumber":"ກກ 2345","checkInAt":"2026-05-01T17:09:59.605Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	\N	2026-05-01 17:09:59.608	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	ສີປ້າຍ: ປ້າຍເຫຼືອງ (ສ່ວນຕົວ)	2026-05-01 17:09:59.608	2026-05-01 17:09:59.608	\N	\N
264430b5-ce48-4b32-abd5-2cdfb3915205	68711	2	7666	ໄຊສົມບູນ	{"ticketNumber":"68711","vehicleType":"motorcycle","plateNumber":"ດດ 7666","plateProvince":"ໄຊສົມບູນ","checkInAt":"2026-05-09T05:00:54.620Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 05:00:54.623	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-09 05:00:54.623	2026-05-09 05:00:54.623	\N	ດດ
3e20c382-519a-41bd-bbe8-94b82c1dcf5c	62677	2	ຫຫ 2653	ຜົ້ງສາລີ	{"ticketNumber":"62677","vehicleType":"motorcycle","plateNumber":"ຫຫ 2653","checkInAt":"2026-05-02T04:55:29.634Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	\N	2026-05-02 04:55:29.637	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 04:55:29.637	2026-05-02 04:55:29.637	\N	\N
74520332-b9e0-4789-8a58-a4b8d4db7ffa	86736	1	\N	\N	{"ticketNumber":"86736","vehicleType":"car","plateNumber":null,"checkInAt":"2026-05-02T05:02:15.303Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	\N	2026-05-02 05:02:15.304	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 05:02:15.304	2026-05-02 05:02:15.304	\N	\N
26b4d054-64ee-48ab-8713-d7a1948ce136	78045	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"78045","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T05:02:58.571Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	\N	2026-05-02 05:02:58.572	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 05:02:58.572	2026-05-02 05:02:58.572	\N	\N
b6f56da1-106d-4088-842e-cbd6f96c4cf7	12923	1	\N	\N	{"ticketNumber":"12923","vehicleType":"car","plateNumber":null,"checkInAt":"2026-05-02T05:03:51.051Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	\N	2026-05-02 05:03:51.053	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 05:03:51.053	2026-05-02 05:03:51.053	\N	\N
7b7b52e4-bd21-4d37-87d9-de7cf9a758cf	11571	2	2222	ວຽງຈັນ	{"ticketNumber":"11571","vehicleType":"motorcycle","plateNumber":"ນນ 2222","plateProvince":"ວຽງຈັນ","checkInAt":"2026-05-09T05:01:08.454Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 05:01:08.456	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-09 05:01:08.456	2026-05-09 05:01:08.456	\N	ນນ
a4cd84ec-7c72-46a0-8d0d-504c6a3fb082	90632	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"90632","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T05:06:42.463Z","system":"PARKO"}	ACTIVE	HOURLY	\N	\N	\N	2026-05-02 05:06:42.467	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 05:06:42.467	2026-05-02 05:06:42.467	\N	\N
6500c538-1ca2-44c8-8ff7-e6ee4b729c26	34331	2	ກກ 2365	ໄຊສົມບູນ	{"ticketNumber":"34331","vehicleType":"motorcycle","plateNumber":"ກກ 2365","checkInAt":"2026-05-02T05:51:30.891Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	\N	2026-05-02 05:51:30.895	2026-05-02 06:01:03.548	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 05:51:30.895	2026-05-02 06:01:03.552	\N	\N
4486c6b8-c1a4-48d6-a589-a5a1ab2485fd	73100	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"73100","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T05:22:13.402Z","system":"PARKO"}	COMPLETED	HOURLY	\N	\N	\N	2026-05-02 05:22:13.405	2026-05-02 06:02:11.069	3000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 05:22:13.405	2026-05-02 06:02:11.073	\N	\N
f5a927f3-a9e3-4c20-8ae4-d659cecece22	99437	2	\N	\N	{"ticketNumber":"99437","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-02T05:19:10.547Z","system":"PARKO"}	COMPLETED	HOURLY	\N	\N	\N	2026-05-02 05:19:10.55	2026-05-02 06:04:33.472	3000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 05:19:10.55	2026-05-02 06:04:33.474	\N	\N
756ae853-5d71-4a2d-85d0-b74e6a91383e	32760	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"32760","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T05:09:03.156Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	\N	2026-05-02 05:09:03.159	2026-05-02 06:04:51.429	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 05:09:03.159	2026-05-02 06:04:51.433	\N	\N
ea7cca9c-e679-4f1d-88bc-4a080a547c8e	70182	2	\N	\N	{"ticketNumber":"70182","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-02T05:04:18.746Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	\N	\N	2026-05-02 05:04:18.749	2026-05-02 06:05:14.954	80000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 05:04:18.749	2026-05-02 06:05:14.956	\N	\N
6d1affc8-f8a0-4fcf-95cc-b0c8da83e339	88976	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"88976","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T06:06:48.877Z","system":"PARKO"}	ACTIVE	HOURLY	\N	\N	\N	2026-05-02 06:06:48.879	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 06:06:48.879	2026-05-02 06:06:48.879	\N	\N
e35c88d0-e543-408b-b48f-43630de495cc	38413	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"38413","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T06:06:57.879Z","system":"PARKO"}	COMPLETED	HOURLY	\N	\N	\N	2026-05-02 06:06:57.88	2026-05-02 06:07:05.9	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 06:06:57.88	2026-05-02 06:07:05.902	\N	\N
1a6d648b-7783-4ac9-ad6c-773b03e5784f	32714	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"32714","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T06:06:54.571Z","system":"PARKO"}	COMPLETED	HOURLY	\N	\N	\N	2026-05-02 06:06:54.572	2026-05-02 06:07:14.849	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 06:06:54.572	2026-05-02 06:07:14.851	\N	\N
3be78105-2f0d-471d-8f4c-00fca9f29190	36511	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"36511","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T06:17:29.980Z","system":"PARKO"}	ACTIVE	HOURLY	\N	\N	\N	2026-05-02 06:17:29.982	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 06:17:29.982	2026-05-02 06:17:29.982	\N	\N
0ff9180d-a7c5-411c-85ee-212e895c6043	21888	4	\N	\N	{"ticketNumber":"21888","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T06:17:39.829Z","system":"PARKO"}	ACTIVE	HOURLY	\N	\N	\N	2026-05-02 06:17:39.831	\N	\N	UNPAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 06:17:39.831	2026-05-02 06:17:39.831	\N	\N
5cb39f60-226c-48c8-b465-b766e3d4dae9	77258	2	\N	\N	{"ticketNumber":"77258","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-02T10:01:37.032Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 10:01:37.033	2026-05-02 10:02:26.164	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 10:01:37.033	2026-05-02 10:02:26.167	\N	\N
7f4176e4-67ca-4767-9865-78686c95ee25	42767	1	\N	\N	{"ticketNumber":"42767","vehicleType":"car","plateNumber":null,"checkInAt":"2026-05-02T09:49:41.273Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	30000.00	2026-05-02 09:49:41.274	2026-05-02 10:02:29.7	30000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 09:49:41.274	2026-05-02 10:02:29.704	\N	\N
82c82ffc-ce4a-432c-a501-774380219017	60270	1	1234	ນະຄອນຫລວງ	{"ticketNumber":"60270","vehicleType":"car","plateNumber":"1234","checkInAt":"2026-05-02T09:45:24.145Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	30000.00	2026-05-02 09:45:24.151	2026-05-04 08:25:53.629	30000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 09:45:24.151	2026-05-04 08:25:53.63	\N	\N
fd43a45e-ad21-4a80-a0c9-9b43f770b8cb	76075	1	KK 1234	ບໍລິຄຳໄຊ	{"ticketNumber":"76075","vehicleType":"car","plateNumber":"KK 1234","checkInAt":"2026-05-01T17:13:47.592Z","system":"PARKO"}	COMPLETED	HOURLY	\N	\N	\N	2026-05-01 17:13:47.594	2026-05-04 09:19:53.673	325000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-01 17:13:47.594	2026-05-04 09:19:53.674	\N	\N
69748640-e833-4067-9635-13fd51200747	55061	2	KK 3333	ບໍ່ແກ້ວ	{"ticketNumber":"55061","vehicleType":"motorcycle","plateNumber":"KK 3333","checkInAt":"2026-05-02T10:01:59.752Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 10:01:59.754	2026-05-02 10:02:21.945	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 10:01:59.754	2026-05-02 10:02:21.948	\N	\N
fdc06f4e-3a69-4de1-a8d7-edf15e61cc44	37904	4	\N	\N	{"ticketNumber":"37904","vehicleType":"truck","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-09T09:16:23.540Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	80000.00	2026-05-09 09:16:23.543	\N	80000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-09 09:16:23.543	2026-05-09 09:16:23.543	\N	\N
be5953df-29be-43e3-9f43-df5d80d18e5b	98074	2	ກກ 2222	ອຸດົມໄຊ	{"ticketNumber":"98074","vehicleType":"motorcycle","plateNumber":"ກກ 2222","checkInAt":"2026-05-02T10:37:11.909Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	\N	100000.00	2026-05-02 10:37:11.912	2026-05-02 11:13:13.339	100000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 10:37:11.912	2026-05-02 11:13:13.342	\N	\N
022b3b79-c0ab-40c0-b459-c23d6abed3be	45124	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"45124","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T11:23:33.687Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 11:23:33.689	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 11:23:33.689	2026-05-02 11:23:33.689	\N	\N
d1268bb7-d4b4-4815-8157-bdbf0a27c493	37871	2	ສສ 2563	ວຽງຈັນ	{"ticketNumber":"37871","vehicleType":"motorcycle","plateNumber":"ສສ 2563","checkInAt":"2026-05-02T11:26:03.529Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 11:26:03.532	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 11:26:03.532	2026-05-02 11:26:03.532	\N	\N
516a28f8-584c-4cad-b5b0-1ee5b29dc7e2	56305	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"56305","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T11:39:14.325Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 11:39:14.327	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 11:39:14.327	2026-05-02 11:39:14.327	\N	\N
0d9cd583-664d-440a-89f0-2da6e42d4fe6	62782	4	\N	\N	{"ticketNumber":"62782","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T11:44:04.346Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 11:44:04.348	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 11:44:04.348	2026-05-02 11:44:04.348	\N	\N
60e93f6f-423c-4b49-b5f6-aa2232297ff7	12864	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"12864","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T11:51:07.437Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 11:51:07.438	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 11:51:07.438	2026-05-02 11:51:07.438	\N	\N
759e509e-e67d-4855-9554-fc29444b7695	48901	2	ກກ 2356	ສະຫວັນນະເຂດ	{"ticketNumber":"48901","vehicleType":"motorcycle","plateNumber":"ກກ 2356","checkInAt":"2026-05-02T12:01:34.045Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 12:01:34.047	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 12:01:34.047	2026-05-02 12:01:34.047	\N	\N
7ff348a9-9d75-448f-8599-768282e2baf7	50460	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"50460","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T12:02:16.802Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 12:02:16.803	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 12:02:16.803	2026-05-02 12:02:16.803	\N	\N
a0072910-2b85-45bf-b7ab-4adc81cdb003	26969	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"26969","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T12:14:05.926Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 12:14:05.929	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 12:14:05.929	2026-05-02 12:14:05.929	\N	\N
5ee4eb3a-ab4f-4a06-a0e4-f5bd8724c3ec	92360	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"92360","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T12:14:22.972Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 12:14:22.974	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 12:14:22.974	2026-05-02 12:14:22.974	\N	\N
a8ed00ec-3b4c-4da0-a528-dd4f7eabe53a	70106	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"70106","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T12:57:14.884Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 12:57:14.888	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 12:57:14.888	2026-05-02 12:57:14.888	\N	\N
50319d96-f21b-422a-8522-d80d38406758	60710	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"60710","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T13:27:42.994Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 13:27:42.999	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 13:27:42.999	2026-05-02 13:27:42.999	\N	\N
3bae7fcb-cd0e-416b-a282-b1a695ec02d9	43596	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"43596","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T13:28:15.641Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 13:28:15.644	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 13:28:15.644	2026-05-02 13:28:15.644	\N	\N
3aa47f3f-0878-4cca-852c-4b51b81cf9fb	28784	2	ກກ 5698	ໄຊຍະບູລີ	{"ticketNumber":"28784","vehicleType":"motorcycle","plateNumber":"ກກ 5698","checkInAt":"2026-05-02T13:29:40.975Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 13:29:40.978	2026-05-02 13:29:57.236	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 13:29:40.978	2026-05-02 13:29:57.241	\N	\N
3cd8d095-b472-4a82-96b1-37b85f844068	72838	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"72838","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T13:30:43.473Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 13:30:43.476	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 13:30:43.476	2026-05-02 13:30:43.476	\N	\N
ccbad890-39c7-4489-83cd-c08f503664c1	96302	2	กก 5266	ໄຊສົມບູນ	{"ticketNumber":"96302","vehicleType":"motorcycle","plateNumber":"กก 5266","checkInAt":"2026-05-02T13:43:26.173Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 13:43:26.175	2026-05-02 13:44:13.368	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 13:43:26.175	2026-05-02 13:44:13.373	\N	\N
0e3e49d9-a3bb-480f-b35a-6b5a6e0066d4	41015	2	กก 2222	ບໍລິຄຳໄຊ	{"ticketNumber":"41015","vehicleType":"motorcycle","plateNumber":"กก 2222","checkInAt":"2026-05-02T13:41:59.395Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 13:41:59.398	2026-05-02 13:44:25.229	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 13:41:59.398	2026-05-02 13:44:25.235	\N	\N
9b1a384e-1866-480c-a05d-2b8fa8881ab4	86878	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"86878","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T13:41:24.993Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 13:41:24.996	2026-05-02 13:44:37.623	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 13:41:24.996	2026-05-02 13:44:37.626	\N	\N
f2b1297e-64a4-476e-9aae-455d0c6bae64	88072	2	\N	\N	{"ticketNumber":"88072","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-02T13:55:41.915Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 13:55:41.918	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 13:55:41.918	2026-05-02 13:55:41.918	\N	\N
64d5a76b-31f3-44ab-a95f-f112aa78d963	97233	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"97233","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T13:57:16.420Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 13:57:16.423	\N	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-02 13:57:16.423	2026-05-02 13:57:16.423	\N	\N
b7ff9449-bbe4-4e31-8027-88f3833bed4d	95372	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"95372","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T14:07:25.325Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 14:07:25.328	\N	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-02 14:07:25.328	2026-05-02 14:07:25.328	\N	\N
32278bdd-e645-4153-9f4e-7f23c0a5f050	38075	2	\N	ນະຄອນຫລວງ	{"ticketNumber":"38075","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-02T14:17:18.993Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 14:17:18.997	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 14:17:18.997	2026-05-02 14:17:18.997	\N	\N
88f8f3b6-638f-4f62-a011-4bdfaafa5054	10592	2	2222	ນະຄອນຫລວງ	{"ticketNumber":"10592","vehicleType":"motorcycle","plateNumber":"2222","checkInAt":"2026-05-02T14:17:30.843Z","system":"PARKO"}	LOST	DAILY	\N	\N	15000.00	2026-05-02 14:17:30.845	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 14:17:30.845	2026-05-03 12:52:21.073	\N	\N
6ad5a09a-bb1c-46ae-947c-6bfdbccd4809	45576	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"45576","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T13:57:12.924Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	60000.00	2026-05-02 13:57:12.927	2026-05-08 07:09:00.576	60000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 13:57:12.927	2026-05-08 07:09:00.578	\N	\N
2ff8df4a-2753-451f-af34-21b889b533c2	23394	2	8888	ວຽງຈັນ	{"ticketNumber":"23394","vehicleType":"motorcycle","plateNumber":"8888","checkInAt":"2026-05-02T14:18:53.574Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 14:18:53.577	2026-05-02 14:19:10.607	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 14:18:53.577	2026-05-02 14:19:10.614	\N	\N
907ac7b0-8a97-416a-97ae-58922e421bc6	41921	4	\N	\N	{"ticketNumber":"41921","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-02T14:19:54.720Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	60000.00	2026-05-02 14:19:54.723	\N	60000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 14:19:54.723	2026-05-02 14:19:54.723	\N	\N
9637a99d-b6e2-4ed7-aba7-0cfb8f44b8ea	59461	1	\N	ໄຊສົມບູນ	{"ticketNumber":"59461","vehicleType":"car","plateNumber":null,"checkInAt":"2026-05-02T14:21:12.397Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	50000.00	2026-05-02 14:21:12.399	\N	50000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-02 14:21:12.399	2026-05-02 14:21:12.399	\N	\N
dcfeda52-bead-47f5-adab-084460cfe060	85691	3	\N	\N	{"ticketNumber":"85691","vehicleType":"ev_motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-09T09:16:28.653Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 09:16:28.655	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-09 09:16:28.655	2026-05-09 09:16:28.655	\N	\N
e299e67c-cc2a-40df-8174-6d19e53abe78	11349	2	\N	\N	{"ticketNumber":"11349","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-02T14:22:16.378Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 14:22:16.38	2026-05-02 14:22:49.71	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 14:22:16.38	2026-05-02 14:22:49.714	\N	\N
a79d9ae9-180d-4751-91dd-ebe5c417bc18	71516	2	5624	ອຸດົມໄຊ	{"ticketNumber":"71516","vehicleType":"motorcycle","plateNumber":"5624","checkInAt":"2026-05-02T17:19:26.883Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 17:19:26.884	\N	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-02 17:19:26.884	2026-05-02 17:19:26.884	\N	\N
b5d65170-d80a-4df3-873d-776d133e1b72	26001	2	ດດ 2563	ວຽງຈັນ	{"ticketNumber":"26001","vehicleType":"motorcycle","plateNumber":"ດດ 2563","checkInAt":"2026-05-02T17:31:58.725Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 17:31:58.729	\N	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-02 17:31:58.729	2026-05-02 17:31:58.729	\N	\N
af6bf516-5d70-41fe-b8b7-37acf1190b4d	62364	2	KK 3409	ວຽງຈັນ	{"ticketNumber":"62364","vehicleType":"motorcycle","plateNumber":"KK 3409","checkInAt":"2026-05-02T17:40:01.018Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 17:40:01.021	\N	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-02 17:40:01.021	2026-05-02 17:40:01.021	\N	\N
0277ed9a-6d22-4ea1-af3d-837540c7d0e1	13734	1	\N	\N	{"ticketNumber":"13734","vehicleType":"car","plateNumber":null,"checkInAt":"2026-05-02T17:40:09.067Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	50000.00	2026-05-02 17:40:09.07	\N	50000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-02 17:40:09.07	2026-05-02 17:40:09.07	\N	\N
46ada499-2102-4479-8f4e-09ba60e6c82d	83537	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"83537","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-02T17:55:11.987Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-02 17:55:11.99	\N	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	\N	\N	2026-05-02 17:55:11.99	2026-05-02 17:55:11.99	\N	\N
e1dc03cf-b09e-4139-b30a-9da3ffc5d51e	48761	1	สส 9043	ບໍລິຄຳໄຊ	{"ticketNumber":"48761","vehicleType":"car","plateNumber":"สส 9043","checkInAt":"2026-05-03T06:08:38.274Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	50000.00	2026-05-03 06:08:38.279	2026-05-03 06:25:45.616	50000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 06:08:38.279	2026-05-03 06:25:45.623	\N	\N
75d3b5cd-bb5e-46c8-8ae1-6da13760e184	32186	2	ກກ 4321	ບໍລິຄຳໄຊ	{"ticketNumber":"32186","vehicleType":"motorcycle","plateNumber":"ກກ 4321","checkInAt":"2026-05-03T07:06:17.174Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 07:06:17.178	2026-05-03 07:06:39.692	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 07:06:17.178	2026-05-03 07:06:39.694	\N	\N
308e3338-c580-40c0-8420-f458fbfb978d	25068	2	\N	\N	{"ticketNumber":"25068","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-03T09:23:01.137Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 09:23:01.139	2026-05-08 06:58:05.119	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	kkk	2026-05-03 09:23:01.139	2026-05-08 06:58:05.12	\N	\N
c8510081-49f2-4f8e-8baf-2056279ea1cd	40765	4	\N	ນະຄອນຫລວງ	{"ticketNumber":"40765","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-03T07:58:46.304Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	600000.00	2026-05-03 07:58:46.306	2026-05-08 06:58:08.64	600000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 07:58:46.306	2026-05-08 06:58:08.642	\N	\N
673b0cb4-4e9d-4974-a1aa-7fc3512617e3	51320	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"51320","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-03T07:58:39.560Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 07:58:39.565	2026-05-08 06:58:09.804	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 07:58:39.565	2026-05-08 06:58:09.805	\N	\N
c90b0a59-3609-49b4-8112-0e3f8d40a808	59296	2	\N	\N	{"ticketNumber":"59296","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-03T08:26:41.198Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 08:26:41.201	2026-05-08 06:58:10.547	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 08:26:41.201	2026-05-08 06:58:10.548	\N	\N
f1a3f7ae-a0b0-40bf-be63-cafa057f54bb	89636	2	\N	\N	{"ticketNumber":"89636","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-03T09:28:54.594Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 09:28:54.596	2026-05-08 06:58:12.27	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	kkkkk	2026-05-03 09:28:54.596	2026-05-08 06:58:12.272	\N	\N
37fc4f27-b150-40dd-8ef2-2b1701bd2a07	88099	2	\N	\N	{"ticketNumber":"88099","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-03T09:22:43.838Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 09:22:43.841	2026-05-08 06:58:12.866	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 09:22:43.841	2026-05-08 06:58:12.871	\N	\N
3ae5bafe-cde3-4556-a5d3-0b6533967d54	84765	2	4039	ນະຄອນຫລວງ	{"ticketNumber":"84765","vehicleType":"motorcycle","plateNumber":"4039","checkInAt":"2026-05-03T07:52:25.464Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 07:52:25.467	2026-05-08 07:04:24.474	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 07:52:25.467	2026-05-08 07:04:24.483	\N	\N
7681fed0-c069-4cf5-8f6b-242e8e233665	16915	2	ສສ 2345	ຄຳມ່ວນ	{"ticketNumber":"16915","vehicleType":"motorcycle","plateNumber":"ສສ 2345","checkInAt":"2026-05-03T07:51:22.933Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 07:51:22.937	2026-05-08 07:04:25.681	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 07:51:22.937	2026-05-08 07:04:25.683	\N	\N
def41543-2cee-4f8a-8ba1-dc097466aaee	43274	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"43274","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-03T04:44:23.641Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 04:44:23.643	2026-05-08 07:04:26.532	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 04:44:23.643	2026-05-08 07:04:26.534	\N	\N
9da2e453-3a89-4b8f-98a4-69d1d37878ab	16470	2	\N	ນະຄອນຫລວງ	{"ticketNumber":"16470","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-03T04:44:19.360Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 04:44:19.363	2026-05-08 07:04:26.869	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 04:44:19.363	2026-05-08 07:04:26.872	\N	\N
729a296d-79a5-4061-b2ac-c2712928f9b7	94740	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"94740","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-03T04:44:15.578Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 04:44:15.581	2026-05-08 07:04:27.232	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 04:44:15.581	2026-05-08 07:04:27.235	\N	\N
d38447de-bf56-451f-8391-581af1f2f3e0	22369	1	\N	ນະຄອນຫລວງ	{"ticketNumber":"22369","vehicleType":"car","plateNumber":null,"checkInAt":"2026-05-03T04:44:11.283Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	50000.00	2026-05-03 04:44:11.286	2026-05-08 07:04:27.592	50000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 04:44:11.286	2026-05-08 07:04:27.596	\N	\N
4c7ed724-a568-4870-9197-ceeb2a6c3d0b	92098	2	ກກ 3456	ນະຄອນຫລວງ	{"ticketNumber":"92098","vehicleType":"motorcycle","plateNumber":"ກກ 3456","checkInAt":"2026-05-02T17:55:38.878Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 17:55:38.881	2026-05-08 07:04:27.902	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 17:55:38.881	2026-05-08 07:04:27.905	\N	\N
7cef032b-a430-4dee-b1f3-ad50a8a0c9c1	54731	2	8526	ບໍລິຄຳໄຊ	{"ticketNumber":"54731","vehicleType":"motorcycle","plateNumber":"8526","checkInAt":"2026-05-02T17:19:11.447Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-02 17:19:11.457	2026-05-08 07:09:51.883	15000.00	PAID	e9d202a9-4b08-473b-a92f-17bde19d07ad	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-02 17:19:11.457	2026-05-08 07:09:51.885	\N	\N
24e8e8c5-f242-4d80-a549-c41f848d6151	57052	3	\N	\N	{"ticketNumber":"57052","vehicleType":"ev_motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-09T09:16:32.237Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 09:16:32.247	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-09 09:16:32.247	2026-05-09 09:16:32.247	\N	\N
c3169f58-8630-4a2e-a455-e832d9ea5b46	33208	2	ກກ 1111	ສະຫວັນນະເຂດ	{"ticketNumber":"33208","vehicleType":"motorcycle","plateNumber":"ກກ 1111","checkInAt":"2026-05-03T12:53:04.934Z","system":"PARKO"}	LOST	DAILY	\N	\N	15000.00	2026-05-03 12:53:04.938	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-03 12:53:04.938	2026-05-03 12:54:21.09	\N	\N
7b6a3b94-1352-4eda-9d0a-52b5295b3631	73863	2	ກກ 9999	ບໍລິຄຳໄຊ	{"ticketNumber":"73863","vehicleType":"motorcycle","plateNumber":"ກກ 9999","checkInAt":"2026-05-03T12:39:13.325Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 12:39:13.327	2026-05-03 14:39:08.422	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:39:13.327	2026-05-03 14:39:08.427	\N	\N
0242dadf-28d5-41ea-af80-8bedc691fbd8	80313	2	3333	\N	{"ticketNumber":"80313","vehicleType":"motorcycle","plateNumber":"3333","checkInAt":"2026-05-03T12:38:57.012Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 12:38:57.013	2026-05-03 14:39:17.725	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:38:57.013	2026-05-03 14:39:17.728	\N	\N
dfde69e4-07fe-4632-82cd-9f8fab155448	93028	2	ກກ 1234	\N	{"ticketNumber":"93028","vehicleType":"motorcycle","plateNumber":"ກກ 1234","checkInAt":"2026-05-04T08:51:17.201Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	0.00	2026-05-04 08:51:17.204	2026-05-04 08:53:02.794	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 08:51:17.204	2026-05-04 08:53:02.797	cee18701-e06f-4b9c-b408-cc6226136e89	\N
2bdd0980-078e-4e90-b761-113a2b88fe2f	22154	2	ກກ 2222	ສາລະວັນ	{"ticketNumber":"22154","vehicleType":"motorcycle","plateNumber":"ກກ 2222","checkInAt":"2026-05-03T12:42:06.801Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 12:42:06.804	2026-05-04 09:12:45.767	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:42:06.804	2026-05-04 09:12:45.77	\N	\N
4d946c15-6e3c-4587-b22a-d2237b87369d	16060	2	ກກ 2222	ສາລະວັນ	{"ticketNumber":"16060","vehicleType":"motorcycle","plateNumber":"ກກ 2222","checkInAt":"2026-05-04T09:15:11.522Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 09:15:11.524	2026-05-04 09:19:25.872	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 09:15:11.524	2026-05-04 09:19:25.874	\N	\N
281d3bd7-ce7f-4a6e-a9c5-c09b0962fbc4	57334	2	ກກ 1234	\N	{"ticketNumber":"57334","vehicleType":"motorcycle","plateNumber":"ກກ 1234","checkInAt":"2026-05-04T09:37:33.015Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	0.00	2026-05-04 09:37:33.017	2026-05-04 09:45:35.584	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 09:37:33.017	2026-05-04 09:45:35.589	cee18701-e06f-4b9c-b408-cc6226136e89	\N
e5699cc7-0a5f-4118-a331-136e219176e2	41708	2	ກກ 2222	ນະຄອນຫລວງ	{"ticketNumber":"41708","vehicleType":"motorcycle","plateNumber":"ກກ 2222","checkInAt":"2026-05-04T09:53:49.912Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 09:53:49.914	2026-05-04 09:54:40.076	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 09:53:49.914	2026-05-04 09:54:40.078	\N	\N
4e3eeb4e-4c65-49d2-a0f7-2f99bb6f74f6	76782	2	AA 1234	ນະຄອນຫລວງ	{"ticketNumber":"76782","vehicleType":"motorcycle","plateNumber":"AA 1234","checkInAt":"2026-05-04T10:45:10.344Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 10:45:10.346	2026-05-07 06:19:22.181	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 10:45:10.346	2026-05-07 06:19:22.187	\N	\N
b047294e-b0e1-48eb-acf8-540a2ef96afe	13831	2	1111	ນະຄອນຫລວງ	{"ticketNumber":"13831","vehicleType":"motorcycle","plateNumber":"AB 1111","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T11:55:36.436Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 11:55:36.438	2026-05-08 07:04:18.635	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 11:55:36.438	2026-05-08 07:04:18.637	\N	AB
707188bb-8447-44b7-b73a-837d68a8e0e8	62957	4	1111	ນະຄອນຫລວງ	{"ticketNumber":"62957","vehicleType":"truck","plateNumber":"AA 1111","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T11:55:25.150Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	80000.00	2026-05-04 11:55:25.152	2026-05-08 07:04:18.93	80000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 11:55:25.152	2026-05-08 07:04:18.932	\N	AA
3c5d98ac-89fc-48be-a9a1-9d610d756393	27272	1	1111	ນະຄອນຫລວງ	{"ticketNumber":"27272","vehicleType":"car","plateNumber":"AA 1111","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T11:55:01.192Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	25000.00	2026-05-04 11:55:01.194	2026-05-08 07:04:19.266	25000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 11:55:01.194	2026-05-08 07:04:19.287	\N	AA
def72283-6669-49d7-bcb2-2047e7b74861	83038	2	1111	ຜົ້ງສາລີ	{"ticketNumber":"83038","vehicleType":"motorcycle","plateNumber":"AA 1111","plateProvince":"ຜົ້ງສາລີ","checkInAt":"2026-05-04T11:43:47.035Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 11:43:47.037	2026-05-08 07:04:19.598	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 11:43:47.037	2026-05-08 07:04:19.599	\N	AA
b6f73127-652d-485b-8359-698c6ce13ecd	56200	2	1111	ນະຄອນຫລວງ	{"ticketNumber":"56200","vehicleType":"motorcycle","plateNumber":"AA 1111","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T11:43:29.238Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 11:43:29.24	2026-05-08 07:04:20.072	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 11:43:29.24	2026-05-08 07:04:20.075	\N	AA
d31f95d1-417a-4666-ab82-2d491317bd5f	75525	2	ກກ 2222	ນະຄອນຫລວງ	{"ticketNumber":"75525","vehicleType":"motorcycle","plateNumber":"ກກ 2222","checkInAt":"2026-05-04T09:53:39.914Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 09:53:39.916	2026-05-08 07:04:20.407	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 09:53:39.916	2026-05-08 07:04:20.409	\N	\N
6fb4c294-1232-4dc9-8870-14fc4bdbcbd6	22849	2	4333	ນະຄອນຫລວງ	{"ticketNumber":"22849","vehicleType":"motorcycle","plateNumber":"4333","checkInAt":"2026-05-03T12:36:17.416Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 12:36:17.421	2026-05-08 07:04:20.887	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:36:17.421	2026-05-08 07:04:20.889	\N	\N
ffd072fc-9f22-4ccf-bd7f-039972e6fe15	17903	2	\N	\N	{"ticketNumber":"17903","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-03T12:35:57.957Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 12:35:57.96	2026-05-08 07:04:21.282	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:35:57.96	2026-05-08 07:04:21.285	\N	\N
46a83e7f-3a1c-4e81-9d94-18c7d4abbc91	22420	3	\N	\N	{"ticketNumber":"22420","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-03T12:23:13.562Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 12:23:13.565	2026-05-08 07:04:21.788	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:23:13.565	2026-05-08 07:04:21.792	\N	\N
9ec499ab-a82c-49df-8607-8b36a7b8e72a	23717	4	\N	\N	{"ticketNumber":"23717","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-03T12:22:36.520Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	600000.00	2026-05-03 12:22:36.523	2026-05-08 07:04:22.471	600000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:22:36.523	2026-05-08 07:04:22.473	\N	\N
5eeff971-e27e-4a50-a4f2-13f457175da0	96456	4	\N	\N	{"ticketNumber":"96456","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-03T11:50:02.120Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	600000.00	2026-05-03 11:50:02.122	2026-05-08 07:04:23.146	600000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 11:50:02.122	2026-05-08 07:04:23.148	\N	\N
5026a67f-7492-4659-9d5b-1fc3d541d7c0	86063	4	\N	\N	{"ticketNumber":"86063","vehicleType":"truck","plateNumber":null,"checkInAt":"2026-05-03T10:06:31.786Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	600000.00	2026-05-03 10:06:31.788	2026-05-08 07:04:23.53	600000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 10:06:31.788	2026-05-08 07:04:23.533	\N	\N
caf5a04a-3db6-4741-b9af-75e98c2bf66d	83760	2	3409	ບໍລິຄຳໄຊ	{"ticketNumber":"83760","vehicleType":"motorcycle","plateNumber":"3409","checkInAt":"2026-05-03T10:06:14.330Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 10:06:14.333	2026-05-08 07:04:23.825	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 10:06:14.333	2026-05-08 07:04:23.827	\N	\N
3d755a37-1c5f-4c03-aade-bb4b7a02f349	83938	3	\N	ນະຄອນຫລວງ	{"ticketNumber":"83938","vehicleType":"ev_motorcycle","plateNumber":null,"checkInAt":"2026-05-03T09:38:43.381Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 09:38:43.383	2026-05-08 07:04:24.186	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 09:38:43.383	2026-05-08 07:04:24.188	\N	\N
291e1db7-ad0c-4ae5-a28e-1364459717c9	92763	2	1111	ນະຄອນຫລວງ	{"ticketNumber":"92763","vehicleType":"motorcycle","plateNumber":"BB 1111","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T12:29:19.921Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	\N	0.00	2026-05-04 12:29:19.923	2026-05-04 12:29:36.824	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	Auto check-in: M-00009	2026-05-04 12:29:19.923	2026-05-04 12:29:36.825	aaa4417e-6b27-4226-b5dd-89c710b6d231	BB
16b78ffd-8c90-4d5c-b925-282af6356afb	98009	2	9999	ນະຄອນຫລວງ	{"ticketNumber":"98009","vehicleType":"motorcycle","plateNumber":"AA 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T12:10:02.651Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 12:10:02.655	2026-05-06 07:54:51.421	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 12:10:02.655	2026-05-06 07:54:51.423	\N	AA
90a16a20-8cd2-4f7a-9d55-542f59496b42	57812	2	9999	ນະຄອນຫຼວງ	{"ticketNumber":"57812","vehicleType":"motorcycle","plateNumber":"aa 9999","plateProvince":"ນະຄອນຫຼວງ","checkInAt":"2026-05-04T12:10:32.724Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	\N	0.00	2026-05-04 12:10:32.726	2026-05-06 07:54:57.912	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	Auto check-in: M-00006	2026-05-04 12:10:32.726	2026-05-06 07:54:57.914	d44aacd9-4555-416f-b08a-2a918b3a83d9	aa
bbbaef0c-4a6f-4a53-b02b-338c27d1179e	29188	1	9999	ນະຄອນຫລວງ	{"ticketNumber":"29188","vehicleType":"car","plateNumber":"aa 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T12:20:04.681Z","system":"PARKO"}	COMPLETED	MONTHLY	\N	\N	0.00	2026-05-04 12:20:04.683	2026-05-06 07:55:03.982	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	Auto check-in: M-00008	2026-05-04 12:20:04.683	2026-05-06 07:55:03.983	2b091c45-968d-4436-89fe-5a075c8043fa	aa
ff15a27d-60d0-4007-aeac-8031762a7e72	83105	2	9999	ນະຄອນຫລວງ	{"ticketNumber":"83105","vehicleType":"motorcycle","plateNumber":"aa 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-04T12:19:39.473Z","system":"PARKO"}	COMPLETED	MONTHLY	\N	\N	0.00	2026-05-04 12:19:39.475	2026-05-06 07:55:09.483	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	Auto check-in: M-00007	2026-05-04 12:19:39.475	2026-05-06 07:55:09.485	b3f1933f-80ef-47f8-8eb4-9da8d5292baa	aa
06dc96d4-fec3-4cd1-b2c7-764fc50d4ae0	34363	1	ກກ 9999	ວຽງຈັນ	{"ticketNumber":"34363","vehicleType":"car","plateNumber":"ກກ 9999","checkInAt":"2026-05-03T12:40:41.350Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	50000.00	2026-05-03 12:40:41.351	2026-05-06 07:55:16.056	50000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:40:41.351	2026-05-06 07:55:16.058	\N	\N
718ec3ce-a472-4712-a12e-d95e78362e7f	36805	2	9999	ນະຄອນຫລວງ	{"ticketNumber":"36805","vehicleType":"motorcycle","plateNumber":"AA 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T07:55:33.927Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-06 07:55:33.928	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-06 07:55:33.928	2026-05-06 07:55:33.928	\N	AA
02456661-7500-46a9-8816-fa1cf83e9759	77844	2	9999	\N	{"ticketNumber":"77844","vehicleType":"motorcycle","plateNumber":"BB 9999","plateProvince":null,"checkInAt":"2026-05-06T08:10:36.403Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	0.00	2026-05-06 08:10:36.408	\N	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-06 08:10:36.408	2026-05-06 08:10:36.408	6ca5c0d2-79bb-476f-b294-689cdfc9071c	BB
dd687b49-dfcc-48a8-81fa-7dd2749b8375	27394	2	9999	ນະຄອນຫລວງ	{"ticketNumber":"27394","vehicleType":"motorcycle","plateNumber":"CC 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T08:12:27.302Z","system":"PARKO"}	ACTIVE	WEEKLY	\N	\N	0.00	2026-05-06 08:12:27.306	\N	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	Auto check-in: M-00012	2026-05-06 08:12:27.306	2026-05-06 08:12:27.306	d6c5992a-681b-47e3-8043-afd237ef0297	CC
577ec139-b5ce-421a-acfc-a65bff6cb086	97256	2	9999	ນະຄອນຫລວງ	{"ticketNumber":"97256","vehicleType":"motorcycle","plateNumber":"AB 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T08:13:28.320Z","system":"PARKO"}	ACTIVE	MONTHLY	\N	\N	0.00	2026-05-06 08:13:28.322	\N	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	Auto check-in: M-00013	2026-05-06 08:13:28.322	2026-05-06 08:13:28.322	03129b53-2d6a-4e4b-8502-1c23bfbc4fe9	AB
a9f3ba60-1533-4726-8dde-6658f0f319da	12191	2	\N	\N	{"ticketNumber":"12191","vehicleType":"motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-06T07:37:40.054Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-06 07:37:40.056	2026-05-08 07:04:13.302	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 07:37:40.056	2026-05-08 07:04:13.304	\N	\N
f1114e00-837d-4075-b006-9c54179b7641	70312	2	1111	\N	{"ticketNumber":"70312","vehicleType":"motorcycle","plateNumber":"AA 1111","plateProvince":null,"checkInAt":"2026-05-06T07:06:32.652Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	0.00	2026-05-06 07:06:32.654	2026-05-08 07:04:14.089	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 07:06:32.654	2026-05-08 07:04:14.092	3d5838ad-e81f-4de7-8a6c-5ae0ddbf6398	AA
984a2757-ea9a-4cd5-8f37-2f83bb20eca2	60429	2	1111	ໄຊຍະບູລີ	{"ticketNumber":"60429","vehicleType":"motorcycle","plateNumber":"AA 1111","plateProvince":"ໄຊຍະບູລີ","checkInAt":"2026-05-06T07:04:56.051Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	\N	0.00	2026-05-06 07:04:56.054	2026-05-08 07:04:14.951	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	Auto check-in: M-00010	2026-05-06 07:04:56.054	2026-05-08 07:04:14.952	3d5838ad-e81f-4de7-8a6c-5ae0ddbf6398	AA
aaac3849-7bdd-489f-a9de-e337fc4d2afe	20196	2	4444	ສະຫວັນນະເຂດ	{"ticketNumber":"20196","vehicleType":"motorcycle","plateNumber":"BB 4444","plateProvince":"ສະຫວັນນະເຂດ","checkInAt":"2026-05-05T12:39:54.794Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-05 12:39:54.795	2026-05-08 07:04:15.981	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-05 12:39:54.795	2026-05-08 07:04:15.984	\N	BB
f2165ba5-45a5-4077-a1db-ee2ba3b704b3	18785	3	\N	\N	{"ticketNumber":"18785","vehicleType":"ev_motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-05T12:37:37.207Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-05 12:37:37.211	2026-05-08 07:04:16.27	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-05 12:37:37.211	2026-05-08 07:04:16.273	\N	\N
a5267fb1-901c-47f7-ba7b-c060b26b235d	72410	1	\N	\N	{"ticketNumber":"72410","vehicleType":"car","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-05T11:55:38.684Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	25000.00	2026-05-05 11:55:38.688	2026-05-08 07:04:17.097	25000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-05 11:55:38.688	2026-05-08 07:04:17.099	\N	\N
1dc44b6a-503f-43e1-85b7-e0e22d49e11a	42499	2	6666	ໄຊສົມບູນ	{"ticketNumber":"42499","vehicleType":"motorcycle","plateNumber":"AA 6666","plateProvince":"ໄຊສົມບູນ","checkInAt":"2026-05-05T11:30:20.908Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-05 11:30:20.91	2026-05-08 07:04:17.453	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-05 11:30:20.91	2026-05-08 07:04:17.455	\N	AA
7a6bffa5-f127-4866-91cb-dffd7d8276bc	94892	1	\N	\N	{"ticketNumber":"94892","vehicleType":"car","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-05T09:12:32.378Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	25000.00	2026-05-05 09:12:32.381	2026-05-08 07:04:17.804	25000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-05 09:12:32.381	2026-05-08 07:04:17.806	\N	\N
b7c88c3d-2bae-40d5-aa8a-581724a594ef	31760	2	2344	ວຽງຈັນ	{"ticketNumber":"31760","vehicleType":"motorcycle","plateNumber":"AA 2344","plateProvince":"ວຽງຈັນ","checkInAt":"2026-05-04T12:35:44.422Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-04 12:35:44.425	2026-05-08 07:04:18.288	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-04 12:35:44.425	2026-05-08 07:04:18.29	\N	AA
c6a8f433-2ac6-49de-b418-91bbc4c58a72	95114	3	\N	\N	{"ticketNumber":"95114","vehicleType":"ev_motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-08T10:36:31.860Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-08 10:36:31.862	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	ລົດໄຟຟ້າ	2026-05-08 10:36:31.862	2026-05-08 10:36:31.862	\N	\N
2130aa0e-47f2-4245-b119-1b80d5d95d42	51063	2	1111	ນະຄອນຫລວງ	{"ticketNumber":"51063","vehicleType":"motorcycle","plateNumber":"AS 1111","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T09:02:46.961Z","system":"PARKO"}	ACTIVE	WEEKLY	\N	\N	0.00	2026-05-06 09:02:46.964	\N	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	Auto check-in: M-00014	2026-05-06 09:02:46.964	2026-05-06 09:02:46.964	3e6e89fe-dd57-4b4e-8a9b-b6ed5971c8d5	AS
289ae886-2d0d-459e-acd9-c818b701ebf6	95036	2	9999	ຜົ້ງສາລີ	{"ticketNumber":"95036","vehicleType":"motorcycle","plateNumber":"AB 9999","plateProvince":"ຜົ້ງສາລີ","checkInAt":"2026-05-06T09:03:44.727Z","system":"PARKO"}	ACTIVE	MONTHLY	\N	\N	0.00	2026-05-06 09:03:44.729	\N	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	Auto check-in: M-00015	2026-05-06 09:03:44.729	2026-05-06 09:03:44.729	44493b88-0f85-4b31-a00d-fe0f03cf68c7	AB
6a1d4e9b-a592-4833-9df9-faf192118ecb	64359	2	1111	ຜົ້ງສາລີ	{"ticketNumber":"64359","vehicleType":"motorcycle","plateNumber":"ກກ 1111","plateProvince":"ຜົ້ງສາລີ","checkInAt":"2026-05-08T10:35:14.871Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-08 10:35:14.875	2026-05-08 12:01:12.475	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-08 10:35:14.875	2026-05-08 12:01:12.478	\N	ກກ
28581066-b346-4709-88a6-aa14f6864c3d	76647	2	9999	ນະຄອນຫລວງ	{"ticketNumber":"76647","vehicleType":"motorcycle","plateNumber":"AD 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T09:19:48.396Z","system":"PARKO"}	COMPLETED	MONTHLY	\N	2026-06-06 00:00:00	150000.00	2026-05-06 09:19:48.399	2026-05-08 05:39:25.152	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	ok	2026-05-06 09:19:48.399	2026-05-08 05:39:25.154	\N	AD
d4ab2e58-878e-432a-b426-5e36cea10fd7	46668	3	\N	\N	{"ticketNumber":"46668","vehicleType":"ev_motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-09T09:16:37.367Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 09:16:37.37	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-09 09:16:37.37	2026-05-09 09:16:37.37	\N	\N
a4adfccf-e852-4c0f-8cf7-70556b936c0d	49731	2	1111	ຄຳມ່ວນ	{"ticketNumber":"49731","vehicleType":"motorcycle","plateNumber":"ຫຮ 1111","plateProvince":"ຄຳມ່ວນ","checkInAt":"2026-05-09T10:27:04.823Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 10:27:04.825	\N	15000.00	PAID	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	\N	\N	2026-05-09 10:27:04.825	2026-05-09 10:27:04.825	\N	ຫຮ
01304a66-de30-435e-aedd-a875e7885bde	62077	1	2223	ຫົວພັນ	{"ticketNumber":"62077","vehicleType":"car","plateNumber":"ສຍ 2223","plateProvince":"ຫົວພັນ","checkInAt":"2026-05-09T10:27:20.454Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	25000.00	2026-05-09 10:27:20.456	\N	25000.00	PAID	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	\N	\N	2026-05-09 10:27:20.456	2026-05-09 10:27:20.456	\N	ສຍ
70c11b47-2ba7-4d5b-9da7-da75d6731f65	17816	2	1234	ໄຊຍະບູລີ	{"ticketNumber":"17816","vehicleType":"motorcycle","plateNumber":"AA 1234","plateProvince":"ໄຊຍະບູລີ","checkInAt":"2026-05-06T10:14:57.911Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-06 10:14:57.914	2026-05-06 17:06:16.048	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 10:14:57.914	2026-05-06 17:06:16.05	\N	AA
a63f4cc4-300c-4c26-9d4f-91fe4037b5cf	34818	2	4321	ນະຄອນຫລວງ	{"ticketNumber":"34818","vehicleType":"motorcycle","plateNumber":"ກກ 4321","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T16:07:27.719Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-06 16:07:27.723	2026-05-06 17:06:40.194	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 16:07:27.723	2026-05-06 17:06:40.197	\N	ກກ
af7aaf79-c08a-4fab-aac9-666318a29f00	23170	2	4444	ນະຄອນຫລວງ	{"ticketNumber":"23170","vehicleType":"motorcycle","plateNumber":"ກກ 4444","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T17:07:50.146Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	2026-05-13 00:00:00	80000.00	2026-05-06 17:07:50.148	2026-05-06 17:08:19.796	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 17:07:50.148	2026-05-06 17:08:19.799	9decb039-0c61-4fa4-a8a7-17a5084b4a03	ກກ
2ddcf783-7b26-41e9-a386-33eb0337db03	74441	2	1234	ວຽງຈັນ	{"ticketNumber":"74441","vehicleType":"motorcycle","plateNumber":"ກຂ 1234","plateProvince":"ວຽງຈັນ","checkInAt":"2026-05-06T12:19:58.195Z","system":"PARKO"}	COMPLETED	MONTHLY	\N	2026-06-06 00:00:00	150000.00	2026-05-06 12:19:58.2	2026-05-07 15:58:51.416	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 12:19:58.2	2026-05-07 15:58:51.418	404139da-a792-455d-9ddf-45c71bb1139c	ກຂ
ff376c8f-8c65-4e19-945a-528ea9f348d7	50656	2	9999	ນະຄອນຫລວງ	{"ticketNumber":"50656","vehicleType":"motorcycle","plateNumber":"AF 9999","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-06T11:05:30.542Z","system":"PARKO"}	COMPLETED	MONTHLY	\N	2026-06-06 00:00:00	150000.00	2026-05-06 11:05:30.543	2026-05-07 16:17:59.254	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	okkk	2026-05-06 11:05:30.543	2026-05-07 16:17:59.257	8628d1be-6245-4bb9-8df1-e33437df618e	AF
b44f50ab-7851-446c-ab87-7bf996a6b105	22319	4	\N	\N	{"ticketNumber":"22319","vehicleType":"truck","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-06T11:05:59.138Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	2026-05-13 00:00:00	250000.00	2026-05-06 11:05:59.14	2026-05-07 16:18:15.849	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	ooooo	2026-05-06 11:05:59.14	2026-05-07 16:18:15.853	e72563fc-1d4e-4701-9fcf-8851fab5acae	\N
ffc22716-a47e-41b2-98dd-272d09756757	54193	2	8888	ໄຊຍະບູລີ	{"ticketNumber":"54193","vehicleType":"motorcycle","plateNumber":"ກກ 8888","plateProvince":"ໄຊຍະບູລີ","checkInAt":"2026-05-08T05:20:21.531Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	2026-05-15 00:00:00	80000.00	2026-05-08 05:20:21.535	2026-05-08 05:30:52.635	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-08 05:20:21.535	2026-05-08 05:30:52.638	be2b95b2-1ade-4ee4-a50a-278286d67d12	ກກ
73229b12-0a0d-43d2-9a7a-d5fb7f2f5375	79292	2	9999	ຜົ້ງສາລີ	{"ticketNumber":"79292","vehicleType":"motorcycle","plateNumber":"AF 9999","plateProvince":"ຜົ້ງສາລີ","checkInAt":"2026-05-06T09:20:25.561Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-06 09:20:25.564	2026-05-08 05:38:34.28	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 09:20:25.564	2026-05-08 05:38:34.285	\N	AF
e292d37d-9864-4ae5-9c69-eb37dfc5e3cf	92367	2	\N	\N	{"ticketNumber":"92367","vehicleType":"motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-06T10:07:34.841Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-06 10:07:34.844	2026-05-08 05:38:35.527	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-06 10:07:34.844	2026-05-08 05:38:35.529	\N	\N
9e160fb1-3f47-4883-a25f-4aef0a15494c	75354	2	\N	\N	{"ticketNumber":"75354","vehicleType":"motorcycle","plateNumber":null,"checkInAt":"2026-05-03T09:32:45.916Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 09:32:45.918	2026-05-08 06:58:03.166	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	kkkkkkkkkkkkkkkkkkkk	2026-05-03 09:32:45.918	2026-05-08 06:58:03.167	\N	\N
bdab0c7b-05ea-46ed-8378-2d77ef5422d8	29797	1	KK 0432	ສະຫວັນນະເຂດ	{"ticketNumber":"29797","vehicleType":"car","plateNumber":"KK 0432","checkInAt":"2026-05-03T09:13:56.089Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	50000.00	2026-05-03 09:13:56.093	2026-05-08 06:58:13.08	50000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 09:13:56.093	2026-05-08 06:58:13.083	\N	\N
3c528bc7-7abc-4960-ad0e-3fbab71413bf	24097	2	KK 9345	ຫົວພັນ	{"ticketNumber":"24097","vehicleType":"motorcycle","plateNumber":"KK 9345","checkInAt":"2026-05-03T12:23:02.934Z","system":"PARKO"}	COMPLETED	DAILY	\N	\N	15000.00	2026-05-03 12:23:02.938	2026-05-08 07:04:22.131	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-03 12:23:02.938	2026-05-08 07:04:22.133	\N	\N
2a3b6014-9da5-44ee-b032-a25e1881503f	38121	2	2222	ໄຊສົມບູນ	{"ticketNumber":"38121","vehicleType":"motorcycle","plateNumber":"ກກ 2222","plateProvince":"ໄຊສົມບູນ","checkInAt":"2026-05-08T10:35:27.331Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-08 10:35:27.334	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-08 10:35:27.334	2026-05-08 10:35:27.334	\N	ກກ
b5bdebf5-4a51-4ba4-97f5-39deda929b5b	82792	2	3333	ໄຊສົມບູນ	{"ticketNumber":"82792","vehicleType":"motorcycle","plateNumber":"ກດ 3333","plateProvince":"ໄຊສົມບູນ","checkInAt":"2026-05-08T10:35:42.002Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-08 10:35:42.006	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-08 10:35:42.006	2026-05-08 10:35:42.006	\N	ກດ
8cdfede1-e50a-4c15-9aa3-a2a8c8ecade4	93391	2	2222	ໄຊຍະບູລີ	{"ticketNumber":"93391","vehicleType":"motorcycle","plateNumber":"ກຫ 2222","plateProvince":"ໄຊຍະບູລີ","checkInAt":"2026-05-08T10:36:00.037Z","system":"PARKO"}	ACTIVE	WEEKLY	\N	2026-05-15 00:00:00	80000.00	2026-05-08 10:36:00.04	\N	80000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-08 10:36:00.04	2026-05-08 10:36:00.04	a2db9670-8bc5-496e-b07f-eea41aa48128	ກຫ
4b43786b-07bc-4717-9ca7-c9c0ab9a0f90	86252	4	1111	ນະຄອນຫລວງ	{"ticketNumber":"86252","vehicleType":"truck","plateNumber":"ສນ 1111","plateProvince":"ນະຄອນຫລວງ","checkInAt":"2026-05-08T10:37:16.190Z","system":"PARKO"}	ACTIVE	WEEKLY	\N	2026-05-15 00:00:00	250000.00	2026-05-08 10:37:16.192	\N	250000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-08 10:37:16.192	2026-05-08 10:37:16.192	33ce82f3-462b-41f4-891a-cdc6d55f252d	ສນ
413142e7-5f2f-44b0-ab81-2548f0978e59	72349	4	\N	\N	{"ticketNumber":"72349","vehicleType":"truck","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-06T11:04:38.769Z","system":"PARKO"}	COMPLETED	WEEKLY	\N	2026-05-13 00:00:00	250000.00	2026-05-06 11:04:38.772	2026-05-08 05:38:05.502	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	ລົດບໍ່ມີປ້າຍ	2026-05-06 11:04:38.772	2026-05-08 05:38:05.505	\N	\N
b21e427e-1f17-4a18-b437-34136bb29862	96193	2	0040	ບໍ່ແກ້ວ	{"ticketNumber":"96193","vehicleType":"motorcycle","plateNumber":"ກກ 0040","plateProvince":"ບໍ່ແກ້ວ","checkInAt":"2026-05-08T11:31:04.218Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-08 11:31:04.221	\N	15000.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	\N	\N	2026-05-08 11:31:04.221	2026-05-08 11:31:04.221	\N	ກກ
a053e071-b6ee-46b8-8cc3-3e86e1164b33	54801	1	3333	ໄຊສົມບູນ	{"ticketNumber":"54801","vehicleType":"car","plateNumber":"ກຮ 3333","plateProvince":"ໄຊສົມບູນ","checkInAt":"2026-05-08T10:37:47.759Z","system":"PARKO"}	COMPLETED	MONTHLY	\N	2026-06-08 00:00:00	260000.00	2026-05-08 10:37:47.761	2026-05-08 15:24:59.803	0.00	PAID	e779f0bf-302e-41dd-b520-399e0a218403	e779f0bf-302e-41dd-b520-399e0a218403	\N	2026-05-08 10:37:47.761	2026-05-08 15:24:59.805	6200dc34-fdd0-45e7-8715-d3e1fce27666	ກຮ
29d5dd6f-118b-47f8-bb49-66536af3c512	77166	2	\N	\N	{"ticketNumber":"77166","vehicleType":"motorcycle","plateNumber":null,"plateProvince":null,"checkInAt":"2026-05-09T10:23:01.725Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 10:23:01.726	\N	15000.00	PAID	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	\N	\N	2026-05-09 10:23:01.726	2026-05-09 10:23:01.726	\N	\N
432dace0-3388-45b6-bcfb-1a6fa213fa3b	65144	2	8765	ວຽງຈັນ	{"ticketNumber":"65144","vehicleType":"motorcycle","plateNumber":"ກກ 8765","plateProvince":"ວຽງຈັນ","checkInAt":"2026-05-09T10:27:46.531Z","system":"PARKO"}	ACTIVE	DAILY	\N	\N	15000.00	2026-05-09 10:27:46.533	\N	15000.00	PAID	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	\N	\N	2026-05-09 10:27:46.533	2026-05-09 10:27:46.533	\N	ກກ
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.payments (id, ticket_id, amount, payment_method, reference_number, received_by, paid_at, created_at) FROM stdin;
26d1472a-d48b-4245-9e3d-10e3575b14da	0e6f9f77-4e6f-43de-9b7e-fb81a8ff6dcf	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-01 16:37:07.793	2026-05-01 16:37:07.793
8629dac0-d43a-41b4-b2b1-3d90a27f8de1	6500c538-1ca2-44c8-8ff7-e6ee4b729c26	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 06:01:03.618	2026-05-02 06:01:03.618
9d37a235-0253-4374-b563-a0f4f1d0d92b	4486c6b8-c1a4-48d6-a589-a5a1ab2485fd	3000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 06:02:11.108	2026-05-02 06:02:11.108
bd6b14fa-e202-494d-aca1-aa11820647b7	f5a927f3-a9e3-4c20-8ae4-d659cecece22	3000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 06:04:33.539	2026-05-02 06:04:33.539
a1cf1991-99cc-4096-810c-2250e7dc6a30	756ae853-5d71-4a2d-85d0-b74e6a91383e	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 06:04:51.513	2026-05-02 06:04:51.513
000aec98-f3d0-411b-b7af-f0acbaf432e1	ea7cca9c-e679-4f1d-88bc-4a080a547c8e	80000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 06:05:15.005	2026-05-02 06:05:15.005
6826413b-673d-4eb3-9c97-35ce829641b7	e35c88d0-e543-408b-b48f-43630de495cc	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 06:07:06.007	2026-05-02 06:07:06.007
27644d30-8c8a-4ef6-881a-7f43bd403457	1a6d648b-7783-4ac9-ad6c-773b03e5784f	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 06:07:14.901	2026-05-02 06:07:14.901
052f7a47-8a8f-492a-95b7-d82072d085b6	82c82ffc-ce4a-432c-a501-774380219017	30000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 09:45:24.351	2026-05-02 09:45:24.351
b743f647-35d3-451e-9682-e0ef88c0eef3	7f4176e4-67ca-4767-9865-78686c95ee25	30000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 09:49:41.311	2026-05-02 09:49:41.311
bf972565-e17e-4717-a9a6-a927e03ca4d5	5cb39f60-226c-48c8-b465-b766e3d4dae9	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 10:01:37.076	2026-05-02 10:01:37.076
900b9fd5-89db-4161-b4af-99ab4079c5b5	69748640-e833-4067-9635-13fd51200747	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 10:01:59.773	2026-05-02 10:01:59.773
f97574c2-e6f2-4c68-b6ce-fa331a5e1d98	69748640-e833-4067-9635-13fd51200747	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 10:02:22.045	2026-05-02 10:02:22.045
9d581c29-d968-4d7f-9cb8-dac106556a19	5cb39f60-226c-48c8-b465-b766e3d4dae9	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 10:02:26.245	2026-05-02 10:02:26.245
f453e0ac-6ed2-4970-b3e4-98788c0c2a55	7f4176e4-67ca-4767-9865-78686c95ee25	30000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 10:02:29.781	2026-05-02 10:02:29.781
31428f5e-e34d-409d-8622-77adf0ba7576	be5953df-29be-43e3-9f43-df5d80d18e5b	100000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 10:37:11.957	2026-05-02 10:37:11.957
fdd3380d-07aa-4f27-a704-f27ee0df91ab	be5953df-29be-43e3-9f43-df5d80d18e5b	100000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 11:13:13.361	2026-05-02 11:13:13.361
36376d37-d805-434e-a15e-2d11542fb299	022b3b79-c0ab-40c0-b459-c23d6abed3be	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 11:23:33.738	2026-05-02 11:23:33.738
42ba017a-01cc-41fc-a26b-a927f31af097	d1268bb7-d4b4-4815-8157-bdbf0a27c493	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 11:26:03.578	2026-05-02 11:26:03.578
f2f392ad-636b-459b-aafe-7a8b952f1a78	516a28f8-584c-4cad-b5b0-1ee5b29dc7e2	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 11:39:14.356	2026-05-02 11:39:14.356
a49c56d7-4fb6-427d-ac91-ef89a77a1e4a	0d9cd583-664d-440a-89f0-2da6e42d4fe6	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 11:44:04.388	2026-05-02 11:44:04.388
285d427d-7027-4b4b-ab6e-617a189b85ff	60e93f6f-423c-4b49-b5f6-aa2232297ff7	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 11:51:07.475	2026-05-02 11:51:07.475
785f2f56-f437-42cb-88e1-4eefa0e8180b	759e509e-e67d-4855-9554-fc29444b7695	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 12:01:34.094	2026-05-02 12:01:34.094
cd4cd2b9-69ae-4a46-8626-6bd967a131f7	7ff348a9-9d75-448f-8599-768282e2baf7	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 12:02:16.849	2026-05-02 12:02:16.849
bfb79fd2-ae72-4743-8cda-c2105665a4da	a0072910-2b85-45bf-b7ab-4adc81cdb003	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 12:14:05.983	2026-05-02 12:14:05.983
8720ac7b-2f63-4c0d-8721-b1421305d729	5ee4eb3a-ab4f-4a06-a0e4-f5bd8724c3ec	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 12:14:23.016	2026-05-02 12:14:23.016
75f3356e-c7eb-450b-b0f7-89fbb4943c04	a8ed00ec-3b4c-4da0-a528-dd4f7eabe53a	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 12:57:14.931	2026-05-02 12:57:14.931
1e39fa03-eef3-4551-a59f-ee05201d0da0	50319d96-f21b-422a-8522-d80d38406758	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:27:43.07	2026-05-02 13:27:43.07
9398e4a4-575e-43a3-beba-6fa18c9a5ca1	3bae7fcb-cd0e-416b-a282-b1a695ec02d9	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:28:15.683	2026-05-02 13:28:15.683
81fe29d1-b5dc-4985-ab7d-43159de80344	3aa47f3f-0878-4cca-852c-4b51b81cf9fb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:29:41.008	2026-05-02 13:29:41.008
6e4dc763-c71a-4f94-8095-1d43596aa205	3aa47f3f-0878-4cca-852c-4b51b81cf9fb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:29:57.326	2026-05-02 13:29:57.326
340ea645-d8a8-494c-8322-dcb72e86f7f4	3cd8d095-b472-4a82-96b1-37b85f844068	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:30:43.515	2026-05-02 13:30:43.515
2aaf0b60-f61b-466a-b9e7-dc44d8807989	9b1a384e-1866-480c-a05d-2b8fa8881ab4	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 13:41:25.046	2026-05-02 13:41:25.046
99f74a3c-0b0c-4fd6-b77b-2502be86ca10	0e3e49d9-a3bb-480f-b35a-6b5a6e0066d4	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 13:41:59.436	2026-05-02 13:41:59.436
b72dd371-2576-45cd-911e-f73cb0c95d0d	ccbad890-39c7-4489-83cd-c08f503664c1	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 13:43:26.223	2026-05-02 13:43:26.223
95532f4a-e6be-47a2-9480-fbc30a23ac17	ccbad890-39c7-4489-83cd-c08f503664c1	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:44:13.472	2026-05-02 13:44:13.472
f49d6bde-8a47-45aa-bdd3-f9e89e01a078	0e3e49d9-a3bb-480f-b35a-6b5a6e0066d4	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:44:25.339	2026-05-02 13:44:25.339
d7f9651c-eb03-47cb-94a4-6d929ea13904	9b1a384e-1866-480c-a05d-2b8fa8881ab4	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:44:37.707	2026-05-02 13:44:37.707
17231293-44ee-4d38-ada1-6394f80159fe	f2b1297e-64a4-476e-9aae-455d0c6bae64	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 13:55:41.969	2026-05-02 13:55:41.969
f71c148b-2374-4127-b0f1-9e01683611af	6ad5a09a-bb1c-46ae-947c-6bfdbccd4809	60000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 13:57:12.96	2026-05-02 13:57:12.96
cf0ff7bb-d8f4-4dd9-93b4-a30566a0c6ba	64d5a76b-31f3-44ab-a95f-f112aa78d963	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 13:57:16.469	2026-05-02 13:57:16.469
08e40690-95e0-4a39-bbcd-addaec35314d	b7ff9449-bbe4-4e31-8027-88f3833bed4d	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 14:07:25.394	2026-05-02 14:07:25.394
2b1bc8b3-92c1-4dba-8722-9c37c5a2f4d5	32278bdd-e645-4153-9f4e-7f23c0a5f050	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:17:19.059	2026-05-02 14:17:19.059
11f2b786-3bdd-4957-bbc1-d26530831602	88f8f3b6-638f-4f62-a011-4bdfaafa5054	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:17:30.872	2026-05-02 14:17:30.872
093fd36d-a052-4eff-9c0b-d9db39a0f594	2ff8df4a-2753-451f-af34-21b889b533c2	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:18:53.617	2026-05-02 14:18:53.617
679c4fb6-ee20-417c-b1c4-5b1ce7b2a115	2ff8df4a-2753-451f-af34-21b889b533c2	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:19:10.713	2026-05-02 14:19:10.713
3d664ddc-718d-4981-8f4c-dcc339d83ad0	907ac7b0-8a97-416a-97ae-58922e421bc6	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:19:54.764	2026-05-02 14:19:54.764
96acd2c0-c405-4924-9d4e-e9606eb0695d	9637a99d-b6e2-4ed7-aba7-0cfb8f44b8ea	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:21:12.431	2026-05-02 14:21:12.431
2863e510-f352-483c-b79b-81116891d3ce	e299e67c-cc2a-40df-8174-6d19e53abe78	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:22:16.413	2026-05-02 14:22:16.413
2d7fa0aa-bc5a-4c3b-8a0b-52732460b594	e299e67c-cc2a-40df-8174-6d19e53abe78	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-02 14:22:49.795	2026-05-02 14:22:49.795
05670d1f-15d4-4907-970c-da62551e6753	7cef032b-a430-4dee-b1f3-ad50a8a0c9c1	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 17:19:11.545	2026-05-02 17:19:11.545
4fdd263a-3b64-4eb6-a9d3-214cb999378a	a79d9ae9-180d-4751-91dd-ebe5c417bc18	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 17:19:26.909	2026-05-02 17:19:26.909
a2dfe289-53a9-486b-987f-d75f194432be	b5d65170-d80a-4df3-873d-776d133e1b72	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 17:31:58.8	2026-05-02 17:31:58.8
d61fc458-34be-4718-bb4a-387340d7af9a	af6bf516-5d70-41fe-b8b7-37acf1190b4d	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 17:40:01.093	2026-05-02 17:40:01.093
9166f908-434c-48ba-96bf-49d065df1db2	0277ed9a-6d22-4ea1-af3d-837540c7d0e1	50000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 17:40:09.091	2026-05-02 17:40:09.091
4f9b185e-1af0-44fc-b654-a8b2802e3b2e	46ada499-2102-4479-8f4e-09ba60e6c82d	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 17:55:12.051	2026-05-02 17:55:12.051
b7c109a1-933c-4def-8861-c8bcd752c98e	4c7ed724-a568-4870-9197-ceeb2a6c3d0b	15000.00	CASH	\N	e9d202a9-4b08-473b-a92f-17bde19d07ad	2026-05-02 17:55:38.916	2026-05-02 17:55:38.916
0d8b2609-b38b-4a1f-a340-4bed7378b99d	d38447de-bf56-451f-8391-581af1f2f3e0	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 04:44:11.385	2026-05-03 04:44:11.385
c9bf4dd3-c67b-436f-b290-790e521d4f5f	729a296d-79a5-4061-b2ac-c2712928f9b7	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 04:44:15.614	2026-05-03 04:44:15.614
cfd0b41b-355a-4ce2-b2c7-ab61e87fa7b0	9da2e453-3a89-4b8f-98a4-69d1d37878ab	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 04:44:19.397	2026-05-03 04:44:19.397
39ffb64c-8d18-4f67-983a-c13e364a9d1c	def41543-2cee-4f8a-8ba1-dc097466aaee	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 04:44:23.672	2026-05-03 04:44:23.672
8b407cf1-1c12-4a27-a09c-e2b45a8e6cb0	e1dc03cf-b09e-4139-b30a-9da3ffc5d51e	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 06:08:38.358	2026-05-03 06:08:38.358
728df613-b091-48fe-81b9-70cda6c16848	e1dc03cf-b09e-4139-b30a-9da3ffc5d51e	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 06:25:45.726	2026-05-03 06:25:45.726
0d3e76b2-c8f1-41db-8e01-e96788a45d31	75d3b5cd-bb5e-46c8-8ae1-6da13760e184	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 07:06:17.245	2026-05-03 07:06:17.245
5548944d-8567-4368-8ff4-4d74d532a225	75d3b5cd-bb5e-46c8-8ae1-6da13760e184	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 07:06:39.761	2026-05-03 07:06:39.761
aad34e43-2ceb-4b76-815f-81e1937066a1	7681fed0-c069-4cf5-8f6b-242e8e233665	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 07:51:22.994	2026-05-03 07:51:22.994
2d9f870d-8942-4e6a-89b7-c592d54e56e4	3ae5bafe-cde3-4556-a5d3-0b6533967d54	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 07:52:25.504	2026-05-03 07:52:25.504
f57a52ad-a911-4092-8a75-2cb3f804f1fe	673b0cb4-4e9d-4974-a1aa-7fc3512617e3	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 07:58:39.64	2026-05-03 07:58:39.64
1603b804-bc10-4972-8dab-0599f986d0b4	c8510081-49f2-4f8e-8baf-2056279ea1cd	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 07:58:46.335	2026-05-03 07:58:46.335
c79c4d3c-38d6-417f-a361-595ad4117b2c	c90b0a59-3609-49b4-8112-0e3f8d40a808	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 08:26:41.276	2026-05-03 08:26:41.276
61f4107e-7c57-4146-90c7-c479c817644d	bdab0c7b-05ea-46ed-8378-2d77ef5422d8	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 09:13:56.17	2026-05-03 09:13:56.17
21c7636d-ff6a-498d-9249-0de6009c36d7	37fc4f27-b150-40dd-8ef2-2b1701bd2a07	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 09:22:43.889	2026-05-03 09:22:43.889
251956a4-dc35-4811-85ac-572090aaf219	308e3338-c580-40c0-8420-f458fbfb978d	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 09:23:01.174	2026-05-03 09:23:01.174
3d66c103-ecd1-4b09-abd6-2cfa765e05cd	f1a3f7ae-a0b0-40bf-be63-cafa057f54bb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 09:28:54.634	2026-05-03 09:28:54.634
a8601642-058b-42a3-bfc9-8552613ef120	9e160fb1-3f47-4883-a25f-4aef0a15494c	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 09:32:45.968	2026-05-03 09:32:45.968
e94d696f-f2c2-466b-bd8b-f6774d189c27	3d755a37-1c5f-4c03-aade-bb4b7a02f349	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 09:38:43.441	2026-05-03 09:38:43.441
ea161007-0f40-4e96-b458-c05c9058049b	caf5a04a-3db6-4741-b9af-75e98c2bf66d	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 10:06:14.396	2026-05-03 10:06:14.396
209ce040-6299-4cbf-881d-cfbf5888877a	5026a67f-7492-4659-9d5b-1fc3d541d7c0	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 10:06:31.822	2026-05-03 10:06:31.822
909f08e3-5b45-45c7-b029-5bbe6bf8c93c	5eeff971-e27e-4a50-a4f2-13f457175da0	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 11:50:02.18	2026-05-03 11:50:02.18
52be02a4-f028-484f-be6e-be3395087511	9ec499ab-a82c-49df-8607-8b36a7b8e72a	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:22:36.621	2026-05-03 12:22:36.621
5b1887f9-f8cf-451f-8158-76e8e284ec80	3c528bc7-7abc-4960-ad0e-3fbab71413bf	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:23:02.997	2026-05-03 12:23:02.997
5e3c24ce-b203-4c45-9f3f-fdda60fbfde3	46a83e7f-3a1c-4e81-9d94-18c7d4abbc91	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:23:13.591	2026-05-03 12:23:13.591
c88ac503-2f3b-4500-8346-498c0d295b53	ffd072fc-9f22-4ccf-bd7f-039972e6fe15	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:35:58.016	2026-05-03 12:35:58.016
192394ba-b695-462c-afd3-2c7709f46471	6fb4c294-1232-4dc9-8870-14fc4bdbcbd6	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:36:17.454	2026-05-03 12:36:17.454
44b769ef-407b-480c-b543-c5fc8af68da3	0242dadf-28d5-41ea-af80-8bedc691fbd8	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:38:57.059	2026-05-03 12:38:57.059
111d759a-f22f-4bc6-a49a-8aff06847240	7b6a3b94-1352-4eda-9d0a-52b5295b3631	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:39:13.364	2026-05-03 12:39:13.364
42092ca3-a8d7-4d14-a3ad-c4130b926a73	06dc96d4-fec3-4cd1-b2c7-764fc50d4ae0	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:40:41.405	2026-05-03 12:40:41.405
984852cb-7827-4d67-9c7d-a0919928bc4a	2bdd0980-078e-4e90-b761-113a2b88fe2f	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:42:06.861	2026-05-03 12:42:06.861
c6ee7909-c052-4fe3-9c4b-750789601bdc	c3169f58-8630-4a2e-a455-e832d9ea5b46	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 12:53:04.981	2026-05-03 12:53:04.981
344122f4-73c8-42a6-99a2-0beaf66d92f8	7b6a3b94-1352-4eda-9d0a-52b5295b3631	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 14:39:08.538	2026-05-03 14:39:08.538
f09f7c80-6e90-4461-a60c-e85ba3a4b0f3	0242dadf-28d5-41ea-af80-8bedc691fbd8	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-03 14:39:17.806	2026-05-03 14:39:17.806
39eaad3e-ac03-468a-819d-13ef3a39cd7f	82c82ffc-ce4a-432c-a501-774380219017	30000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 08:25:53.702	2026-05-04 08:25:53.702
29f01597-6c1c-408f-bb96-a3a9a1dc77e4	dfde69e4-07fe-4632-82cd-9f8fab155448	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 08:53:02.845	2026-05-04 08:53:02.845
5c42da97-ffb8-4ba2-8dc0-3ff10c8cdcb2	2bdd0980-078e-4e90-b761-113a2b88fe2f	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:12:45.809	2026-05-04 09:12:45.809
7e6b092e-2ada-47f0-8ea6-58dbf463885c	4d946c15-6e3c-4587-b22a-d2237b87369d	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:15:11.568	2026-05-04 09:15:11.568
ca6a703e-f33a-4cb3-b5fd-b0c986481556	4d946c15-6e3c-4587-b22a-d2237b87369d	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:19:25.924	2026-05-04 09:19:25.924
81b850e0-77c4-4edd-a143-8b57e4d64141	fd43a45e-ad21-4a80-a0c9-9b43f770b8cb	325000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:19:53.71	2026-05-04 09:19:53.71
d5a180a6-7bfd-4821-9b44-3d7b8d090534	281d3bd7-ce7f-4a6e-a9c5-c09b0962fbc4	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:45:35.693	2026-05-04 09:45:35.693
e4e0950b-38bd-4295-9482-12af9b131d13	d31f95d1-417a-4666-ab82-2d491317bd5f	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:53:39.963	2026-05-04 09:53:39.963
ecc79237-8614-4683-95cb-925487321ac6	e5699cc7-0a5f-4118-a331-136e219176e2	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:53:49.939	2026-05-04 09:53:49.939
ef80a84c-1b33-4188-97e1-35da31880766	e5699cc7-0a5f-4118-a331-136e219176e2	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 09:54:40.126	2026-05-04 09:54:40.126
e229416d-6c36-4a13-8dfa-9821eecb9683	4e3eeb4e-4c65-49d2-a0f7-2f99bb6f74f6	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 10:45:10.387	2026-05-04 10:45:10.387
9493db49-442f-405a-92a7-57b80b1d5102	b6f73127-652d-485b-8359-698c6ce13ecd	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 11:43:29.287	2026-05-04 11:43:29.287
adc6b63b-994d-4660-9c5d-a1dafe1a62b3	def72283-6669-49d7-bcb2-2047e7b74861	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 11:43:47.063	2026-05-04 11:43:47.063
8066335f-4874-4e7d-98ab-883a61e4f190	3c5d98ac-89fc-48be-a9a1-9d610d756393	25000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 11:55:01.225	2026-05-04 11:55:01.225
c2606567-fc9e-4b51-9e8e-8cff38ac025b	707188bb-8447-44b7-b73a-837d68a8e0e8	80000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 11:55:25.179	2026-05-04 11:55:25.179
c67aa965-459c-467f-b430-fa9e8a81a643	b047294e-b0e1-48eb-acf8-540a2ef96afe	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 11:55:36.46	2026-05-04 11:55:36.46
8fb2a2bb-fb59-4c47-8527-d8efffd45c89	16b78ffd-8c90-4d5c-b925-282af6356afb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 12:10:02.705	2026-05-04 12:10:02.705
3dfec0cc-6916-47b1-86dc-8d940c271dcc	291e1db7-ad0c-4ae5-a28e-1364459717c9	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 12:29:36.886	2026-05-04 12:29:36.886
f4272e3d-34e2-4f09-b6b0-2c2b36a5e65d	b7c88c3d-2bae-40d5-aa8a-581724a594ef	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-04 12:35:44.453	2026-05-04 12:35:44.453
b7d970d4-c754-43a5-a76c-58c02bc90c57	7a6bffa5-f127-4866-91cb-dffd7d8276bc	25000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-05 09:12:32.458	2026-05-05 09:12:32.458
ad1c61b9-9cc5-432a-921e-17905defcced	1dc44b6a-503f-43e1-85b7-e0e22d49e11a	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-05 11:30:20.969	2026-05-05 11:30:20.969
aa0d33a5-d346-4901-b4be-b69b67e3f34f	a5267fb1-901c-47f7-ba7b-c060b26b235d	25000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-05 11:55:38.776	2026-05-05 11:55:38.776
24be016d-ec51-40f9-956b-56982f8de928	f2165ba5-45a5-4077-a1db-ee2ba3b704b3	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-05 12:37:37.303	2026-05-05 12:37:37.303
5d70cc82-e0b4-483a-a317-8802abc200dc	aaac3849-7bdd-489f-a9de-e337fc4d2afe	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-05 12:39:54.845	2026-05-05 12:39:54.845
4af234ef-a082-4add-8d12-76c564bfac18	a9f3ba60-1533-4726-8dde-6658f0f319da	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:37:40.111	2026-05-06 07:37:40.111
0dee2bb2-840f-49dc-bd9c-5ed0bb008daf	16b78ffd-8c90-4d5c-b925-282af6356afb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:54:51.481	2026-05-06 07:54:51.481
61f11fb1-f485-48b9-9b93-107725015cf7	90a16a20-8cd2-4f7a-9d55-542f59496b42	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:54:57.956	2026-05-06 07:54:57.956
5595eef2-8775-486b-9ad1-59c5ee1f8aec	bbbaef0c-4a6f-4a53-b02b-338c27d1179e	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:55:04.023	2026-05-06 07:55:04.023
aef238a8-d229-4675-86dd-b96281b927e2	ff15a27d-60d0-4007-aeac-8031762a7e72	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:55:09.529	2026-05-06 07:55:09.529
15cda21b-465a-4eb6-a67f-5347b390284f	06dc96d4-fec3-4cd1-b2c7-764fc50d4ae0	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:55:16.084	2026-05-06 07:55:16.084
f3143faa-87d0-4e9a-96ee-aec03fe6e694	718ec3ce-a472-4712-a12e-d95e78362e7f	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 07:55:33.973	2026-05-06 07:55:33.973
0b5e0615-7e5b-48ef-bd2f-34d6de7394cd	73229b12-0a0d-43d2-9a7a-d5fb7f2f5375	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 09:20:25.596	2026-05-06 09:20:25.596
67192222-7394-434f-8873-a51a70f17842	e292d37d-9864-4ae5-9c69-eb37dfc5e3cf	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 10:07:34.919	2026-05-06 10:07:34.919
26f43883-d571-4702-bc25-da24f9bfa1a9	70c11b47-2ba7-4d5b-9da7-da75d6731f65	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 10:14:58.01	2026-05-06 10:14:58.01
76332bbe-3d1e-4b85-90c9-59eefc3279b9	a63f4cc4-300c-4c26-9d4f-91fe4037b5cf	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 16:07:27.769	2026-05-06 16:07:27.769
524b593b-7b85-4f0f-8945-dcc59e02ce55	70c11b47-2ba7-4d5b-9da7-da75d6731f65	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 17:06:16.144	2026-05-06 17:06:16.144
d002e480-842e-47bf-99c1-143da29973fd	a63f4cc4-300c-4c26-9d4f-91fe4037b5cf	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 17:06:40.279	2026-05-06 17:06:40.279
d981727a-025e-466b-b690-c67de3a2824c	af7aaf79-c08a-4fab-aac9-666318a29f00	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-06 17:08:19.851	2026-05-06 17:08:19.851
eaf9d976-76eb-4d4a-8158-bdfb8e8fa923	4e3eeb4e-4c65-49d2-a0f7-2f99bb6f74f6	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-07 06:19:22.269	2026-05-07 06:19:22.269
fbb5e865-f402-4e60-945a-4e1d0c6a5bea	2ddcf783-7b26-41e9-a386-33eb0337db03	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-07 15:58:51.476	2026-05-07 15:58:51.476
1a762c97-6abf-4f76-8c57-eafef3c933b5	ff376c8f-8c65-4e19-945a-528ea9f348d7	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-07 16:17:59.321	2026-05-07 16:17:59.321
14718360-2a93-4f37-bf3d-4d2959e0a57e	b44f50ab-7851-446c-ab87-7bf996a6b105	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-07 16:18:15.931	2026-05-07 16:18:15.931
41783de8-e8dd-4e69-a881-dc84dda22818	ffc22716-a47e-41b2-98dd-272d09756757	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 05:30:52.676	2026-05-08 05:30:52.676
ab0e12c8-1e69-40f6-9b03-07e5542a07ec	413142e7-5f2f-44b0-ab81-2548f0978e59	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 05:38:05.564	2026-05-08 05:38:05.564
0c10b540-527d-40c0-8c8e-6fccf14dcde6	73229b12-0a0d-43d2-9a7a-d5fb7f2f5375	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 05:38:34.321	2026-05-08 05:38:34.321
3f6dd2a8-8b84-4c47-b55d-72bd04e98042	e292d37d-9864-4ae5-9c69-eb37dfc5e3cf	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 05:38:35.564	2026-05-08 05:38:35.564
b077218b-9df3-4cc3-9070-0cd0eb275463	28581066-b346-4709-88a6-aa14f6864c3d	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 05:39:25.202	2026-05-08 05:39:25.202
2ce71fe0-320b-4af5-9cb2-675ddff5f928	9e160fb1-3f47-4883-a25f-4aef0a15494c	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:03.213	2026-05-08 06:58:03.213
a869c1c5-d799-4d44-a23a-ce22c1477686	308e3338-c580-40c0-8420-f458fbfb978d	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:05.142	2026-05-08 06:58:05.142
b8398514-6c96-471c-b5e4-ee0463a91a1c	c8510081-49f2-4f8e-8baf-2056279ea1cd	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:08.666	2026-05-08 06:58:08.666
4433e367-bb07-471c-9af4-aef7657fba72	673b0cb4-4e9d-4974-a1aa-7fc3512617e3	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:09.829	2026-05-08 06:58:09.829
5100b195-76fc-471a-af39-6d672d334bb7	c90b0a59-3609-49b4-8112-0e3f8d40a808	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:10.571	2026-05-08 06:58:10.571
fb3c5680-6f32-4fd3-ac63-a269709b9f9d	f1a3f7ae-a0b0-40bf-be63-cafa057f54bb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:12.297	2026-05-08 06:58:12.297
e8c7748b-39a4-4c8c-ba34-d92c21a81574	37fc4f27-b150-40dd-8ef2-2b1701bd2a07	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:12.912	2026-05-08 06:58:12.912
148878ce-105c-46b5-8706-5f4c29fd8b87	bdab0c7b-05ea-46ed-8378-2d77ef5422d8	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 06:58:13.116	2026-05-08 06:58:13.116
0eb86855-981f-4fab-a8ca-adba2dbd698c	a9f3ba60-1533-4726-8dde-6658f0f319da	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:13.348	2026-05-08 07:04:13.348
1af6a651-e355-42d7-a8ed-41de8f0b883e	f1114e00-837d-4075-b006-9c54179b7641	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:14.137	2026-05-08 07:04:14.137
637107e0-b22b-4861-a8e9-8d9156ce828b	984a2757-ea9a-4cd5-8f37-2f83bb20eca2	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:14.969	2026-05-08 07:04:14.969
ec6767fe-68fa-4b41-a6ff-5e2689ff1393	aaac3849-7bdd-489f-a9de-e337fc4d2afe	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:16.016	2026-05-08 07:04:16.016
2c467864-60f5-44f4-84e5-884d8defbe6a	f2165ba5-45a5-4077-a1db-ee2ba3b704b3	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:16.314	2026-05-08 07:04:16.314
d645c519-9b81-4650-9a72-4287fb3a42d7	a5267fb1-901c-47f7-ba7b-c060b26b235d	25000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:17.122	2026-05-08 07:04:17.122
d6991c16-b8ce-4c0b-b480-b284762bcc46	1dc44b6a-503f-43e1-85b7-e0e22d49e11a	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:17.472	2026-05-08 07:04:17.472
186c99ef-1f4b-4cc4-9fc1-1ceba5db805d	7a6bffa5-f127-4866-91cb-dffd7d8276bc	25000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:17.833	2026-05-08 07:04:17.833
7ac23470-1deb-49be-9bd3-1f4df55325a4	b7c88c3d-2bae-40d5-aa8a-581724a594ef	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:18.318	2026-05-08 07:04:18.318
b4021999-de86-4070-a4fb-b9c1e141de0f	b047294e-b0e1-48eb-acf8-540a2ef96afe	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:18.666	2026-05-08 07:04:18.666
a2a50290-c2f2-40f0-bf99-9a575fad69cb	707188bb-8447-44b7-b73a-837d68a8e0e8	80000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:18.958	2026-05-08 07:04:18.958
4fa049cc-dcc5-4905-ae04-ea9bc8580cb3	3c5d98ac-89fc-48be-a9a1-9d610d756393	25000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:19.313	2026-05-08 07:04:19.313
8bf0d4f6-2213-4a7b-a630-f97e4cee977b	def72283-6669-49d7-bcb2-2047e7b74861	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:19.636	2026-05-08 07:04:19.636
ce545d9f-6af1-462b-b7b4-8a27fa0f0bed	b6f73127-652d-485b-8359-698c6ce13ecd	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:20.116	2026-05-08 07:04:20.116
35304f56-bf1a-4fa8-a1ab-fa1ac7029290	d31f95d1-417a-4666-ab82-2d491317bd5f	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:20.459	2026-05-08 07:04:20.459
dbe2f120-c512-4cc4-9d37-8190bd6d3d09	6fb4c294-1232-4dc9-8870-14fc4bdbcbd6	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:20.934	2026-05-08 07:04:20.934
b2a1f428-3d41-4560-b671-c141776766d0	ffd072fc-9f22-4ccf-bd7f-039972e6fe15	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:21.314	2026-05-08 07:04:21.314
41ddd0dc-3a72-4ac0-8204-7c22c15ee25e	46a83e7f-3a1c-4e81-9d94-18c7d4abbc91	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:21.821	2026-05-08 07:04:21.821
10e61b49-a9f8-4f41-8250-a1b88790cdea	3c528bc7-7abc-4960-ad0e-3fbab71413bf	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:22.161	2026-05-08 07:04:22.161
af5a7801-8dbb-478e-a9ba-6e4312328c38	9ec499ab-a82c-49df-8607-8b36a7b8e72a	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:22.518	2026-05-08 07:04:22.518
dcf07d48-dccb-4006-bfae-904cb71329ac	5eeff971-e27e-4a50-a4f2-13f457175da0	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:23.168	2026-05-08 07:04:23.168
293dbeb7-c491-4869-a9fa-f290ec172cc5	5026a67f-7492-4659-9d5b-1fc3d541d7c0	600000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:23.562	2026-05-08 07:04:23.562
456a48ec-2ebb-4ca1-bc9a-f0b95ac5f65f	caf5a04a-3db6-4741-b9af-75e98c2bf66d	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:23.846	2026-05-08 07:04:23.846
5cc4f77d-2474-49a5-9cf8-7b1277d7cb4e	3d755a37-1c5f-4c03-aade-bb4b7a02f349	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:24.225	2026-05-08 07:04:24.225
fe86dc32-0b6a-4f63-a438-c4d4615cc151	3ae5bafe-cde3-4556-a5d3-0b6533967d54	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:24.51	2026-05-08 07:04:24.51
7f51024a-908d-4a60-99d4-f0d6542a331b	7681fed0-c069-4cf5-8f6b-242e8e233665	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:25.701	2026-05-08 07:04:25.701
b01dcde6-2e6a-42cc-95b8-dd09ce9e78f6	def41543-2cee-4f8a-8ba1-dc097466aaee	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:26.569	2026-05-08 07:04:26.569
8b25d44d-1dfd-4104-81c3-215775d7f194	9da2e453-3a89-4b8f-98a4-69d1d37878ab	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:26.9	2026-05-08 07:04:26.9
45607d2d-d428-46fb-a49d-28a1427c19ff	729a296d-79a5-4061-b2ac-c2712928f9b7	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:27.272	2026-05-08 07:04:27.272
5f11d67e-c81a-4ac6-bdae-df405e950def	d38447de-bf56-451f-8391-581af1f2f3e0	50000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:27.633	2026-05-08 07:04:27.633
9ba118c3-f271-4e5b-ae9f-ac811039fce2	4c7ed724-a568-4870-9197-ceeb2a6c3d0b	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:04:27.953	2026-05-08 07:04:27.953
207628c7-7cbd-4103-9f33-3dac6f7bfefa	6ad5a09a-bb1c-46ae-947c-6bfdbccd4809	60000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:09:00.61	2026-05-08 07:09:00.61
c468e575-43fd-45fe-a028-0f4ffba0257d	7cef032b-a430-4dee-b1f3-ad50a8a0c9c1	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 07:09:51.913	2026-05-08 07:09:51.913
ad297cf4-ebff-4dc4-a233-8c0e16f34985	6a1d4e9b-a592-4833-9df9-faf192118ecb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 10:35:14.963	2026-05-08 10:35:14.963
e3a711fc-9a88-4e68-8ec8-615cd86b3a8f	2a3b6014-9da5-44ee-b032-a25e1881503f	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 10:35:27.368	2026-05-08 10:35:27.368
cc408dd5-f20b-4a08-af07-2aeaa75cb622	b5bdebf5-4a51-4ba4-97f5-39deda929b5b	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 10:35:42.04	2026-05-08 10:35:42.04
18456f54-760b-4fb5-9a84-2bcd660e17be	c6a8f433-2ac6-49de-b418-91bbc4c58a72	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 10:36:31.893	2026-05-08 10:36:31.893
5156c445-fa51-4303-8511-a89a32ba3903	b21e427e-1f17-4a18-b437-34136bb29862	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 11:31:04.296	2026-05-08 11:31:04.296
6df9db98-1f4a-4d8a-9c3f-bf1a9a8f06ab	6a1d4e9b-a592-4833-9df9-faf192118ecb	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 12:01:12.543	2026-05-08 12:01:12.543
e338a92a-ff3d-4dab-9667-f068da2d0226	a053e071-b6ee-46b8-8cc3-3e86e1164b33	0.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-08 15:24:59.88	2026-05-08 15:24:59.88
c1c4da55-47ed-4182-8c72-63fdce70bb24	264430b5-ce48-4b32-abd5-2cdfb3915205	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-09 05:00:54.666	2026-05-09 05:00:54.666
e96bd44f-ff69-4b43-aad0-5a6ffe3aefec	7b7b52e4-bd21-4d37-87d9-de7cf9a758cf	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-09 05:01:08.483	2026-05-09 05:01:08.483
58aab50c-6ed3-4552-bea0-54615005e7ff	fdc06f4e-3a69-4de1-a8d7-edf15e61cc44	80000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-09 09:16:23.61	2026-05-09 09:16:23.61
5e42ddd2-4c10-4b0c-9b10-2d62ee5d3175	dcfeda52-bead-47f5-adab-084460cfe060	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-09 09:16:28.674	2026-05-09 09:16:28.674
446a8ce2-391d-4c87-95e6-bacffc182fbc	24e8e8c5-f242-4d80-a549-c41f848d6151	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-09 09:16:32.276	2026-05-09 09:16:32.276
9c11168e-9366-42bd-8967-ad88e7a67b00	d4ab2e58-878e-432a-b426-5e36cea10fd7	15000.00	CASH	\N	e779f0bf-302e-41dd-b520-399e0a218403	2026-05-09 09:16:37.504	2026-05-09 09:16:37.504
0b41b140-ca02-4d13-b9b2-db302789130a	29d5dd6f-118b-47f8-bb49-66536af3c512	15000.00	CASH	\N	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	2026-05-09 10:23:01.773	2026-05-09 10:23:01.773
dc828718-5c10-49d2-ae1e-cbe41f899214	a4adfccf-e852-4c0f-8cf7-70556b936c0d	15000.00	CASH	\N	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	2026-05-09 10:27:04.887	2026-05-09 10:27:04.887
7634f95b-af86-456f-9f6a-14389aa5a5d7	01304a66-de30-435e-aedd-a875e7885bde	25000.00	CASH	\N	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	2026-05-09 10:27:20.504	2026-05-09 10:27:20.504
a13a2b33-f334-48b4-8788-e0884ea65447	432dace0-3388-45b6-bcfb-1a6fa213fa3b	15000.00	CASH	\N	87c3dc0a-e5d2-452b-a938-733ecfeddfeb	2026-05-09 10:27:46.57	2026-05-09 10:27:46.57
\.


--
-- Data for Name: pricing_rules; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.pricing_rules (id, vehicle_type_id, pricing_type, base_price, hourly_rate, daily_rate, weekly_rate, monthly_rate, free_minutes, is_active, effective_from, effective_to, created_at, updated_at) FROM stdin;
ec2ac0b9-92b3-4b7e-9bbe-7cefb905ac33	1	HOURLY	0.00	5000.00	25000.00	100000.00	250000.00	15	t	\N	\N	2026-05-01 14:31:32.936	2026-05-03 14:22:26.509
d06e2789-83ca-466d-870f-b7757f906e21	2	HOURLY	0.00	3000.00	15000.00	80000.00	150000.00	15	t	\N	\N	2026-05-01 14:31:32.951	2026-05-03 14:22:59.635
036b95db-98eb-4b23-a876-3ee8ddd7792d	3	HOURLY	0.00	3000.00	15000.00	80000.00	150000.00	15	t	\N	\N	2026-05-01 14:31:32.961	2026-05-03 14:23:11.068
c0b088eb-4c92-446b-8b8b-5ef2ca8b386c	4	HOURLY	0.00	10000.00	80000.00	250000.00	400000.00	15	t	\N	\N	2026-05-01 14:31:32.973	2026-05-03 14:23:45.57
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.refresh_tokens (id, user_id, token, expires_at, is_revoked, created_at) FROM stdin;

\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.system_settings (id, key, value, description, updated_at, updated_by) FROM stdin;
72bbf75d-b520-46d7-ba6f-5be045ddef46	currency	{"code": "LAK", "name": "Lao Kip", "symbol": "₭"}	System currency	2026-05-01 14:31:33.006	e779f0bf-302e-41dd-b520-399e0a218403
a86d9d32-0db7-4e30-9c48-ab3ab0e5b5c5	receipt_footer	{"text": "ຂອບໃຈທີ່ໃຊ້ບໍລິການ / Thank you for using our service"}	Footer text on printed receipts	2026-05-01 14:31:33.08	e779f0bf-302e-41dd-b520-399e0a218403
e3cd7d0a-31f8-47cb-bc02-982d13c50527	printer_config	{"type": "bluetooth", "encoding": "UTF-8", "paperWidth": 58}	Thermal printer configuration	2026-05-01 14:31:33.113	e779f0bf-302e-41dd-b520-399e0a218403
23f0cb1c-0f2d-491e-b567-a63f600e10d7	parking_capacity	{"limit": 0, "threshold": 0.9}	Optional parking capacity limit (0 = unlimited). Emits alert when threshold is reached.	2026-05-01 14:39:05.983	e779f0bf-302e-41dd-b520-399e0a218403
d1b90d7a-41f7-4421-af36-c3998abb06e3	parking_logo	{"url": "/uploads/logo.png", "enabled": true}	Parking Logo	2026-05-02 12:56:27.538	e779f0bf-302e-41dd-b520-399e0a218403
62f1ca25-f79c-4dca-b130-1488f3d2f2ce	qr_payment_image	{"url": "/uploads/ea4750c8-92e4-486e-9991-f4281e0f9fee.png", "enabled": true}	QR Payment Image	2026-05-02 13:30:56.685	e779f0bf-302e-41dd-b520-399e0a218403
0b3dbb9e-a55e-4325-be28-86afb9aadef2	parking_name	{"name": "PARKO V3.0", "subtitle": "ໂປຣແກຣມບໍລິຫານຈັດການບ່ອນຈອດລົດ"}	Parking name	2026-05-06 11:11:28.975	e779f0bf-302e-41dd-b520-399e0a218403
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.users (id, username, email, password_hash, display_name, role, is_active, created_at, updated_at, phone_number) FROM stdin;
433b8a16-49fa-4fd8-9669-3698f719d5d3	testuser	test@parko.com	$2b$10$2cgb7Yqjx9ccRJgyZpaAyel71BI1c.zxIBwA7PMgdYFQsp1nbdEZ2	testuser	STAFF	t	2026-05-01 15:07:31.93	2026-05-01 15:07:31.93	0209999999
a40b6cfb-722e-4167-ac33-4f4a477646a3	user1	user1@gmail.com	$2b$10$2cgb7Yqjx9ccRJgyZpaAyel71BI1c.zxIBwA7PMgdYFQsp1nbdEZ2	user1	STAFF	t	2026-05-02 06:18:50.077	2026-05-02 06:18:50.077	\N
70a1eaff-e449-4bf4-a0f5-30941ef55793	user2	user2@gmail.com	$2b$10$2cgb7Yqjx9ccRJgyZpaAyel71BI1c.zxIBwA7PMgdYFQsp1nbdEZ2	user2	STAFF	t	2026-05-03 07:03:58.698	2026-05-03 07:04:41.438	\N
e9d202a9-4b08-473b-a92f-17bde19d07ad	staff01	staff01@parko.local	$2b$10$2cgb7Yqjx9ccRJgyZpaAyel71BI1c.zxIBwA7PMgdYFQsp1nbdEZ2	Staff 01	ADMIN	t	2026-05-01 14:31:32.841	2026-05-03 11:49:16.587	\N
e779f0bf-302e-41dd-b520-399e0a218403	admin	admin@parko.local	$2b$10$0y4/7nl8mQUQleclHtMHXeBgl45kdmkcy4e2iHU/DrnrPUI13OdBu	Admin	ADMIN	t	2026-05-01 14:31:32.192	2026-05-03 14:38:19.45	\N
87c3dc0a-e5d2-452b-a938-733ecfeddfeb	user3	user3@gmail.com	$2b$10$2cgb7Yqjx9ccRJgyZpaAyel71BI1c.zxIBwA7PMgdYFQsp1nbdEZ2	user3	STAFF	t	2026-05-04 06:58:15.331	2026-05-04 06:58:15.331	\N
\.


--
-- Data for Name: vehicle_types; Type: TABLE DATA; Schema: public; Owner: parko
--

COPY public.vehicle_types (id, name, label, icon, description, is_active, sort_order, created_at) FROM stdin;
1	car	ລົດໃຫຍ່	🚗	Car / ລົດໃຫຍ່	t	1	2026-05-01 14:31:32.86
2	motorcycle	ລົດຈັກ	🏍️	Motorcycle / ລົດຈັກ	t	2	2026-05-01 14:31:32.882
3	ev_motorcycle	ລົດຈັກໄຟຟ້າ	⚡	EV Motorcycle / ລົດຈັກໄຟຟ້າ	t	3	2026-05-01 14:31:32.897
4	truck	ລົດບັນທຸກ	🚛	Truck / ລົດບັນທຸກ	t	4	2026-05-01 14:31:32.911
\.


--
-- Name: vehicle_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: parko
--

SELECT pg_catalog.setval('public.vehicle_types_id_seq', 5, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: lost_ticket_cases lost_ticket_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.lost_ticket_cases
    ADD CONSTRAINT lost_ticket_cases_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: notification_configs notification_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.notification_configs
    ADD CONSTRAINT notification_configs_pkey PRIMARY KEY (id);


--
-- Name: parking_tickets parking_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.parking_tickets
    ADD CONSTRAINT parking_tickets_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicle_types vehicle_types_pkey; Type: CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.vehicle_types
    ADD CONSTRAINT vehicle_types_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_type_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX audit_logs_entity_type_idx ON public.audit_logs USING btree (entity_type);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: lost_ticket_cases_resolution_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX lost_ticket_cases_resolution_idx ON public.lost_ticket_cases USING btree (resolution);


--
-- Name: lost_ticket_cases_ticket_id_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX lost_ticket_cases_ticket_id_key ON public.lost_ticket_cases USING btree (ticket_id);


--
-- Name: memberships_end_date_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX memberships_end_date_idx ON public.memberships USING btree (end_date);


--
-- Name: memberships_member_code_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX memberships_member_code_idx ON public.memberships USING btree (member_code);


--
-- Name: memberships_member_code_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX memberships_member_code_key ON public.memberships USING btree (member_code);


--
-- Name: memberships_plate_number_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX memberships_plate_number_idx ON public.memberships USING btree (plate_number);


--
-- Name: memberships_status_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX memberships_status_idx ON public.memberships USING btree (status);


--
-- Name: parking_tickets_check_in_at_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX parking_tickets_check_in_at_idx ON public.parking_tickets USING btree (check_in_at);


--
-- Name: parking_tickets_membership_id_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX parking_tickets_membership_id_idx ON public.parking_tickets USING btree (membership_id);


--
-- Name: parking_tickets_payment_status_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX parking_tickets_payment_status_idx ON public.parking_tickets USING btree (payment_status);


--
-- Name: parking_tickets_plate_letters_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX parking_tickets_plate_letters_idx ON public.parking_tickets USING btree (plate_letters);


--
-- Name: parking_tickets_plate_number_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX parking_tickets_plate_number_idx ON public.parking_tickets USING btree (plate_number);


--
-- Name: parking_tickets_status_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX parking_tickets_status_idx ON public.parking_tickets USING btree (status);


--
-- Name: parking_tickets_ticket_number_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX parking_tickets_ticket_number_idx ON public.parking_tickets USING btree (ticket_number);


--
-- Name: parking_tickets_ticket_number_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX parking_tickets_ticket_number_key ON public.parking_tickets USING btree (ticket_number);


--
-- Name: payments_paid_at_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX payments_paid_at_idx ON public.payments USING btree (paid_at);


--
-- Name: payments_ticket_id_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX payments_ticket_id_idx ON public.payments USING btree (ticket_id);


--
-- Name: pricing_rules_vehicle_type_id_is_active_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX pricing_rules_vehicle_type_id_is_active_idx ON public.pricing_rules USING btree (vehicle_type_id, is_active);


--
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX refresh_tokens_token_idx ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: parko
--

CREATE INDEX refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: uq_active_plate_composite; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX uq_active_plate_composite ON public.parking_tickets USING btree (vehicle_type_id, plate_province, plate_letters, plate_number) WHERE ((status = 'ACTIVE'::public."TicketStatus") AND (plate_number IS NOT NULL) AND (plate_letters IS NOT NULL));


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_phone_number_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX users_phone_number_key ON public.users USING btree (phone_number);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: vehicle_types_name_key; Type: INDEX; Schema: public; Owner: parko
--

CREATE UNIQUE INDEX vehicle_types_name_key ON public.vehicle_types USING btree (name);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lost_ticket_cases lost_ticket_cases_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.lost_ticket_cases
    ADD CONSTRAINT lost_ticket_cases_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lost_ticket_cases lost_ticket_cases_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.lost_ticket_cases
    ADD CONSTRAINT lost_ticket_cases_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lost_ticket_cases lost_ticket_cases_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.lost_ticket_cases
    ADD CONSTRAINT lost_ticket_cases_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.parking_tickets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: memberships memberships_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: memberships memberships_vehicle_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_vehicle_type_id_fkey FOREIGN KEY (vehicle_type_id) REFERENCES public.vehicle_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: parking_tickets parking_tickets_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.parking_tickets
    ADD CONSTRAINT parking_tickets_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: parking_tickets parking_tickets_checked_out_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.parking_tickets
    ADD CONSTRAINT parking_tickets_checked_out_by_fkey FOREIGN KEY (checked_out_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: parking_tickets parking_tickets_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.parking_tickets
    ADD CONSTRAINT parking_tickets_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: parking_tickets parking_tickets_vehicle_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.parking_tickets
    ADD CONSTRAINT parking_tickets_vehicle_type_id_fkey FOREIGN KEY (vehicle_type_id) REFERENCES public.vehicle_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.parking_tickets(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: pricing_rules pricing_rules_vehicle_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.pricing_rules
    ADD CONSTRAINT pricing_rules_vehicle_type_id_fkey FOREIGN KEY (vehicle_type_id) REFERENCES public.vehicle_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parko
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: parko
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 2KFW7OpuFDiatvGxY7Kf2LrC6QOmtfjZAwlWlqU5Pb16yAb9x9Iz2YgFNfyeNWP

