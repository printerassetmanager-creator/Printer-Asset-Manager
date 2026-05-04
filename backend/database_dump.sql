--
-- PostgreSQL database dump
--

\restrict k5ZnQ55y5lbvmKuc73RteAGt3Peg97arw0cnRwaJxvabQx3LQNqqrZLNQrNQTTR

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.user_approvals DROP CONSTRAINT IF EXISTS user_approvals_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issue_activity_log DROP CONSTRAINT IF EXISTS issue_activity_log_issue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.i_learn_steps DROP CONSTRAINT IF EXISTS i_learn_steps_issue_id_fkey;
ALTER TABLE IF EXISTS ONLY public.app_support_servers DROP CONSTRAINT IF EXISTS app_support_servers_terminal_id_fkey;
DROP INDEX IF EXISTS public.idx_steps_step_number;
DROP INDEX IF EXISTS public.idx_steps_issue_id;
DROP INDEX IF EXISTS public.idx_registration_otps_email_created;
DROP INDEX IF EXISTS public.idx_printer_status_logs_pmno_time;
DROP INDEX IF EXISTS public.idx_printer_status_logs_logged_at;
DROP INDEX IF EXISTS public.idx_printer_location_logs_pmno_time;
DROP INDEX IF EXISTS public.idx_issues_created_at;
DROP INDEX IF EXISTS public.idx_issues_category;
DROP INDEX IF EXISTS public.idx_issue_unique_id;
DROP INDEX IF EXISTS public.idx_issue_status;
DROP INDEX IF EXISTS public.idx_issue_activity_issue_id;
DROP INDEX IF EXISTS public.idx_i_learn_steps_step_number;
DROP INDEX IF EXISTS public.idx_i_learn_steps_issue_id;
DROP INDEX IF EXISTS public.idx_i_learn_issues_created_at;
DROP INDEX IF EXISTS public.idx_i_learn_issues_category;
DROP INDEX IF EXISTS public.idx_health_checkup_activity_checked_at;
DROP INDEX IF EXISTS public.idx_cartridge_usage_used_at;
DROP INDEX IF EXISTS public.idx_cartridge_usage_dn;
DROP INDEX IF EXISTS public.idx_backup_printers_plant_dpi;
DROP INDEX IF EXISTS public.idx_app_support_terminal_history_terminal_code_recorded_at;
DROP INDEX IF EXISTS public.idx_app_support_terminal_history_recorded_at;
DROP INDEX IF EXISTS public.idx_app_support_terminal_failed_devices_failed_at;
DROP INDEX IF EXISTS public.idx_app_support_terminal_deploy_history_pc;
ALTER TABLE IF EXISTS ONLY public.vlan DROP CONSTRAINT IF EXISTS vlan_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_approvals DROP CONSTRAINT IF EXISTS user_approvals_pkey;
ALTER TABLE IF EXISTS ONLY public.spare_parts DROP CONSTRAINT IF EXISTS spare_parts_pkey;
ALTER TABLE IF EXISTS ONLY public.spare_parts DROP CONSTRAINT IF EXISTS spare_parts_code_key;
ALTER TABLE IF EXISTS ONLY public.registration_otps DROP CONSTRAINT IF EXISTS registration_otps_pkey;
ALTER TABLE IF EXISTS ONLY public.recipes DROP CONSTRAINT IF EXISTS recipes_pkey;
ALTER TABLE IF EXISTS ONLY public.printers DROP CONSTRAINT IF EXISTS printers_pmno_key;
ALTER TABLE IF EXISTS ONLY public.printers DROP CONSTRAINT IF EXISTS printers_pkey;
ALTER TABLE IF EXISTS ONLY public.printer_status_logs DROP CONSTRAINT IF EXISTS printer_status_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.printer_location_logs DROP CONSTRAINT IF EXISTS printer_location_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.printer_live_state DROP CONSTRAINT IF EXISTS printer_live_state_pkey;
ALTER TABLE IF EXISTS ONLY public.pm_pasted_log DROP CONSTRAINT IF EXISTS pm_pasted_log_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.parts_usage_log DROP CONSTRAINT IF EXISTS parts_usage_log_pkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_pkey;
ALTER TABLE IF EXISTS ONLY public.issues DROP CONSTRAINT IF EXISTS issues_issue_unique_id_key;
ALTER TABLE IF EXISTS ONLY public.issue_activity_log DROP CONSTRAINT IF EXISTS issue_activity_log_pkey;
ALTER TABLE IF EXISTS ONLY public.i_learn_steps DROP CONSTRAINT IF EXISTS i_learn_steps_pkey;
ALTER TABLE IF EXISTS ONLY public.i_learn_issues DROP CONSTRAINT IF EXISTS i_learn_issues_pkey;
ALTER TABLE IF EXISTS ONLY public.hp_printers DROP CONSTRAINT IF EXISTS hp_printers_tag_key;
ALTER TABLE IF EXISTS ONLY public.hp_printers DROP CONSTRAINT IF EXISTS hp_printers_pkey;
ALTER TABLE IF EXISTS ONLY public.health_checkups DROP CONSTRAINT IF EXISTS health_checkups_pkey;
ALTER TABLE IF EXISTS ONLY public.health_checkup_activity_log DROP CONSTRAINT IF EXISTS health_checkup_activity_log_pkey;
ALTER TABLE IF EXISTS ONLY public.cartridges DROP CONSTRAINT IF EXISTS cartridges_pkey;
ALTER TABLE IF EXISTS ONLY public.cartridges DROP CONSTRAINT IF EXISTS cartridges_model_key;
ALTER TABLE IF EXISTS ONLY public.cartridges DROP CONSTRAINT IF EXISTS cartridges_dn_unique;
ALTER TABLE IF EXISTS ONLY public.cartridge_usage_log DROP CONSTRAINT IF EXISTS cartridge_usage_log_pkey;
ALTER TABLE IF EXISTS ONLY public.backup_printers DROP CONSTRAINT IF EXISTS backup_printers_pmno_key;
ALTER TABLE IF EXISTS ONLY public.backup_printers DROP CONSTRAINT IF EXISTS backup_printers_pkey;
ALTER TABLE IF EXISTS ONLY public.app_support_terminals DROP CONSTRAINT IF EXISTS app_support_terminals_pkey;
ALTER TABLE IF EXISTS ONLY public.app_support_terminals DROP CONSTRAINT IF EXISTS app_support_terminals_code_key;
ALTER TABLE IF EXISTS ONLY public.app_support_terminal_history DROP CONSTRAINT IF EXISTS app_support_terminal_history_pkey;
ALTER TABLE IF EXISTS ONLY public.app_support_terminal_failed_devices DROP CONSTRAINT IF EXISTS app_support_terminal_failed_devices_pkey;
ALTER TABLE IF EXISTS ONLY public.app_support_terminal_deploy_history DROP CONSTRAINT IF EXISTS app_support_terminal_deploy_history_pkey;
ALTER TABLE IF EXISTS ONLY public.app_support_servers DROP CONSTRAINT IF EXISTS app_support_servers_pkey;
ALTER TABLE IF EXISTS ONLY public.app_support_servers DROP CONSTRAINT IF EXISTS app_support_servers_name_key;
ALTER TABLE IF EXISTS public.vlan ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_approvals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.spare_parts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.registration_otps ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.recipes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.printers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.printer_status_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.printer_location_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pm_pasted_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.parts_usage_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.issues ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.issue_activity_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.i_learn_steps ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.i_learn_issues ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hp_printers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.health_checkups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.health_checkup_activity_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cartridges ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cartridge_usage_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.backup_printers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_support_terminals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_support_terminal_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_support_terminal_failed_devices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_support_terminal_deploy_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.app_support_servers ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.vlan_id_seq;
DROP TABLE IF EXISTS public.vlan;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_approvals_id_seq;
DROP TABLE IF EXISTS public.user_approvals;
DROP SEQUENCE IF EXISTS public.spare_parts_id_seq;
DROP TABLE IF EXISTS public.spare_parts;
DROP SEQUENCE IF EXISTS public.registration_otps_id_seq;
DROP TABLE IF EXISTS public.registration_otps;
DROP SEQUENCE IF EXISTS public.recipes_id_seq;
DROP TABLE IF EXISTS public.recipes;
DROP SEQUENCE IF EXISTS public.printers_id_seq;
DROP TABLE IF EXISTS public.printers;
DROP SEQUENCE IF EXISTS public.printer_status_logs_id_seq;
DROP TABLE IF EXISTS public.printer_status_logs;
DROP SEQUENCE IF EXISTS public.printer_location_logs_id_seq;
DROP TABLE IF EXISTS public.printer_location_logs;
DROP TABLE IF EXISTS public.printer_live_state;
DROP SEQUENCE IF EXISTS public.pm_pasted_log_id_seq;
DROP TABLE IF EXISTS public.pm_pasted_log;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP SEQUENCE IF EXISTS public.parts_usage_log_id_seq;
DROP TABLE IF EXISTS public.parts_usage_log;
DROP SEQUENCE IF EXISTS public.issues_id_seq;
DROP TABLE IF EXISTS public.issues;
DROP SEQUENCE IF EXISTS public.issue_id_seq;
DROP SEQUENCE IF EXISTS public.issue_activity_log_id_seq;
DROP TABLE IF EXISTS public.issue_activity_log;
DROP SEQUENCE IF EXISTS public.i_learn_steps_id_seq;
DROP TABLE IF EXISTS public.i_learn_steps;
DROP SEQUENCE IF EXISTS public.i_learn_issues_id_seq;
DROP TABLE IF EXISTS public.i_learn_issues;
DROP SEQUENCE IF EXISTS public.hp_printers_id_seq;
DROP TABLE IF EXISTS public.hp_printers;
DROP SEQUENCE IF EXISTS public.health_checkups_id_seq;
DROP TABLE IF EXISTS public.health_checkups;
DROP SEQUENCE IF EXISTS public.health_checkup_activity_log_id_seq;
DROP TABLE IF EXISTS public.health_checkup_activity_log;
DROP SEQUENCE IF EXISTS public.cartridges_id_seq;
DROP TABLE IF EXISTS public.cartridges;
DROP SEQUENCE IF EXISTS public.cartridge_usage_log_id_seq;
DROP TABLE IF EXISTS public.cartridge_usage_log;
DROP SEQUENCE IF EXISTS public.backup_printers_id_seq;
DROP TABLE IF EXISTS public.backup_printers;
DROP SEQUENCE IF EXISTS public.app_support_terminals_id_seq;
DROP TABLE IF EXISTS public.app_support_terminals;
DROP SEQUENCE IF EXISTS public.app_support_terminal_history_id_seq;
DROP TABLE IF EXISTS public.app_support_terminal_history;
DROP SEQUENCE IF EXISTS public.app_support_terminal_failed_devices_id_seq;
DROP TABLE IF EXISTS public.app_support_terminal_failed_devices;
DROP SEQUENCE IF EXISTS public.app_support_terminal_deploy_history_id_seq;
DROP TABLE IF EXISTS public.app_support_terminal_deploy_history;
DROP SEQUENCE IF EXISTS public.app_support_servers_id_seq;
DROP TABLE IF EXISTS public.app_support_servers;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_support_servers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_support_servers (
    id integer NOT NULL,
    terminal_id integer,
    name character varying(100) NOT NULL,
    active_users integer DEFAULT 0,
    max_users integer DEFAULT 30,
    status character varying(20) DEFAULT 'unknown'::character varying,
    last_checked_at timestamp without time zone,
    last_error text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: app_support_servers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_support_servers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_support_servers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_support_servers_id_seq OWNED BY public.app_support_servers.id;


--
-- Name: app_support_terminal_deploy_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_support_terminal_deploy_history (
    id integer NOT NULL,
    pc_name character varying(100) NOT NULL,
    previous_terminals text[] DEFAULT ARRAY[]::text[],
    deployed_terminals text[] DEFAULT ARRAY[]::text[],
    deployed_by character varying(100),
    deploy_output text,
    rollback_output text,
    deployed_at timestamp without time zone DEFAULT now(),
    rolled_back_at timestamp without time zone
);


--
-- Name: app_support_terminal_deploy_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_support_terminal_deploy_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_support_terminal_deploy_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_support_terminal_deploy_history_id_seq OWNED BY public.app_support_terminal_deploy_history.id;


--
-- Name: app_support_terminal_failed_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_support_terminal_failed_devices (
    id integer NOT NULL,
    pc_name character varying(100) NOT NULL,
    action character varying(30) NOT NULL,
    terminals text[] DEFAULT ARRAY[]::text[],
    error text,
    failed_by character varying(100),
    failed_at timestamp without time zone DEFAULT now()
);


--
-- Name: app_support_terminal_failed_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_support_terminal_failed_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_support_terminal_failed_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_support_terminal_failed_devices_id_seq OWNED BY public.app_support_terminal_failed_devices.id;


--
-- Name: app_support_terminal_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_support_terminal_history (
    id integer NOT NULL,
    terminal_code character varying(30) NOT NULL,
    server_name character varying(100) NOT NULL,
    active_users integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'unknown'::character varying,
    recorded_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: app_support_terminal_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_support_terminal_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_support_terminal_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_support_terminal_history_id_seq OWNED BY public.app_support_terminal_history.id;


--
-- Name: app_support_terminals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_support_terminals (
    id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: app_support_terminals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.app_support_terminals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: app_support_terminals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.app_support_terminals_id_seq OWNED BY public.app_support_terminals.id;


--
-- Name: backup_printers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_printers (
    id integer NOT NULL,
    pmno character varying(20) NOT NULL,
    serial character varying(50) NOT NULL,
    make character varying(50) NOT NULL,
    dpi character varying(10) NOT NULL,
    plant_location character varying(50) DEFAULT 'B26'::character varying,
    storage_location text NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: backup_printers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.backup_printers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: backup_printers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.backup_printers_id_seq OWNED BY public.backup_printers.id;


--
-- Name: cartridge_usage_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cartridge_usage_log (
    id integer NOT NULL,
    dn character varying(50),
    model character varying(100),
    qty integer DEFAULT 1,
    wc character varying(30),
    ip character varying(20),
    used_by character varying(100),
    used_at timestamp without time zone DEFAULT now(),
    printer_location character varying(255),
    printer_tag character varying(50)
);


--
-- Name: cartridge_usage_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cartridge_usage_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartridge_usage_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cartridge_usage_log_id_seq OWNED BY public.cartridge_usage_log.id;


--
-- Name: cartridges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cartridges (
    id integer NOT NULL,
    model character varying(100) NOT NULL,
    dn character varying(50) NOT NULL,
    type character varying(20),
    compat text,
    stock integer DEFAULT 0,
    min integer DEFAULT 2,
    yield character varying(50),
    loc character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: cartridges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cartridges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cartridges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cartridges_id_seq OWNED BY public.cartridges.id;


--
-- Name: health_checkup_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.health_checkup_activity_log (
    id integer NOT NULL,
    pmno character varying(20) NOT NULL,
    engineer character varying(100),
    checked_at timestamp without time zone DEFAULT now()
);


--
-- Name: health_checkup_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.health_checkup_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: health_checkup_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.health_checkup_activity_log_id_seq OWNED BY public.health_checkup_activity_log.id;


--
-- Name: health_checkups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.health_checkups (
    id integer NOT NULL,
    pmno character varying(20),
    serial character varying(50),
    model character varying(50),
    make character varying(50),
    sapno character varying(50),
    mesno character varying(50),
    dpi character varying(10),
    firmware character varying(50),
    km character varying(50),
    loftware character varying(50),
    ip character varying(20),
    mac character varying(50),
    loc text,
    stage character varying(30),
    bay character varying(30),
    wc character varying(30),
    health character varying(10) DEFAULT 'ok'::character varying,
    issue_desc text,
    req_parts text,
    is_repeat boolean DEFAULT false,
    engineer character varying(100),
    checked_at timestamp without time zone DEFAULT now(),
    damaged_parts jsonb DEFAULT '[]'::jsonb
);


--
-- Name: health_checkups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.health_checkups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: health_checkups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.health_checkups_id_seq OWNED BY public.health_checkups.id;


--
-- Name: hp_printers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hp_printers (
    id integer NOT NULL,
    tag character varying(50) NOT NULL,
    model character varying(100) NOT NULL,
    ip character varying(20) NOT NULL,
    loc text,
    stage character varying(30),
    bay character varying(30),
    wc character varying(30),
    cartmodel character varying(100),
    black_pct integer DEFAULT 85,
    color_pct integer,
    online boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    plant_location character varying(50) DEFAULT 'B26'::character varying,
    error_status character varying(255),
    last_cartridge_sync timestamp without time zone
);


--
-- Name: hp_printers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hp_printers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hp_printers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hp_printers_id_seq OWNED BY public.hp_printers.id;


--
-- Name: i_learn_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.i_learn_issues (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(50) DEFAULT 'General'::character varying,
    keywords text,
    created_by character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: i_learn_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.i_learn_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: i_learn_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.i_learn_issues_id_seq OWNED BY public.i_learn_issues.id;


--
-- Name: i_learn_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.i_learn_steps (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    step_number integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    image_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: i_learn_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.i_learn_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: i_learn_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.i_learn_steps_id_seq OWNED BY public.i_learn_steps.id;


--
-- Name: issue_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_activity_log (
    id integer NOT NULL,
    issue_id integer NOT NULL,
    activity_type character varying(50) NOT NULL,
    old_severity character varying(20),
    new_severity character varying(20),
    reason text,
    action_taken text,
    severity_at_time character varying(20),
    assigned_to character varying(100),
    user_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: issue_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issue_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issue_activity_log_id_seq OWNED BY public.issue_activity_log.id;


--
-- Name: issue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issues (
    id integer NOT NULL,
    pmno character varying(20),
    serial character varying(50),
    model character varying(50),
    loc text,
    title character varying(200) NOT NULL,
    "desc" text NOT NULL,
    action text,
    severity character varying(20) DEFAULT 'Medium'::character varying,
    category character varying(50) DEFAULT 'Other'::character varying,
    status character varying(20) DEFAULT 'open'::character varying,
    reporter character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone DEFAULT (now() + '10 days'::interval),
    resolved_at timestamp without time zone,
    plant_location character varying(50) DEFAULT 'B26'::character varying,
    assigned_to character varying(100),
    severity_at_resolve character varying(20),
    action_taken text,
    status_changed_at timestamp without time zone DEFAULT now(),
    resolution_deadline timestamp without time zone,
    breach_status character varying(20) DEFAULT 'on-track'::character varying,
    last_activity_user character varying(100),
    sapno character varying(50),
    mesno character varying(50),
    issue_unique_id character varying(20) NOT NULL
);


--
-- Name: issues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.issues_id_seq OWNED BY public.issues.id;


--
-- Name: parts_usage_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_usage_log (
    id integer NOT NULL,
    code character varying(50),
    name character varying(100),
    qty integer DEFAULT 1,
    pmno character varying(20),
    serial character varying(50),
    wc character varying(30),
    used_by character varying(100),
    used_at timestamp without time zone DEFAULT now()
);


--
-- Name: parts_usage_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parts_usage_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parts_usage_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parts_usage_log_id_seq OWNED BY public.parts_usage_log.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    otp character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: pm_pasted_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_pasted_log (
    id integer NOT NULL,
    pmno character varying(20),
    serial character varying(50),
    model character varying(50),
    make character varying(50),
    dpi character varying(10),
    ip character varying(20),
    firmware character varying(50),
    sapno character varying(50),
    mesno character varying(50),
    loftware character varying(50),
    pmdate character varying(30),
    pasted_at character varying(50),
    stage character varying(30),
    bay character varying(30),
    wc character varying(30),
    loc text,
    engineer character varying(100),
    shift character varying(30),
    remarks text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: pm_pasted_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pm_pasted_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pm_pasted_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pm_pasted_log_id_seq OWNED BY public.pm_pasted_log.id;


--
-- Name: printer_live_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_live_state (
    pmno character varying(20) NOT NULL,
    serial character varying(50),
    ip character varying(20),
    online_status character varying(20) DEFAULT 'offline'::character varying,
    condition_status character varying(20) DEFAULT 'ready'::character varying,
    error_reason text,
    resolved_bay character varying(30),
    resolved_stage character varying(30),
    resolved_wc character varying(30),
    location_display text,
    updated_at timestamp without time zone DEFAULT now(),
    firmware_version character varying(100),
    printer_km character varying(100)
);


--
-- Name: printer_location_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_location_logs (
    id integer NOT NULL,
    pmno character varying(20) NOT NULL,
    serial character varying(50),
    old_wc character varying(30),
    old_stage character varying(30),
    old_bay character varying(30),
    old_loc text,
    old_plant_location character varying(50),
    new_wc character varying(30),
    new_stage character varying(30),
    new_bay character varying(30),
    new_loc text,
    new_plant_location character varying(50),
    source character varying(30) NOT NULL,
    changed_by character varying(100),
    changed_at timestamp without time zone DEFAULT now()
);


--
-- Name: printer_location_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.printer_location_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: printer_location_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.printer_location_logs_id_seq OWNED BY public.printer_location_logs.id;


--
-- Name: printer_status_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printer_status_logs (
    id integer NOT NULL,
    pmno character varying(20) NOT NULL,
    serial character varying(50),
    event_type character varying(40) NOT NULL,
    reason text,
    old_online_status character varying(20),
    new_online_status character varying(20),
    old_condition_status character varying(20),
    new_condition_status character varying(20),
    old_error_reason text,
    new_error_reason text,
    old_ip character varying(20),
    new_ip character varying(20),
    logged_at timestamp without time zone DEFAULT now()
);


--
-- Name: printer_status_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.printer_status_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: printer_status_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.printer_status_logs_id_seq OWNED BY public.printer_status_logs.id;


--
-- Name: printers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.printers (
    id integer NOT NULL,
    pmno character varying(20) NOT NULL,
    serial character varying(50),
    make character varying(50),
    model character varying(50),
    dpi character varying(10),
    ip character varying(20),
    wc character varying(30),
    loc text,
    stage character varying(30),
    bay character varying(30),
    status character varying(20) DEFAULT 'ready'::character varying,
    pmdate character varying(30),
    sapno character varying(50),
    mesno character varying(50),
    firmware character varying(50),
    loftware character varying(50),
    buyoff character varying(100),
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    plant_location character varying(50) DEFAULT 'B26'::character varying,
    maintenance_type character varying(20) DEFAULT 'quarterly'::character varying
);


--
-- Name: printers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.printers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: printers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.printers_id_seq OWNED BY public.printers.id;


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipes (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    make character varying(50),
    model character varying(50),
    dpi character varying(20),
    media character varying(50),
    width character varying(20),
    length character varying(20),
    top character varying(20),
    left_margin character varying(20),
    darkness character varying(20),
    speed character varying(30),
    loft character varying(100),
    verifier character varying(30),
    calibration character varying(50),
    contrast character varying(20),
    size character varying(50),
    "desc" text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    config_json jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- Name: registration_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registration_otps (
    id integer NOT NULL,
    email character varying(100) NOT NULL,
    otp character varying(6) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: registration_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registration_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registration_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registration_otps_id_seq OWNED BY public.registration_otps.id;


--
-- Name: spare_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spare_parts (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    compat character varying(50),
    avail integer DEFAULT 0,
    min integer DEFAULT 2,
    loc character varying(100),
    serial character varying(50),
    condition character varying(20) DEFAULT 'New'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    plant_location character varying(50) DEFAULT 'B26'::character varying,
    printer_model character varying(100),
    category character varying(100)
);


--
-- Name: spare_parts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.spare_parts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: spare_parts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.spare_parts_id_seq OWNED BY public.spare_parts.id;


--
-- Name: user_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_approvals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    requested_at timestamp without time zone DEFAULT now(),
    approved_by character varying(100),
    approved_at timestamp without time zone,
    status character varying(20) DEFAULT 'pending'::character varying
);


--
-- Name: user_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_approvals_id_seq OWNED BY public.user_approvals.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100),
    role character varying(20) DEFAULT 'user'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    support_type character varying(30) DEFAULT 'technical'::character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vlan (
    id integer NOT NULL,
    port character varying(30) NOT NULL,
    ip character varying(20) NOT NULL,
    mac character varying(30),
    sw character varying(50),
    loc text,
    stage character varying(30),
    bay character varying(30),
    wc character varying(30),
    created_at timestamp without time zone DEFAULT now(),
    plant_location character varying(50) DEFAULT 'B26'::character varying
);


--
-- Name: vlan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vlan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vlan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vlan_id_seq OWNED BY public.vlan.id;


--
-- Name: app_support_servers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_servers ALTER COLUMN id SET DEFAULT nextval('public.app_support_servers_id_seq'::regclass);


--
-- Name: app_support_terminal_deploy_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminal_deploy_history ALTER COLUMN id SET DEFAULT nextval('public.app_support_terminal_deploy_history_id_seq'::regclass);


--
-- Name: app_support_terminal_failed_devices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminal_failed_devices ALTER COLUMN id SET DEFAULT nextval('public.app_support_terminal_failed_devices_id_seq'::regclass);


--
-- Name: app_support_terminal_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminal_history ALTER COLUMN id SET DEFAULT nextval('public.app_support_terminal_history_id_seq'::regclass);


--
-- Name: app_support_terminals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminals ALTER COLUMN id SET DEFAULT nextval('public.app_support_terminals_id_seq'::regclass);


--
-- Name: backup_printers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_printers ALTER COLUMN id SET DEFAULT nextval('public.backup_printers_id_seq'::regclass);


--
-- Name: cartridge_usage_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartridge_usage_log ALTER COLUMN id SET DEFAULT nextval('public.cartridge_usage_log_id_seq'::regclass);


--
-- Name: cartridges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartridges ALTER COLUMN id SET DEFAULT nextval('public.cartridges_id_seq'::regclass);


--
-- Name: health_checkup_activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_checkup_activity_log ALTER COLUMN id SET DEFAULT nextval('public.health_checkup_activity_log_id_seq'::regclass);


--
-- Name: health_checkups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_checkups ALTER COLUMN id SET DEFAULT nextval('public.health_checkups_id_seq'::regclass);


--
-- Name: hp_printers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hp_printers ALTER COLUMN id SET DEFAULT nextval('public.hp_printers_id_seq'::regclass);


--
-- Name: i_learn_issues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.i_learn_issues ALTER COLUMN id SET DEFAULT nextval('public.i_learn_issues_id_seq'::regclass);


--
-- Name: i_learn_steps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.i_learn_steps ALTER COLUMN id SET DEFAULT nextval('public.i_learn_steps_id_seq'::regclass);


--
-- Name: issue_activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity_log ALTER COLUMN id SET DEFAULT nextval('public.issue_activity_log_id_seq'::regclass);


--
-- Name: issues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues ALTER COLUMN id SET DEFAULT nextval('public.issues_id_seq'::regclass);


--
-- Name: parts_usage_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_usage_log ALTER COLUMN id SET DEFAULT nextval('public.parts_usage_log_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: pm_pasted_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_pasted_log ALTER COLUMN id SET DEFAULT nextval('public.pm_pasted_log_id_seq'::regclass);


--
-- Name: printer_location_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_location_logs ALTER COLUMN id SET DEFAULT nextval('public.printer_location_logs_id_seq'::regclass);


--
-- Name: printer_status_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_status_logs ALTER COLUMN id SET DEFAULT nextval('public.printer_status_logs_id_seq'::regclass);


--
-- Name: printers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printers ALTER COLUMN id SET DEFAULT nextval('public.printers_id_seq'::regclass);


--
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- Name: registration_otps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_otps ALTER COLUMN id SET DEFAULT nextval('public.registration_otps_id_seq'::regclass);


--
-- Name: spare_parts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts ALTER COLUMN id SET DEFAULT nextval('public.spare_parts_id_seq'::regclass);


--
-- Name: user_approvals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_approvals ALTER COLUMN id SET DEFAULT nextval('public.user_approvals_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vlan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vlan ALTER COLUMN id SET DEFAULT nextval('public.vlan_id_seq'::regclass);


--
-- Data for Name: app_support_servers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_support_servers (id, terminal_id, name, active_users, max_users, status, last_checked_at, last_error, is_active, created_at, updated_at) FROM stdin;
42	2	INRJNM0RDSHVA28	0	30	unreachable	2026-05-04 07:54:54.517274	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.657369	2026-05-04 07:54:54.517274
44	2	INRJNM0RDSHVA30	0	30	unreachable	2026-05-04 07:55:11.165749	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.660943	2026-05-04 07:55:11.165749
46	3	INRJNM0RDSHM02	0	30	unreachable	2026-05-04 07:55:28.524824	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.665639	2026-05-04 07:55:28.524824
48	3	INRJNM0RDSHM04	0	30	unreachable	2026-05-04 07:55:45.717359	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.668464	2026-05-04 07:55:45.717359
50	3	INRJNM0RDSHM06	0	30	unreachable	2026-05-04 07:56:02.3696	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.671199	2026-05-04 07:56:02.3696
52	4	INRJNM0RDSHD02	0	30	unreachable	2026-05-04 07:56:19.113403	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.676112	2026-05-04 07:56:19.113403
54	5	INRJNM0RDSHE01	0	30	unreachable	2026-05-04 07:56:36.768181	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.681043	2026-05-04 07:56:36.768181
56	5	INRJNM0RDSHE03	0	30	unreachable	2026-05-04 07:56:53.754252	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.684261	2026-05-04 07:56:53.754252
58	5	INRJNM0RDSHE05	0	30	unreachable	2026-05-04 07:57:10.501906	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.688643	2026-05-04 07:57:10.501906
2	1	INRJNM0RDSHP02	0	30	unreachable	2026-05-04 08:19:45.284763	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.585866	2026-05-04 08:19:45.284763
22	1	INRJNM0RDSHP52	0	30	unreachable	2026-05-04 07:52:06.041584	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.621906	2026-05-04 07:52:06.041584
20	1	INRJNM0RDSHP20	0	30	unreachable	2026-05-04 08:22:14.793226	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.617724	2026-05-04 08:22:14.793226
3	1	INRJNM0RDSHP03	0	30	unreachable	2026-05-04 08:19:53.669196	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.587457	2026-05-04 08:19:53.669196
4	1	INRJNM0RDSHP04	0	30	unreachable	2026-05-04 08:20:01.845786	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.589261	2026-05-04 08:20:01.845786
8	1	INRJNM0RDSHP08	0	30	unreachable	2026-05-04 08:20:35.588104	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.596618	2026-05-04 08:20:35.588104
5	1	INRJNM0RDSHP05	0	30	unreachable	2026-05-04 08:20:10.057609	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.591056	2026-05-04 08:20:10.057609
9	1	INRJNM0RDSHP09	0	30	unreachable	2026-05-04 08:20:43.816433	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.598245	2026-05-04 08:20:43.816433
29	2	INRJNM0RDSHVA15	0	30	unreachable	2026-05-04 07:53:04.751244	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.63507	2026-05-04 07:53:04.751244
10	1	INRJNM0RDSHP10	0	30	unreachable	2026-05-04 08:20:52.046138	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.599649	2026-05-04 08:20:52.046138
12	1	INRJNM0RDSHP12	0	30	unreachable	2026-05-04 08:21:08.501097	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.602704	2026-05-04 08:21:08.501097
1	1	INRJNM0RDSHP01	0	30	unreachable	2026-05-04 08:19:36.70171	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.567661	2026-05-04 08:19:36.70171
18	1	INRJNM0RDSHP18	0	30	unreachable	2026-05-04 08:21:58.33939	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.613183	2026-05-04 08:21:58.33939
11	1	INRJNM0RDSHP11	0	30	unreachable	2026-05-04 08:21:00.269135	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.601177	2026-05-04 08:21:00.269135
13	1	INRJNM0RDSHP13	0	30	unreachable	2026-05-04 08:21:16.712122	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.604291	2026-05-04 08:21:16.712122
15	1	INRJNM0RDSHP15	0	30	unreachable	2026-05-04 08:21:33.420231	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.607567	2026-05-04 08:21:33.420231
21	1	INRJNM0RDSHP51	0	30	unreachable	2026-05-04 07:51:57.567825	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.620178	2026-05-04 07:51:57.567825
16	1	INRJNM0RDSHP16	0	30	unreachable	2026-05-04 08:21:41.733759	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.609285	2026-05-04 08:21:41.733759
7	1	INRJNM0RDSHP07	0	30	unreachable	2026-05-04 08:20:27.055954	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.594738	2026-05-04 08:20:27.055954
17	1	INRJNM0RDSHP17	0	30	unreachable	2026-05-04 08:21:50.132201	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.611718	2026-05-04 08:21:50.132201
23	1	INRJNM0RDSHP53	0	30	unreachable	2026-05-04 07:52:14.44739	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.623328	2026-05-04 07:52:14.44739
27	2	INRJNM0RDSHVA13	0	30	unreachable	2026-05-04 07:52:48.064543	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.632498	2026-05-04 07:52:48.064543
31	2	INRJNM0RDSHVA17	0	30	unreachable	2026-05-04 07:53:21.690899	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.638339	2026-05-04 07:53:21.690899
14	1	INRJNM0RDSHP14	0	30	unreachable	2026-05-04 08:21:25.07653	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.605841	2026-05-04 08:21:25.07653
25	2	INRJNM0RDSHVA11	0	30	unreachable	2026-05-04 07:52:31.272776	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.629473	2026-05-04 07:52:31.272776
33	2	INRJNM0RDSHVA19	0	30	unreachable	2026-05-04 07:53:38.767565	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.641221	2026-05-04 07:53:38.767565
35	2	INRJNM0RDSHVA21	0	30	unreachable	2026-05-04 07:53:55.361599	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.64655	2026-05-04 07:53:55.361599
19	1	INRJNM0RDSHP19	0	30	unreachable	2026-05-04 08:22:06.530387	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.614716	2026-05-04 08:22:06.530387
37	2	INRJNM0RDSHVA23	0	30	unreachable	2026-05-04 07:54:11.996091	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.649788	2026-05-04 07:54:11.996091
6	1	INRJNM0RDSHP06	0	30	unreachable	2026-05-04 08:20:18.281394	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.592946	2026-05-04 08:20:18.281394
41	2	INRJNM0RDSHVA27	0	30	unreachable	2026-05-04 07:54:46.169927	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.656055	2026-05-04 07:54:46.169927
39	2	INRJNM0RDSHVA25	0	30	unreachable	2026-05-04 07:54:29.499243	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.653138	2026-05-04 07:54:29.499243
30	2	INRJNM0RDSHVA16	0	30	unreachable	2026-05-04 07:53:13.048484	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.636856	2026-05-04 07:53:13.048484
32	2	INRJNM0RDSHVA18	0	30	unreachable	2026-05-04 07:53:30.270463	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.639774	2026-05-04 07:53:30.270463
34	2	INRJNM0RDSHVA20	0	30	unreachable	2026-05-04 07:53:47.055246	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.642893	2026-05-04 07:53:47.055246
36	2	INRJNM0RDSHVA22	0	30	unreachable	2026-05-04 07:54:03.662908	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.648155	2026-05-04 07:54:03.662908
38	2	INRJNM0RDSHVA24	0	30	unreachable	2026-05-04 07:54:20.804042	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.651529	2026-05-04 07:54:20.804042
40	2	INRJNM0RDSHVA26	0	30	unreachable	2026-05-04 07:54:37.794126	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.654676	2026-05-04 07:54:37.794126
43	2	INRJNM0RDSHVA29	0	30	unreachable	2026-05-04 07:55:02.856849	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.659383	2026-05-04 07:55:02.856849
45	3	INRJNM0RDSHM01	0	30	unreachable	2026-05-04 07:55:19.868097	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.664129	2026-05-04 07:55:19.868097
47	3	INRJNM0RDSHM03	0	30	unreachable	2026-05-04 07:55:37.282026	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.667122	2026-05-04 07:55:37.282026
49	3	INRJNM0RDSHM05	0	30	unreachable	2026-05-04 07:55:54.056341	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.669804	2026-05-04 07:55:54.056341
51	4	INRJNM0RDSHD01	0	30	unreachable	2026-05-04 07:56:10.705321	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.674464	2026-05-04 07:56:10.705321
53	4	INRJNM0RDSHD03	0	30	unreachable	2026-05-04 07:56:27.749945	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.677851	2026-05-04 07:56:27.749945
55	5	INRJNM0RDSHE02	0	30	unreachable	2026-05-04 07:56:45.401051	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.682545	2026-05-04 07:56:45.401051
57	5	INRJNM0RDSHE04	0	30	unreachable	2026-05-04 07:57:02.105978	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.687049	2026-05-04 07:57:02.105978
59	5	INRJNM0RDSHE06	0	30	unreachable	2026-05-04 07:57:18.920276	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.690012	2026-05-04 07:57:18.920276
24	1	INRJNM0RDSHP54	0	30	unreachable	2026-05-04 07:52:22.832722	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.62645	2026-05-04 07:52:22.832722
26	2	INRJNM0RDSHVA12	0	30	unreachable	2026-05-04 07:52:39.660309	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.631044	2026-05-04 07:52:39.660309
28	2	INRJNM0RDSHVA14	0	30	unreachable	2026-05-04 07:52:56.3953	Error 0x000006BA enumerating sessionnames\r\nError [1722]:The RPC server is unavailable.	t	2026-05-03 22:43:44.633743	2026-05-04 07:52:56.3953
\.


--
-- Data for Name: app_support_terminal_deploy_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_support_terminal_deploy_history (id, pc_name, previous_terminals, deployed_terminals, deployed_by, deploy_output, rollback_output, deployed_at, rolled_back_at) FROM stdin;
\.


--
-- Data for Name: app_support_terminal_failed_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_support_terminal_failed_devices (id, pc_name, action, terminals, error, failed_by, failed_at) FROM stdin;
\.


--
-- Data for Name: app_support_terminal_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_support_terminal_history (id, terminal_code, server_name, active_users, status, recorded_at, created_at) FROM stdin;
1	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 06:14:55.905272	2026-05-04 06:14:55.905272
2	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 06:15:04.372363	2026-05-04 06:15:04.372363
3	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 06:15:12.754719	2026-05-04 06:15:12.754719
4	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 06:15:21.101413	2026-05-04 06:15:21.101413
5	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 06:15:29.435776	2026-05-04 06:15:29.435776
6	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 06:15:37.774717	2026-05-04 06:15:37.774717
7	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 06:15:46.339901	2026-05-04 06:15:46.339901
8	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 06:15:54.980397	2026-05-04 06:15:54.980397
9	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 06:16:03.466105	2026-05-04 06:16:03.466105
10	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 06:16:11.860285	2026-05-04 06:16:11.860285
11	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 06:16:20.215094	2026-05-04 06:16:20.215094
12	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 06:16:28.547284	2026-05-04 06:16:28.547284
13	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 06:16:36.878353	2026-05-04 06:16:36.878353
14	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 06:16:45.257984	2026-05-04 06:16:45.257984
15	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 06:16:53.791971	2026-05-04 06:16:53.791971
16	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 06:17:02.887893	2026-05-04 06:17:02.887893
17	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 06:17:11.249977	2026-05-04 06:17:11.249977
18	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 06:17:19.590246	2026-05-04 06:17:19.590246
19	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 06:17:27.917552	2026-05-04 06:17:27.917552
20	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 06:17:36.364196	2026-05-04 06:17:36.364196
21	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 06:17:45.617177	2026-05-04 06:17:45.617177
22	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 06:17:54.380429	2026-05-04 06:17:54.380429
23	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 06:18:03.888092	2026-05-04 06:18:03.888092
24	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 06:18:14.232839	2026-05-04 06:18:14.232839
25	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 06:18:23.239592	2026-05-04 06:18:23.239592
26	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 06:18:31.566898	2026-05-04 06:18:31.566898
27	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 06:18:40.015204	2026-05-04 06:18:40.015204
28	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 06:18:49.145514	2026-05-04 06:18:49.145514
29	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 06:18:58.298682	2026-05-04 06:18:58.298682
30	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 06:19:07.755216	2026-05-04 06:19:07.755216
31	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 06:19:16.229082	2026-05-04 06:19:16.229082
32	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 06:19:24.601463	2026-05-04 06:19:24.601463
33	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 06:19:32.960346	2026-05-04 06:19:32.960346
34	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 06:19:44.299775	2026-05-04 06:19:44.299775
35	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 06:19:56.261716	2026-05-04 06:19:56.261716
36	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 06:20:06.175842	2026-05-04 06:20:06.175842
37	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 06:20:16.530011	2026-05-04 06:20:16.530011
38	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 06:20:25.611299	2026-05-04 06:20:25.611299
39	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 06:20:33.985144	2026-05-04 06:20:33.985144
40	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 06:20:42.751045	2026-05-04 06:20:42.751045
41	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 06:20:51.663681	2026-05-04 06:20:51.663681
42	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 06:21:01.392921	2026-05-04 06:21:01.392921
43	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 06:21:11.707149	2026-05-04 06:21:11.707149
44	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 06:21:21.298926	2026-05-04 06:21:21.298926
45	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 06:21:29.8496	2026-05-04 06:21:29.8496
46	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 06:21:38.756579	2026-05-04 06:21:38.756579
47	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 06:21:47.353968	2026-05-04 06:21:47.353968
48	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 06:21:55.934103	2026-05-04 06:21:55.934103
49	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 06:22:04.937967	2026-05-04 06:22:04.937967
50	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 06:22:13.473136	2026-05-04 06:22:13.473136
51	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 06:22:21.875221	2026-05-04 06:22:21.875221
52	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 06:22:30.327138	2026-05-04 06:22:30.327138
53	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 06:22:38.891946	2026-05-04 06:22:38.891946
54	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 06:22:47.970372	2026-05-04 06:22:47.970372
55	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 06:22:56.418959	2026-05-04 06:22:56.418959
56	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 06:23:05.074071	2026-05-04 06:23:05.074071
57	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 06:23:13.352926	2026-05-04 06:23:13.352926
58	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 06:23:21.666538	2026-05-04 06:23:21.666538
59	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 06:23:29.975869	2026-05-04 06:23:29.975869
60	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 06:23:56.538953	2026-05-04 06:23:56.538953
61	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 06:24:04.971741	2026-05-04 06:24:04.971741
62	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 06:24:13.29735	2026-05-04 06:24:13.29735
63	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 06:24:21.626669	2026-05-04 06:24:21.626669
64	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 06:24:29.932249	2026-05-04 06:24:29.932249
65	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 06:24:38.245213	2026-05-04 06:24:38.245213
66	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 06:24:46.724873	2026-05-04 06:24:46.724873
67	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 06:24:55.36801	2026-05-04 06:24:55.36801
68	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 06:25:03.947825	2026-05-04 06:25:03.947825
69	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 06:25:12.485143	2026-05-04 06:25:12.485143
70	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 06:25:20.837903	2026-05-04 06:25:20.837903
71	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 06:25:29.15676	2026-05-04 06:25:29.15676
72	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 06:25:37.613578	2026-05-04 06:25:37.613578
73	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 06:25:46.088852	2026-05-04 06:25:46.088852
74	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 06:25:54.710288	2026-05-04 06:25:54.710288
75	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 06:26:03.191308	2026-05-04 06:26:03.191308
76	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 06:26:11.666154	2026-05-04 06:26:11.666154
77	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 06:26:20.062958	2026-05-04 06:26:20.062958
78	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 06:26:28.488158	2026-05-04 06:26:28.488158
79	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 06:26:36.862354	2026-05-04 06:26:36.862354
80	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 06:26:45.374144	2026-05-04 06:26:45.374144
81	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 06:26:55.129611	2026-05-04 06:26:55.129611
82	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 06:27:04.756885	2026-05-04 06:27:04.756885
83	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 06:27:13.316118	2026-05-04 06:27:13.316118
84	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 06:27:21.901505	2026-05-04 06:27:21.901505
85	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 06:27:30.210001	2026-05-04 06:27:30.210001
86	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 06:27:38.616277	2026-05-04 06:27:38.616277
87	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 06:27:47.715991	2026-05-04 06:27:47.715991
88	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 06:27:56.148473	2026-05-04 06:27:56.148473
89	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 06:28:04.529259	2026-05-04 06:28:04.529259
90	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 06:28:12.821102	2026-05-04 06:28:12.821102
91	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 06:28:21.125479	2026-05-04 06:28:21.125479
92	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 06:28:29.528918	2026-05-04 06:28:29.528918
93	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 06:28:37.990739	2026-05-04 06:28:37.990739
94	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 06:28:46.482262	2026-05-04 06:28:46.482262
95	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 06:28:54.85414	2026-05-04 06:28:54.85414
96	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 06:29:03.531496	2026-05-04 06:29:03.531496
97	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 06:29:12.102705	2026-05-04 06:29:12.102705
98	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 06:29:20.514168	2026-05-04 06:29:20.514168
99	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 06:29:28.866982	2026-05-04 06:29:28.866982
100	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 06:29:37.159524	2026-05-04 06:29:37.159524
101	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 06:29:45.858274	2026-05-04 06:29:45.858274
102	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 06:29:54.62455	2026-05-04 06:29:54.62455
103	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 06:30:03.116243	2026-05-04 06:30:03.116243
104	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 06:30:11.502058	2026-05-04 06:30:11.502058
105	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 06:30:19.827894	2026-05-04 06:30:19.827894
106	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 06:30:28.232856	2026-05-04 06:30:28.232856
107	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 06:30:36.666572	2026-05-04 06:30:36.666572
108	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 06:30:45.317342	2026-05-04 06:30:45.317342
109	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 06:30:55.043231	2026-05-04 06:30:55.043231
110	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 06:31:04.116674	2026-05-04 06:31:04.116674
111	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 06:31:12.632864	2026-05-04 06:31:12.632864
112	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 06:31:20.97697	2026-05-04 06:31:20.97697
113	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 06:31:29.298068	2026-05-04 06:31:29.298068
114	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 06:31:37.636142	2026-05-04 06:31:37.636142
115	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 06:31:55.599583	2026-05-04 06:31:55.599583
116	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 06:32:04.31683	2026-05-04 06:32:04.31683
117	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 06:32:13.133045	2026-05-04 06:32:13.133045
118	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 06:32:30.76396	2026-05-04 06:32:30.76396
119	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 06:32:39.584772	2026-05-04 06:32:39.584772
120	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 06:32:49.214213	2026-05-04 06:32:49.214213
121	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 06:32:58.436595	2026-05-04 06:32:58.436595
122	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 06:33:07.081515	2026-05-04 06:33:07.081515
123	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 06:33:15.451881	2026-05-04 06:33:15.451881
124	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 06:33:23.935184	2026-05-04 06:33:23.935184
125	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 06:33:33.026131	2026-05-04 06:33:33.026131
126	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 06:33:42.841454	2026-05-04 06:33:42.841454
127	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 06:33:53.098437	2026-05-04 06:33:53.098437
128	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 06:34:01.919308	2026-05-04 06:34:01.919308
129	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 06:34:10.292804	2026-05-04 06:34:10.292804
130	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 06:34:18.787945	2026-05-04 06:34:18.787945
131	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 06:34:27.41693	2026-05-04 06:34:27.41693
132	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 06:34:36.005283	2026-05-04 06:34:36.005283
133	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 06:34:44.383714	2026-05-04 06:34:44.383714
134	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 06:34:53.054791	2026-05-04 06:34:53.054791
135	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 06:35:01.396191	2026-05-04 06:35:01.396191
136	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 06:35:09.760438	2026-05-04 06:35:09.760438
137	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 06:35:18.122772	2026-05-04 06:35:18.122772
138	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 06:35:26.828991	2026-05-04 06:35:26.828991
139	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 06:35:35.589059	2026-05-04 06:35:35.589059
140	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 06:35:44.355782	2026-05-04 06:35:44.355782
141	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 06:35:53.547638	2026-05-04 06:35:53.547638
142	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 06:36:01.963485	2026-05-04 06:36:01.963485
143	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 06:36:10.339395	2026-05-04 06:36:10.339395
144	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 06:36:18.755013	2026-05-04 06:36:18.755013
145	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 06:36:27.463628	2026-05-04 06:36:27.463628
146	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 06:36:36.090625	2026-05-04 06:36:36.090625
147	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 06:36:45.274477	2026-05-04 06:36:45.274477
148	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 06:36:54.015026	2026-05-04 06:36:54.015026
149	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 06:37:02.432361	2026-05-04 06:37:02.432361
150	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 06:37:10.86926	2026-05-04 06:37:10.86926
151	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 06:37:19.341313	2026-05-04 06:37:19.341313
152	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 06:37:28.047225	2026-05-04 06:37:28.047225
153	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 06:37:36.83398	2026-05-04 06:37:36.83398
154	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 06:37:46.232065	2026-05-04 06:37:46.232065
155	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 06:37:55.863821	2026-05-04 06:37:55.863821
156	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 06:38:04.262519	2026-05-04 06:38:04.262519
157	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 06:38:12.733569	2026-05-04 06:38:12.733569
158	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 06:38:21.163173	2026-05-04 06:38:21.163173
159	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 06:38:29.730167	2026-05-04 06:38:29.730167
160	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 06:38:38.598228	2026-05-04 06:38:38.598228
161	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 06:38:47.528915	2026-05-04 06:38:47.528915
162	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 06:38:57.24276	2026-05-04 06:38:57.24276
163	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 06:39:05.749179	2026-05-04 06:39:05.749179
164	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 06:39:14.167817	2026-05-04 06:39:14.167817
165	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 06:39:22.600156	2026-05-04 06:39:22.600156
166	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 06:39:31.836417	2026-05-04 06:39:31.836417
167	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 06:39:40.665484	2026-05-04 06:39:40.665484
168	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 06:39:52.620148	2026-05-04 06:39:52.620148
169	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 06:40:01.934481	2026-05-04 06:40:01.934481
170	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 06:40:10.468377	2026-05-04 06:40:10.468377
171	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 06:40:18.892763	2026-05-04 06:40:18.892763
172	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 06:40:27.853094	2026-05-04 06:40:27.853094
173	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 06:40:36.407109	2026-05-04 06:40:36.407109
174	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 06:40:45.084984	2026-05-04 06:40:45.084984
175	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 06:41:00.333157	2026-05-04 06:41:00.333157
176	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 06:41:09.300323	2026-05-04 06:41:09.300323
177	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 06:41:18.078496	2026-05-04 06:41:18.078496
178	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 06:41:26.928904	2026-05-04 06:41:26.928904
179	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 06:41:35.296737	2026-05-04 06:41:35.296737
180	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 06:41:43.682303	2026-05-04 06:41:43.682303
181	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 06:41:52.067729	2026-05-04 06:41:52.067729
182	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 06:42:00.597558	2026-05-04 06:42:00.597558
183	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 06:42:09.279567	2026-05-04 06:42:09.279567
184	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 06:42:17.817009	2026-05-04 06:42:17.817009
185	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 06:42:26.181548	2026-05-04 06:42:26.181548
186	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 06:42:34.480443	2026-05-04 06:42:34.480443
187	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 06:42:42.791215	2026-05-04 06:42:42.791215
188	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 06:42:51.337688	2026-05-04 06:42:51.337688
189	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 06:43:00.020752	2026-05-04 06:43:00.020752
190	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 06:43:08.755826	2026-05-04 06:43:08.755826
191	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 06:43:17.721959	2026-05-04 06:43:17.721959
192	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 06:43:26.250803	2026-05-04 06:43:26.250803
193	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 06:43:34.605695	2026-05-04 06:43:34.605695
194	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 06:43:42.938268	2026-05-04 06:43:42.938268
195	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 06:43:51.376369	2026-05-04 06:43:51.376369
196	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 06:44:00.288296	2026-05-04 06:44:00.288296
197	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 06:44:08.734996	2026-05-04 06:44:08.734996
198	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 06:44:17.401402	2026-05-04 06:44:17.401402
199	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 06:44:25.893787	2026-05-04 06:44:25.893787
200	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 06:44:34.19239	2026-05-04 06:44:34.19239
201	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 06:44:42.586485	2026-05-04 06:44:42.586485
202	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 06:44:51.214666	2026-05-04 06:44:51.214666
203	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 06:45:00.115655	2026-05-04 06:45:00.115655
204	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 06:45:09.484918	2026-05-04 06:45:09.484918
205	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 06:45:18.12787	2026-05-04 06:45:18.12787
206	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 06:45:26.647154	2026-05-04 06:45:26.647154
207	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 06:45:35.107026	2026-05-04 06:45:35.107026
208	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 06:45:43.496866	2026-05-04 06:45:43.496866
209	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 06:45:51.870142	2026-05-04 06:45:51.870142
210	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 06:46:00.42662	2026-05-04 06:46:00.42662
211	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 06:46:09.079227	2026-05-04 06:46:09.079227
212	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 06:46:17.491636	2026-05-04 06:46:17.491636
213	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 06:46:25.909884	2026-05-04 06:46:25.909884
214	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 06:46:34.303271	2026-05-04 06:46:34.303271
215	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 06:46:42.62461	2026-05-04 06:46:42.62461
216	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 06:46:51.297333	2026-05-04 06:46:51.297333
217	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 06:47:00.003407	2026-05-04 06:47:00.003407
218	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 06:47:08.668911	2026-05-04 06:47:08.668911
219	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 06:47:17.30351	2026-05-04 06:47:17.30351
220	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 06:47:25.674117	2026-05-04 06:47:25.674117
221	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 06:47:34.019652	2026-05-04 06:47:34.019652
222	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 06:47:42.344563	2026-05-04 06:47:42.344563
223	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 06:47:50.704863	2026-05-04 06:47:50.704863
224	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 06:47:59.241826	2026-05-04 06:47:59.241826
225	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 06:48:08.010636	2026-05-04 06:48:08.010636
226	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 06:48:16.541773	2026-05-04 06:48:16.541773
227	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 06:48:24.84743	2026-05-04 06:48:24.84743
228	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 06:48:33.329067	2026-05-04 06:48:33.329067
229	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 06:48:41.764513	2026-05-04 06:48:41.764513
230	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 06:48:50.071339	2026-05-04 06:48:50.071339
231	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 06:48:58.468724	2026-05-04 06:48:58.468724
232	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 06:49:06.817789	2026-05-04 06:49:06.817789
233	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 06:49:15.230164	2026-05-04 06:49:15.230164
234	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 06:50:23.670145	2026-05-04 06:50:23.670145
235	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 06:50:31.977224	2026-05-04 06:50:31.977224
236	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 06:50:40.25895	2026-05-04 06:50:40.25895
237	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 06:50:48.58779	2026-05-04 06:50:48.58779
238	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 06:50:56.975058	2026-05-04 06:50:56.975058
239	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 06:51:05.509028	2026-05-04 06:51:05.509028
240	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 06:51:13.870466	2026-05-04 06:51:13.870466
241	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 06:51:22.223571	2026-05-04 06:51:22.223571
242	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 06:51:30.538532	2026-05-04 06:51:30.538532
243	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 06:51:38.929681	2026-05-04 06:51:38.929681
244	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 06:51:47.26144	2026-05-04 06:51:47.26144
245	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 06:51:55.667948	2026-05-04 06:51:55.667948
246	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 06:52:04.224097	2026-05-04 06:52:04.224097
247	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 06:52:12.750498	2026-05-04 06:52:12.750498
248	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 06:52:21.105073	2026-05-04 06:52:21.105073
249	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 06:52:29.47866	2026-05-04 06:52:29.47866
250	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 06:52:37.772555	2026-05-04 06:52:37.772555
251	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 06:52:46.075792	2026-05-04 06:52:46.075792
252	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 06:52:54.623678	2026-05-04 06:52:54.623678
253	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 06:53:03.057711	2026-05-04 06:53:03.057711
254	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 06:53:11.624601	2026-05-04 06:53:11.624601
255	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 06:53:19.957094	2026-05-04 06:53:19.957094
256	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 06:53:28.36746	2026-05-04 06:53:28.36746
257	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 06:53:36.695205	2026-05-04 06:53:36.695205
258	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 06:53:45.007129	2026-05-04 06:53:45.007129
259	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 06:53:53.544301	2026-05-04 06:53:53.544301
260	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 06:54:02.257837	2026-05-04 06:54:02.257837
261	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 06:54:10.614514	2026-05-04 06:54:10.614514
262	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 06:54:18.997615	2026-05-04 06:54:18.997615
263	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 06:54:27.31536	2026-05-04 06:54:27.31536
264	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 06:54:35.665632	2026-05-04 06:54:35.665632
265	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 06:54:43.959356	2026-05-04 06:54:43.959356
266	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 06:54:52.508038	2026-05-04 06:54:52.508038
267	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 06:55:01.294717	2026-05-04 06:55:01.294717
268	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 06:55:10.28653	2026-05-04 06:55:10.28653
269	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 06:55:18.950528	2026-05-04 06:55:18.950528
270	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 06:55:27.303865	2026-05-04 06:55:27.303865
271	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 06:55:35.772295	2026-05-04 06:55:35.772295
272	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 06:55:44.07187	2026-05-04 06:55:44.07187
273	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 06:55:52.9024	2026-05-04 06:55:52.9024
274	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 06:56:02.680719	2026-05-04 06:56:02.680719
275	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 06:56:11.361168	2026-05-04 06:56:11.361168
276	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 06:56:20.623819	2026-05-04 06:56:20.623819
277	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 06:56:29.815712	2026-05-04 06:56:29.815712
278	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 06:56:38.378531	2026-05-04 06:56:38.378531
279	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 06:56:46.930806	2026-05-04 06:56:46.930806
280	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 06:56:55.93928	2026-05-04 06:56:55.93928
281	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 06:57:05.1996	2026-05-04 06:57:05.1996
282	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 06:57:14.800595	2026-05-04 06:57:14.800595
283	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 06:57:23.531099	2026-05-04 06:57:23.531099
284	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 06:57:31.883469	2026-05-04 06:57:31.883469
285	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 06:57:40.333435	2026-05-04 06:57:40.333435
286	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 06:57:48.72526	2026-05-04 06:57:48.72526
287	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 06:57:57.277504	2026-05-04 06:57:57.277504
288	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 06:58:06.098511	2026-05-04 06:58:06.098511
289	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 06:58:14.85789	2026-05-04 06:58:14.85789
290	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 06:58:23.627031	2026-05-04 06:58:23.627031
291	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 06:58:32.074482	2026-05-04 06:58:32.074482
292	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 06:58:40.481724	2026-05-04 06:58:40.481724
293	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 06:59:26.165885	2026-05-04 06:59:26.165885
294	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 06:59:34.595319	2026-05-04 06:59:34.595319
295	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 06:59:42.951505	2026-05-04 06:59:42.951505
296	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 06:59:51.476157	2026-05-04 06:59:51.476157
297	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:00:00.900288	2026-05-04 07:00:00.900288
298	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:00:10.682991	2026-05-04 07:00:10.682991
299	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:00:19.684352	2026-05-04 07:00:19.684352
300	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:00:29.127655	2026-05-04 07:00:29.127655
301	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:00:37.538625	2026-05-04 07:00:37.538625
302	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:00:45.876713	2026-05-04 07:00:45.876713
303	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 07:00:55.017645	2026-05-04 07:00:55.017645
304	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 07:01:04.557673	2026-05-04 07:01:04.557673
305	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 07:01:13.818528	2026-05-04 07:01:13.818528
306	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 07:01:23.128248	2026-05-04 07:01:23.128248
307	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 07:01:31.931438	2026-05-04 07:01:31.931438
308	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 07:01:40.317327	2026-05-04 07:01:40.317327
309	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 07:01:48.697514	2026-05-04 07:01:48.697514
310	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 07:01:57.762456	2026-05-04 07:01:57.762456
311	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 07:02:07.239407	2026-05-04 07:02:07.239407
312	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 07:02:16.33196	2026-05-04 07:02:16.33196
313	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 07:02:29.609883	2026-05-04 07:02:29.609883
314	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 07:02:38.072968	2026-05-04 07:02:38.072968
315	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 07:02:46.557603	2026-05-04 07:02:46.557603
316	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 07:02:55.515023	2026-05-04 07:02:55.515023
317	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 07:03:06.362767	2026-05-04 07:03:06.362767
318	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 07:03:15.129126	2026-05-04 07:03:15.129126
319	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 07:03:23.968338	2026-05-04 07:03:23.968338
320	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 07:03:32.763589	2026-05-04 07:03:32.763589
321	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 07:03:41.162082	2026-05-04 07:03:41.162082
322	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 07:03:49.616551	2026-05-04 07:03:49.616551
323	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 07:03:58.444809	2026-05-04 07:03:58.444809
324	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 07:04:07.109726	2026-05-04 07:04:07.109726
325	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 07:04:15.761125	2026-05-04 07:04:15.761125
326	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 07:04:24.167885	2026-05-04 07:04:24.167885
327	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 07:04:32.878647	2026-05-04 07:04:32.878647
328	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 07:04:41.26656	2026-05-04 07:04:41.26656
329	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 07:04:49.688976	2026-05-04 07:04:49.688976
330	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 07:04:58.286966	2026-05-04 07:04:58.286966
331	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 07:05:07.445112	2026-05-04 07:05:07.445112
332	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 07:05:16.321215	2026-05-04 07:05:16.321215
333	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 07:05:24.772546	2026-05-04 07:05:24.772546
334	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 07:05:33.103304	2026-05-04 07:05:33.103304
335	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 07:05:41.514938	2026-05-04 07:05:41.514938
336	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 07:05:49.986981	2026-05-04 07:05:49.986981
337	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 07:05:58.460174	2026-05-04 07:05:58.460174
338	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 07:06:07.090886	2026-05-04 07:06:07.090886
339	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 07:06:16.060288	2026-05-04 07:06:16.060288
340	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 07:06:26.602389	2026-05-04 07:06:26.602389
341	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 07:06:35.070515	2026-05-04 07:06:35.070515
342	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 07:06:43.606035	2026-05-04 07:06:43.606035
343	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 07:06:52.299612	2026-05-04 07:06:52.299612
344	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 07:07:02.898304	2026-05-04 07:07:02.898304
345	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 07:07:12.706384	2026-05-04 07:07:12.706384
346	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 07:07:23.991566	2026-05-04 07:07:23.991566
347	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 07:07:34.537815	2026-05-04 07:07:34.537815
348	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 07:07:43.380958	2026-05-04 07:07:43.380958
349	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 07:07:52.143971	2026-05-04 07:07:52.143971
350	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 07:08:02.235576	2026-05-04 07:08:02.235576
351	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 07:08:12.935188	2026-05-04 07:08:12.935188
352	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:08:27.970968	2026-05-04 07:08:27.970968
353	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:08:37.589026	2026-05-04 07:08:37.589026
354	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:08:46.35483	2026-05-04 07:08:46.35483
355	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:08:55.543919	2026-05-04 07:08:55.543919
356	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:09:04.340595	2026-05-04 07:09:04.340595
357	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:09:13.066224	2026-05-04 07:09:13.066224
358	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:09:22.562938	2026-05-04 07:09:22.562938
359	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:09:31.255358	2026-05-04 07:09:31.255358
360	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:09:39.844005	2026-05-04 07:09:39.844005
361	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:09:48.902057	2026-05-04 07:09:48.902057
362	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 07:10:01.108924	2026-05-04 07:10:01.108924
363	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 07:10:10.123111	2026-05-04 07:10:10.123111
364	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 07:10:19.971239	2026-05-04 07:10:19.971239
365	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 07:10:31.590959	2026-05-04 07:10:31.590959
366	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 07:10:40.734509	2026-05-04 07:10:40.734509
367	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 07:10:49.300823	2026-05-04 07:10:49.300823
368	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 07:10:59.284064	2026-05-04 07:10:59.284064
369	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 07:11:08.650978	2026-05-04 07:11:08.650978
370	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 07:11:17.859411	2026-05-04 07:11:17.859411
371	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 07:11:28.048387	2026-05-04 07:11:28.048387
372	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 07:11:37.740073	2026-05-04 07:11:37.740073
373	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 07:11:46.511382	2026-05-04 07:11:46.511382
374	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 07:11:56.451225	2026-05-04 07:11:56.451225
375	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 07:12:06.297995	2026-05-04 07:12:06.297995
376	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 07:12:16.549987	2026-05-04 07:12:16.549987
377	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 07:12:28.028854	2026-05-04 07:12:28.028854
378	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 07:12:36.545777	2026-05-04 07:12:36.545777
379	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 07:12:44.948062	2026-05-04 07:12:44.948062
380	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 07:12:53.43198	2026-05-04 07:12:53.43198
381	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 07:13:02.425919	2026-05-04 07:13:02.425919
382	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 07:13:11.288113	2026-05-04 07:13:11.288113
383	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 07:13:20.581111	2026-05-04 07:13:20.581111
384	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 07:13:29.034381	2026-05-04 07:13:29.034381
385	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 07:13:37.410463	2026-05-04 07:13:37.410463
386	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 07:13:45.770675	2026-05-04 07:13:45.770675
387	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 07:13:55.642241	2026-05-04 07:13:55.642241
388	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 07:14:04.773039	2026-05-04 07:14:04.773039
389	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 07:14:13.293815	2026-05-04 07:14:13.293815
390	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 07:14:22.352031	2026-05-04 07:14:22.352031
391	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 07:14:30.719409	2026-05-04 07:14:30.719409
392	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 07:14:39.210052	2026-05-04 07:14:39.210052
393	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 07:14:47.661383	2026-05-04 07:14:47.661383
394	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 07:14:56.28971	2026-05-04 07:14:56.28971
395	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 07:15:04.797114	2026-05-04 07:15:04.797114
396	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 07:15:13.378957	2026-05-04 07:15:13.378957
397	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 07:15:22.989866	2026-05-04 07:15:22.989866
398	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 07:15:31.369334	2026-05-04 07:15:31.369334
399	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 07:15:39.796004	2026-05-04 07:15:39.796004
400	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 07:15:48.182682	2026-05-04 07:15:48.182682
401	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 07:15:56.647826	2026-05-04 07:15:56.647826
402	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 07:16:05.238359	2026-05-04 07:16:05.238359
403	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 07:16:14.002911	2026-05-04 07:16:14.002911
404	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 07:16:22.401026	2026-05-04 07:16:22.401026
405	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 07:16:30.760786	2026-05-04 07:16:30.760786
406	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 07:16:39.207796	2026-05-04 07:16:39.207796
407	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 07:16:47.619777	2026-05-04 07:16:47.619777
408	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 07:16:58.434014	2026-05-04 07:16:58.434014
409	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 07:17:08.071647	2026-05-04 07:17:08.071647
410	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 07:17:17.236629	2026-05-04 07:17:17.236629
411	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:18:24.626938	2026-05-04 07:18:24.626938
412	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:18:32.974833	2026-05-04 07:18:32.974833
413	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:18:41.383386	2026-05-04 07:18:41.383386
414	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:18:49.784713	2026-05-04 07:18:49.784713
415	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:18:58.351931	2026-05-04 07:18:58.351931
416	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:19:07.5474	2026-05-04 07:19:07.5474
417	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:19:15.997637	2026-05-04 07:19:15.997637
418	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:19:26.086984	2026-05-04 07:19:26.086984
419	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:19:34.527374	2026-05-04 07:19:34.527374
420	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:19:42.921286	2026-05-04 07:19:42.921286
421	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 07:19:51.491133	2026-05-04 07:19:51.491133
422	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 07:20:00.921219	2026-05-04 07:20:00.921219
423	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 07:20:09.921699	2026-05-04 07:20:09.921699
424	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 07:20:18.590349	2026-05-04 07:20:18.590349
425	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 07:20:27.018801	2026-05-04 07:20:27.018801
426	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 07:20:35.372102	2026-05-04 07:20:35.372102
427	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 07:20:43.85052	2026-05-04 07:20:43.85052
428	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 07:20:52.335467	2026-05-04 07:20:52.335467
429	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 07:21:01.504322	2026-05-04 07:21:01.504322
430	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 07:21:10.336179	2026-05-04 07:21:10.336179
431	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 07:21:19.821173	2026-05-04 07:21:19.821173
432	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 07:21:29.000074	2026-05-04 07:21:29.000074
433	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 07:21:37.651213	2026-05-04 07:21:37.651213
434	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 07:21:46.043269	2026-05-04 07:21:46.043269
435	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 07:21:54.953718	2026-05-04 07:21:54.953718
436	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 07:22:03.573775	2026-05-04 07:22:03.573775
437	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 07:22:12.322443	2026-05-04 07:22:12.322443
438	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 07:22:20.905759	2026-05-04 07:22:20.905759
439	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 07:22:29.244436	2026-05-04 07:22:29.244436
440	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 07:22:37.639215	2026-05-04 07:22:37.639215
441	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 07:22:45.996074	2026-05-04 07:22:45.996074
442	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 07:22:54.492891	2026-05-04 07:22:54.492891
443	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:23:11.856365	2026-05-04 07:23:11.856365
444	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:23:20.972651	2026-05-04 07:23:20.972651
445	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:23:29.78048	2026-05-04 07:23:29.78048
446	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:23:39.957623	2026-05-04 07:23:39.957623
447	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:23:48.364601	2026-05-04 07:23:48.364601
448	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:23:56.769951	2026-05-04 07:23:56.769951
449	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:24:05.798008	2026-05-04 07:24:05.798008
450	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:24:14.620487	2026-05-04 07:24:14.620487
451	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:24:23.410674	2026-05-04 07:24:23.410674
452	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:24:32.140238	2026-05-04 07:24:32.140238
453	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 07:24:40.528882	2026-05-04 07:24:40.528882
454	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:24:57.744415	2026-05-04 07:24:57.744415
455	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:25:17.454488	2026-05-04 07:25:17.454488
456	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:25:23.79793	2026-05-04 07:25:23.79793
457	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:25:32.685119	2026-05-04 07:25:32.685119
458	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:25:41.239625	2026-05-04 07:25:41.239625
459	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:25:49.714111	2026-05-04 07:25:49.714111
460	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:25:58.096491	2026-05-04 07:25:58.096491
461	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:26:06.474781	2026-05-04 07:26:06.474781
462	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:29:23.721346	2026-05-04 07:29:23.721346
463	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:29:33.053637	2026-05-04 07:29:33.053637
464	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:29:42.030228	2026-05-04 07:29:42.030228
465	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:29:51.09346	2026-05-04 07:29:51.09346
466	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:29:59.460037	2026-05-04 07:29:59.460037
467	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:30:07.902153	2026-05-04 07:30:07.902153
468	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:30:16.343886	2026-05-04 07:30:16.343886
469	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:30:24.93272	2026-05-04 07:30:24.93272
470	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:30:33.710082	2026-05-04 07:30:33.710082
471	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:30:42.084527	2026-05-04 07:30:42.084527
472	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 07:30:50.410494	2026-05-04 07:30:50.410494
473	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 07:30:58.843202	2026-05-04 07:30:58.843202
474	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 07:31:07.222706	2026-05-04 07:31:07.222706
475	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 07:31:15.697086	2026-05-04 07:31:15.697086
476	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 07:31:25.164447	2026-05-04 07:31:25.164447
477	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 07:31:34.733118	2026-05-04 07:31:34.733118
478	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 07:31:44.144273	2026-05-04 07:31:44.144273
479	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 07:31:52.720721	2026-05-04 07:31:52.720721
480	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 07:32:01.305928	2026-05-04 07:32:01.305928
481	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 07:32:09.681796	2026-05-04 07:32:09.681796
482	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 07:32:18.001803	2026-05-04 07:32:18.001803
483	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 07:32:26.82738	2026-05-04 07:32:26.82738
484	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 07:32:35.995728	2026-05-04 07:32:35.995728
485	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 07:32:44.758922	2026-05-04 07:32:44.758922
486	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 07:32:53.664362	2026-05-04 07:32:53.664362
487	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 07:33:02.074735	2026-05-04 07:33:02.074735
488	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 07:33:10.494543	2026-05-04 07:33:10.494543
489	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 07:33:19.02374	2026-05-04 07:33:19.02374
490	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 07:33:29.503169	2026-05-04 07:33:29.503169
491	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 07:33:38.825576	2026-05-04 07:33:38.825576
492	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 07:33:48.309038	2026-05-04 07:33:48.309038
493	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 07:33:57.74829	2026-05-04 07:33:57.74829
494	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 07:34:06.157794	2026-05-04 07:34:06.157794
495	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 07:34:14.637037	2026-05-04 07:34:14.637037
496	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 07:34:23.66707	2026-05-04 07:34:23.66707
497	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 07:34:33.250503	2026-05-04 07:34:33.250503
498	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 07:34:42.333197	2026-05-04 07:34:42.333197
499	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 07:34:52.279868	2026-05-04 07:34:52.279868
500	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 07:35:01.091777	2026-05-04 07:35:01.091777
501	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 07:35:09.466036	2026-05-04 07:35:09.466036
502	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 07:35:18.066337	2026-05-04 07:35:18.066337
503	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 07:35:27.244199	2026-05-04 07:35:27.244199
504	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 07:35:36.054074	2026-05-04 07:35:36.054074
505	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 07:35:45.382299	2026-05-04 07:35:45.382299
506	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 07:35:54.139287	2026-05-04 07:35:54.139287
507	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 07:36:02.580605	2026-05-04 07:36:02.580605
508	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 07:36:11.004584	2026-05-04 07:36:11.004584
509	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 07:36:19.563026	2026-05-04 07:36:19.563026
510	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 07:36:29.395879	2026-05-04 07:36:29.395879
511	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 07:36:38.243244	2026-05-04 07:36:38.243244
512	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 07:36:47.098958	2026-05-04 07:36:47.098958
513	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 07:36:55.612771	2026-05-04 07:36:55.612771
514	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 07:37:04.053763	2026-05-04 07:37:04.053763
515	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 07:37:12.52187	2026-05-04 07:37:12.52187
516	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 07:37:21.048348	2026-05-04 07:37:21.048348
517	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 07:37:29.634767	2026-05-04 07:37:29.634767
518	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 07:37:38.132248	2026-05-04 07:37:38.132248
519	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 07:37:46.461014	2026-05-04 07:37:46.461014
520	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 07:37:54.943677	2026-05-04 07:37:54.943677
521	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:39:03.46444	2026-05-04 07:39:03.46444
522	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:39:11.891539	2026-05-04 07:39:11.891539
523	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:39:21.052529	2026-05-04 07:39:21.052529
524	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:39:29.856165	2026-05-04 07:39:29.856165
525	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:39:39.194237	2026-05-04 07:39:39.194237
526	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:39:51.730394	2026-05-04 07:39:51.730394
527	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:40:00.725014	2026-05-04 07:40:00.725014
528	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:40:09.774042	2026-05-04 07:40:09.774042
529	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:40:18.761409	2026-05-04 07:40:18.761409
530	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:40:28.033726	2026-05-04 07:40:28.033726
531	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 07:40:36.571676	2026-05-04 07:40:36.571676
532	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 07:40:46.841635	2026-05-04 07:40:46.841635
533	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 07:40:56.816006	2026-05-04 07:40:56.816006
534	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 07:41:05.289467	2026-05-04 07:41:05.289467
535	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 07:41:13.692362	2026-05-04 07:41:13.692362
536	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 07:41:23.23738	2026-05-04 07:41:23.23738
537	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 07:41:31.846036	2026-05-04 07:41:31.846036
538	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 07:41:42.733377	2026-05-04 07:41:42.733377
539	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 07:41:54.172589	2026-05-04 07:41:54.172589
540	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 07:42:05.948959	2026-05-04 07:42:05.948959
541	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 07:42:15.483415	2026-05-04 07:42:15.483415
542	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 07:42:25.220359	2026-05-04 07:42:25.220359
543	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 07:42:35.963712	2026-05-04 07:42:35.963712
544	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 07:42:46.047277	2026-05-04 07:42:46.047277
545	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 07:42:57.663024	2026-05-04 07:42:57.663024
546	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 07:43:07.555674	2026-05-04 07:43:07.555674
547	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 07:43:16.191518	2026-05-04 07:43:16.191518
548	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 07:43:26.477019	2026-05-04 07:43:26.477019
549	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 07:43:35.486859	2026-05-04 07:43:35.486859
550	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 07:43:44.787152	2026-05-04 07:43:44.787152
551	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 07:43:56.274692	2026-05-04 07:43:56.274692
552	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 07:44:07.906476	2026-05-04 07:44:07.906476
553	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 07:44:16.298183	2026-05-04 07:44:16.298183
554	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 07:44:25.062497	2026-05-04 07:44:25.062497
555	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 07:44:33.85216	2026-05-04 07:44:33.85216
556	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 07:44:42.562337	2026-05-04 07:44:42.562337
557	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 07:44:51.469618	2026-05-04 07:44:51.469618
558	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 07:44:59.984476	2026-05-04 07:44:59.984476
559	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 07:45:08.432884	2026-05-04 07:45:08.432884
560	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 07:45:16.984604	2026-05-04 07:45:16.984604
561	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 07:45:25.617596	2026-05-04 07:45:25.617596
562	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 07:45:34.500508	2026-05-04 07:45:34.500508
563	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 07:45:43.680994	2026-05-04 07:45:43.680994
564	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 07:45:52.325719	2026-05-04 07:45:52.325719
565	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 07:46:00.829793	2026-05-04 07:46:00.829793
566	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 07:46:09.376895	2026-05-04 07:46:09.376895
567	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 07:46:17.981797	2026-05-04 07:46:17.981797
568	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 07:46:26.951995	2026-05-04 07:46:26.951995
569	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 07:46:36.072849	2026-05-04 07:46:36.072849
570	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 07:46:45.307167	2026-05-04 07:46:45.307167
571	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 07:46:55.049888	2026-05-04 07:46:55.049888
572	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 07:47:03.446831	2026-05-04 07:47:03.446831
573	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 07:47:11.943733	2026-05-04 07:47:11.943733
574	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 07:47:20.698191	2026-05-04 07:47:20.698191
575	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 07:47:31.723987	2026-05-04 07:47:31.723987
576	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 07:47:41.162231	2026-05-04 07:47:41.162231
577	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 07:47:51.116505	2026-05-04 07:47:51.116505
578	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 07:48:00.003322	2026-05-04 07:48:00.003322
579	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 07:48:08.495353	2026-05-04 07:48:08.495353
580	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:49:03.838345	2026-05-04 07:49:03.838345
581	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:49:12.315437	2026-05-04 07:49:12.315437
582	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:49:21.136504	2026-05-04 07:49:21.136504
583	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:49:29.843316	2026-05-04 07:49:29.843316
584	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:49:38.760309	2026-05-04 07:49:38.760309
585	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:49:49.108997	2026-05-04 07:49:49.108997
586	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:49:57.577757	2026-05-04 07:49:57.577757
587	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:50:06.106497	2026-05-04 07:50:06.106497
588	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:50:14.668041	2026-05-04 07:50:14.668041
589	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:50:23.298156	2026-05-04 07:50:23.298156
590	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 07:50:31.78311	2026-05-04 07:50:31.78311
591	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 07:50:40.309131	2026-05-04 07:50:40.309131
592	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 07:50:48.643585	2026-05-04 07:50:48.643585
593	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 07:50:57.227631	2026-05-04 07:50:57.227631
594	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 07:51:05.678972	2026-05-04 07:51:05.678972
595	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 07:51:14.029261	2026-05-04 07:51:14.029261
596	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 07:51:23.21386	2026-05-04 07:51:23.21386
597	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 07:51:31.756426	2026-05-04 07:51:31.756426
598	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 07:51:40.56913	2026-05-04 07:51:40.56913
599	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 07:51:48.989898	2026-05-04 07:51:48.989898
600	P01	INRJNM0RDSHP51	0	unreachable	2026-05-04 07:51:57.573714	2026-05-04 07:51:57.573714
601	P01	INRJNM0RDSHP52	0	unreachable	2026-05-04 07:52:06.043021	2026-05-04 07:52:06.043021
602	P01	INRJNM0RDSHP53	0	unreachable	2026-05-04 07:52:14.44944	2026-05-04 07:52:14.44944
603	P01	INRJNM0RDSHP54	0	unreachable	2026-05-04 07:52:22.843286	2026-05-04 07:52:22.843286
604	VAO01	INRJNM0RDSHVA11	0	unreachable	2026-05-04 07:52:31.27581	2026-05-04 07:52:31.27581
605	VAO01	INRJNM0RDSHVA12	0	unreachable	2026-05-04 07:52:39.661958	2026-05-04 07:52:39.661958
606	VAO01	INRJNM0RDSHVA13	0	unreachable	2026-05-04 07:52:48.06688	2026-05-04 07:52:48.06688
607	VAO01	INRJNM0RDSHVA14	0	unreachable	2026-05-04 07:52:56.397027	2026-05-04 07:52:56.397027
608	VAO01	INRJNM0RDSHVA15	0	unreachable	2026-05-04 07:53:04.755674	2026-05-04 07:53:04.755674
609	VAO01	INRJNM0RDSHVA16	0	unreachable	2026-05-04 07:53:13.052176	2026-05-04 07:53:13.052176
610	VAO01	INRJNM0RDSHVA17	0	unreachable	2026-05-04 07:53:21.699275	2026-05-04 07:53:21.699275
611	VAO01	INRJNM0RDSHVA18	0	unreachable	2026-05-04 07:53:30.275027	2026-05-04 07:53:30.275027
612	VAO01	INRJNM0RDSHVA19	0	unreachable	2026-05-04 07:53:38.769511	2026-05-04 07:53:38.769511
613	VAO01	INRJNM0RDSHVA20	0	unreachable	2026-05-04 07:53:47.059764	2026-05-04 07:53:47.059764
614	VAO01	INRJNM0RDSHVA21	0	unreachable	2026-05-04 07:53:55.365462	2026-05-04 07:53:55.365462
615	VAO01	INRJNM0RDSHVA22	0	unreachable	2026-05-04 07:54:03.666558	2026-05-04 07:54:03.666558
616	VAO01	INRJNM0RDSHVA23	0	unreachable	2026-05-04 07:54:11.99776	2026-05-04 07:54:11.99776
617	VAO01	INRJNM0RDSHVA24	0	unreachable	2026-05-04 07:54:20.808428	2026-05-04 07:54:20.808428
618	VAO01	INRJNM0RDSHVA25	0	unreachable	2026-05-04 07:54:29.503099	2026-05-04 07:54:29.503099
619	VAO01	INRJNM0RDSHVA26	0	unreachable	2026-05-04 07:54:37.79561	2026-05-04 07:54:37.79561
620	VAO01	INRJNM0RDSHVA27	0	unreachable	2026-05-04 07:54:46.172269	2026-05-04 07:54:46.172269
621	VAO01	INRJNM0RDSHVA28	0	unreachable	2026-05-04 07:54:54.518948	2026-05-04 07:54:54.518948
622	VAO01	INRJNM0RDSHVA29	0	unreachable	2026-05-04 07:55:02.858645	2026-05-04 07:55:02.858645
623	VAO01	INRJNM0RDSHVA30	0	unreachable	2026-05-04 07:55:11.169893	2026-05-04 07:55:11.169893
624	M01	INRJNM0RDSHM01	0	unreachable	2026-05-04 07:55:19.883509	2026-05-04 07:55:19.883509
625	M01	INRJNM0RDSHM02	0	unreachable	2026-05-04 07:55:28.528594	2026-05-04 07:55:28.528594
626	M01	INRJNM0RDSHM03	0	unreachable	2026-05-04 07:55:37.284465	2026-05-04 07:55:37.284465
627	M01	INRJNM0RDSHM04	0	unreachable	2026-05-04 07:55:45.721228	2026-05-04 07:55:45.721228
628	M01	INRJNM0RDSHM05	0	unreachable	2026-05-04 07:55:54.061594	2026-05-04 07:55:54.061594
629	M01	INRJNM0RDSHM06	0	unreachable	2026-05-04 07:56:02.37092	2026-05-04 07:56:02.37092
630	D01	INRJNM0RDSHD01	0	unreachable	2026-05-04 07:56:10.706798	2026-05-04 07:56:10.706798
631	D01	INRJNM0RDSHD02	0	unreachable	2026-05-04 07:56:19.11775	2026-05-04 07:56:19.11775
632	D01	INRJNM0RDSHD03	0	unreachable	2026-05-04 07:56:27.754339	2026-05-04 07:56:27.754339
633	E01	INRJNM0RDSHE01	0	unreachable	2026-05-04 07:56:36.824342	2026-05-04 07:56:36.824342
634	E01	INRJNM0RDSHE02	0	unreachable	2026-05-04 07:56:45.403081	2026-05-04 07:56:45.403081
635	E01	INRJNM0RDSHE03	0	unreachable	2026-05-04 07:56:53.758571	2026-05-04 07:56:53.758571
636	E01	INRJNM0RDSHE04	0	unreachable	2026-05-04 07:57:02.107485	2026-05-04 07:57:02.107485
637	E01	INRJNM0RDSHE05	0	unreachable	2026-05-04 07:57:10.504964	2026-05-04 07:57:10.504964
638	E01	INRJNM0RDSHE06	0	unreachable	2026-05-04 07:57:18.92499	2026-05-04 07:57:18.92499
639	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 07:58:03.540611	2026-05-04 07:58:03.540611
640	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 07:58:11.861308	2026-05-04 07:58:11.861308
641	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 07:58:20.197912	2026-05-04 07:58:20.197912
642	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 07:58:28.600061	2026-05-04 07:58:28.600061
643	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 07:58:36.976343	2026-05-04 07:58:36.976343
644	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 07:58:45.279703	2026-05-04 07:58:45.279703
645	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 07:58:53.601148	2026-05-04 07:58:53.601148
646	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 07:59:01.911732	2026-05-04 07:59:01.911732
647	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 07:59:10.248711	2026-05-04 07:59:10.248711
648	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 07:59:19.607062	2026-05-04 07:59:19.607062
649	P01	INRJNM0RDSHP01	0	unreachable	2026-05-04 08:19:36.708654	2026-05-04 08:19:36.708654
650	P01	INRJNM0RDSHP02	0	unreachable	2026-05-04 08:19:45.286554	2026-05-04 08:19:45.286554
651	P01	INRJNM0RDSHP03	0	unreachable	2026-05-04 08:19:53.67075	2026-05-04 08:19:53.67075
652	P01	INRJNM0RDSHP04	0	unreachable	2026-05-04 08:20:01.847285	2026-05-04 08:20:01.847285
653	P01	INRJNM0RDSHP05	0	unreachable	2026-05-04 08:20:10.058936	2026-05-04 08:20:10.058936
654	P01	INRJNM0RDSHP06	0	unreachable	2026-05-04 08:20:18.283137	2026-05-04 08:20:18.283137
655	P01	INRJNM0RDSHP07	0	unreachable	2026-05-04 08:20:27.057434	2026-05-04 08:20:27.057434
656	P01	INRJNM0RDSHP08	0	unreachable	2026-05-04 08:20:35.589668	2026-05-04 08:20:35.589668
657	P01	INRJNM0RDSHP09	0	unreachable	2026-05-04 08:20:43.818022	2026-05-04 08:20:43.818022
658	P01	INRJNM0RDSHP10	0	unreachable	2026-05-04 08:20:52.047619	2026-05-04 08:20:52.047619
659	P01	INRJNM0RDSHP11	0	unreachable	2026-05-04 08:21:00.270871	2026-05-04 08:21:00.270871
660	P01	INRJNM0RDSHP12	0	unreachable	2026-05-04 08:21:08.502563	2026-05-04 08:21:08.502563
661	P01	INRJNM0RDSHP13	0	unreachable	2026-05-04 08:21:16.716131	2026-05-04 08:21:16.716131
662	P01	INRJNM0RDSHP14	0	unreachable	2026-05-04 08:21:25.084178	2026-05-04 08:21:25.084178
663	P01	INRJNM0RDSHP15	0	unreachable	2026-05-04 08:21:33.423381	2026-05-04 08:21:33.423381
664	P01	INRJNM0RDSHP16	0	unreachable	2026-05-04 08:21:41.735178	2026-05-04 08:21:41.735178
665	P01	INRJNM0RDSHP17	0	unreachable	2026-05-04 08:21:50.134274	2026-05-04 08:21:50.134274
666	P01	INRJNM0RDSHP18	0	unreachable	2026-05-04 08:21:58.34106	2026-05-04 08:21:58.34106
667	P01	INRJNM0RDSHP19	0	unreachable	2026-05-04 08:22:06.531917	2026-05-04 08:22:06.531917
668	P01	INRJNM0RDSHP20	0	unreachable	2026-05-04 08:22:14.794409	2026-05-04 08:22:14.794409
\.


--
-- Data for Name: app_support_terminals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_support_terminals (id, code, name, description, is_active, created_at, updated_at) FROM stdin;
1	P01	P01	P01 terminal group	t	2026-05-03 22:43:44.557901	2026-05-03 22:43:44.557901
2	VAO01	VAO01	VAO01 terminal group	t	2026-05-03 22:43:44.627951	2026-05-03 22:43:44.627951
3	M01	M01	M01 terminal group	t	2026-05-03 22:43:44.662492	2026-05-03 22:43:44.662492
4	D01	D01	D01 terminal group	t	2026-05-03 22:43:44.672834	2026-05-03 22:43:44.672834
5	E01	E01	E01 terminal group	t	2026-05-03 22:43:44.679561	2026-05-03 22:43:44.679561
\.


--
-- Data for Name: backup_printers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_printers (id, pmno, serial, make, dpi, plant_location, storage_location, remarks, created_at, updated_at) FROM stdin;
2	11079	71J223100314	Zebra	203	B26	Backup Rack 1	Dummy backup printer mapped from existing PM number	2026-05-04 07:25:09.749862	2026-05-04 07:25:09.749862
3	11080	71J222100509	Zebra	203	B26	Backup Rack 2	Dummy backup printer mapped from existing PM number	2026-05-04 07:25:09.758242	2026-05-04 07:25:09.758242
4	7040	71J192800075	Zebra	203	B26	Backup Rack 3	Dummy backup printer mapped from existing PM number	2026-05-04 07:25:09.762205	2026-05-04 07:25:09.762205
5	7041	71J192900011	Zebra	203	B26	Backup Rack 4	Dummy backup printer mapped from existing PM number	2026-05-04 07:25:09.764637	2026-05-04 07:25:09.764637
6	7329	71J211900012	Zebra	203	B26	Backup Rack 5	Dummy backup printer mapped from existing PM number	2026-05-04 07:47:44.382462	2026-05-04 07:47:44.382462
\.


--
-- Data for Name: cartridge_usage_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cartridge_usage_log (id, dn, model, qty, wc, ip, used_by, used_at, printer_location, printer_tag) FROM stdin;
3	jknjk	jknjkn	1	jknkjn	10.132.45.67	Aniket	2026-04-16 10:21:49.92	\N	\N
4	W2020A-DMY	HP 414A Color Dummy	1	WC-HP-07	10.132.40.17	Dummy Engineer	2026-05-04 07:57:32.345088	B1700 Dummy Office 7	HP-DUMMY-07
5	CF289A-DMY	HP 89A Black Dummy	1	WC-HP-06	10.132.40.16	Dummy Engineer	2026-05-04 07:57:32.464569	B1600 Dummy Office 6	HP-DUMMY-06
6	CF258A-DMY	HP 58A Black Dummy	1	WC-HP-05	10.132.40.15	Dummy Engineer	2026-05-04 07:57:32.537253	B26 Dummy Office 5	HP-DUMMY-05
7	CF287A-DMY	HP 87A Black Dummy	1	WC-HP-08	10.132.40.18	Dummy Engineer	2026-05-04 07:57:32.623715	B1800 Dummy Office 8	HP-DUMMY-08
\.


--
-- Data for Name: cartridges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cartridges (id, model, dn, type, compat, stock, min, yield, loc, created_at, updated_at) FROM stdin;
7	qwe	qwe	Black	m404	0	2		hubroom4	2026-04-16 15:08:18.944411	2026-04-16 15:08:18.944411
8	HP 58A Black Dummy	CF258A-DMY	Black	M404dn,M406dn	10	2	3000 pages	HP Cabinet D1	2026-05-04 07:53:12.311712	2026-05-04 07:53:12.311712
9	HP 89A Black Dummy	CF289A-DMY	Black	M507dn	8	2	5000 pages	HP Cabinet D2	2026-05-04 07:56:39.725704	2026-05-04 07:56:39.725704
10	HP 87A Black Dummy	CF287A-DMY	Black	M501dn	7	2	9000 pages	HP Cabinet D4	2026-05-04 07:56:39.865002	2026-05-04 07:56:39.865002
11	HP 414A Color Dummy	W2020A-DMY	Color	M479fdw	6	1	2400 pages	HP Cabinet D3	2026-05-04 07:56:39.975089	2026-05-04 07:56:39.975089
\.


--
-- Data for Name: health_checkup_activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.health_checkup_activity_log (id, pmno, engineer, checked_at) FROM stdin;
5	1212	Aniket	2026-04-15 15:09:39.713
6	1212	Aniket	2026-04-15 15:18:39.327
\.


--
-- Data for Name: health_checkups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.health_checkups (id, pmno, serial, model, make, sapno, mesno, dpi, firmware, km, loftware, ip, mac, loc, stage, bay, wc, health, issue_desc, req_parts, is_repeat, engineer, checked_at, damaged_parts) FROM stdin;
5	1212	Desktop-5qfdpl4	px940	Honeywell	12	45	203 DPI	R17.09.01	1,248,392 labels	INRJNM0LOFT01, INRJNM0LOFT05	10.132.45.67			linking	bay17	Nvdia	ok			f	Aniket	2026-04-15 15:09:39.713951	[]
6	1212	Desktop-5qfdpl4	px940	Honeywell	12	45	203 DPI	R17.09.01	1,248,392 labels	INRJNM0LOFT01, INRJNM0LOFT05	10.132.45.67			linking	bay17	Nvdia	ok			f	Aniket	2026-04-15 15:18:39.327187	[]
\.


--
-- Data for Name: hp_printers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hp_printers (id, tag, model, ip, loc, stage, bay, wc, cartmodel, black_pct, color_pct, online, created_at, plant_location, error_status, last_cartridge_sync) FROM stdin;
8	Hp-admin	Hp leserjet pro	172.19.114.27	Workcell	Jjok	Bay23	Nvidia	Hpltry	85	\N	f	2026-04-16 10:18:04.069539	B26	Timeout connecting to printer at 172.19.114.27	2026-04-16 12:39:23.574167
9	HP-DUMMY-05	HP LaserJet Pro M404dn	10.132.40.15	B26 Dummy Office 5	OFFICE	Bay 5	WC-HP-05	CF258A-DMY	78	\N	f	2026-05-04 07:53:07.12847	B26	Timeout connecting to printer at 10.132.40.15	\N
10	HP-DUMMY-06	HP LaserJet Enterprise M507dn	10.132.40.16	B1600 Dummy Office 6	OFFICE	Bay 6	WC-HP-06	CF289A-DMY	64	\N	f	2026-05-04 07:55:37.559046	B1600	Timeout connecting to printer at 10.132.40.16	\N
11	HP-DUMMY-07	HP Color LaserJet Pro M479fdw	10.132.40.17	B1700 Dummy Office 7	OFFICE	Bay 7	WC-HP-07	W2020A-DMY	55	49	f	2026-05-04 07:56:28.304976	B1700	Timeout connecting to printer at 10.132.40.17	\N
12	HP-DUMMY-08	HP LaserJet Pro M501dn	10.132.40.18	B1800 Dummy Office 8	OFFICE	Bay 8	WC-HP-08	CF287A-DMY	91	\N	f	2026-05-04 07:56:28.479074	B1800	Timeout connecting to printer at 10.132.40.18	\N
\.


--
-- Data for Name: i_learn_issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.i_learn_issues (id, title, description, category, keywords, created_by, created_at, updated_at) FROM stdin;
1	Print not coming		General	\N	Aniketbhosale1012@gmail Com	2026-04-22 11:12:28.418737	2026-04-22 11:12:28.418737
\.


--
-- Data for Name: i_learn_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.i_learn_steps (id, issue_id, step_number, title, description, image_url, created_at, updated_at) FROM stdin;
1	1	1	Check IP adress	First, cross-check that the IP shown on the printer is also shown in Loftware for particular port. If IP is change, then change IP in Loftware for particular port.	\N	2026-04-22 11:12:28.418737	2026-04-22 11:12:28.418737
\.


--
-- Data for Name: issue_activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issue_activity_log (id, issue_id, activity_type, old_severity, new_severity, reason, action_taken, severity_at_time, assigned_to, user_name, created_at) FROM stdin;
4	4	resolved	\N	\N	\N	ok	High	\N	Aniket Patil	2026-04-16 08:34:23.708287
6	6	created	\N	Medium	\N	\N	Medium	\N	Aniket Patil	2026-04-16 08:56:44.572711
7	6	upgraded	Medium	High	important	\N	High	\N	Aniket Patil	2026-04-16 09:16:12.377705
8	6	downgraded	High	Low	not imp	\N	Low	\N	Aniket Patil	2026-04-16 09:27:57.803204
9	6	upgraded	Low	Medium	important	\N	Medium	\N	Aniket Patil	2026-04-16 09:28:17.604682
10	6	upgraded	Medium	High	important	\N	High	\N	Aniket Patil	2026-04-16 09:28:42.567762
11	6	assigned	\N	\N	\N	\N	\N	aniketbhosale4993@gmail.com	Aniketbhosale1012@gmail Com	2026-04-20 08:28:18.635405
12	6	assigned	\N	\N	\N	\N	\N	aniketbhosale4993@gmail.com	Aniketbhosale1012@gmail Com	2026-04-20 08:28:21.381693
13	6	assigned	\N	\N	\N	\N	\N	aniketbhosale1012@gmail.com	Aniketbhosale1012@gmail Com	2026-04-20 09:41:34.072203
14	6	assigned	\N	\N	\N	\N	\N	aniketbhosale4993@gmail.com	Aniketbhosale1012@gmail Com	2026-04-20 09:41:59.274064
\.


--
-- Data for Name: issues; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issues (id, pmno, serial, model, loc, title, "desc", action, severity, category, status, reporter, created_at, expires_at, resolved_at, plant_location, assigned_to, severity_at_resolve, action_taken, status_changed_at, resolution_deadline, breach_status, last_activity_user, sapno, mesno, issue_unique_id) FROM stdin;
4	1212	Desktop-5qfdpl4	px940	Nvdia	Boot issue	Unable to boot	ok	High	Firmware	resolved	Aniket Patil	2026-04-15 19:37:18.211736	2026-04-25 19:37:18.211736	2026-04-16 08:34:23.706148	B26	\N	High	\N	2026-04-16 08:13:44.929775	2026-04-16 19:37:18.211736	on-track	Aniket Patil	\N	\N	ISSU04
6	1212	Desktop-5qfdpl4	px940	Nvdia	Lable cut	Continious lable cut	\N	High	Other	open	Aniket Patil	2026-04-16 08:56:44.557806	2026-04-26 08:56:44.557806	\N	B26	aniketbhosale4993@gmail.com	\N	\N	2026-04-16 09:28:42.563587	2026-04-17 09:28:42.562	on-track	Aniketbhosale1012@gmail Com	12	45	ISSU06
8	11079	71J223100314	ZT610	VERTIV	Continious lable cut	Continious lable cut issue	\N	High	Connectivity	open	Aniketbhosale1012@gmail Com	2026-04-20 09:49:32.264211	2026-04-30 09:49:32.264211	\N	B26	\N	\N	\N	2026-04-20 09:49:32.264211	2026-04-21 09:49:32.189	on-track	Aniketbhosale1012@gmail Com	56	90	ISSU08
\.


--
-- Data for Name: parts_usage_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_usage_log (id, code, name, qty, pmno, serial, wc, used_by, used_at) FROM stdin;
3	SP-HEAD-203	203 DPI Printhead	1	11079	71J223100314	VERTIV	Dummy Engineer	2026-05-04 07:25:09.794214
4	SP-ROLLER-01	Platen Roller	1	11080	71J222100509	VERTIV	Dummy Engineer	2026-05-04 07:25:09.80139
5	SP-SENSOR-01	Media Sensor	1	7040	71J192800075	ERICSSON	Dummy Engineer	2026-05-04 07:25:09.802839
6	SP-BELT-01	Drive Belt Kit	1	7041	71J192900011	ERICSSON	Dummy Engineer	2026-05-04 07:25:09.804176
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, otp, expires_at, is_used, created_at) FROM stdin;
1	5	308644	2026-04-17 16:22:15.568	f	2026-04-17 16:12:15.573961
2	5	545043	2026-04-30 17:12:32.362	t	2026-04-30 17:02:32.365617
\.


--
-- Data for Name: pm_pasted_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pm_pasted_log (id, pmno, serial, model, make, dpi, ip, firmware, sapno, mesno, loftware, pmdate, pasted_at, stage, bay, wc, loc, engineer, shift, remarks, created_at) FROM stdin;
3	DUE1	SN-DUE-001	PM43	Honeywell	203	\N	\N	\N	\N	\N	2026-04-11	2026-04-14 10:30	SMT-2	Bay-B	WC-02	\N	Aniket	\N	\N	2026-04-14 18:30:37.312179
4	UPCOMING1	SN-UP-001	PM43	Honeywell	203	\N	\N	\N	\N	\N	2026-04-16	2026-04-15 10:30	SMT-1	Bay-A	WC-01	\N	Aniket	\N	\N	2026-04-14 18:57:23.549032
5	1212	Desktop-5qfdpl4	px940	Honeywell	203	10.132.45.67	R17.09.01	12	45	INRJNM0LOFT01, INRJNM0LOFT03	2026-07-13	15 Apr 2026, 17:23	linking	bay17	Nvdia		Aniket	1st Shift		2026-04-15 17:23:24.979825
6	1212	Desktop-5qfdpl4	px940	Honeywell	203	10.132.45.67	R17.09.01	12	45	INRJNM0LOFT01, INRJNM0LOFT03	2026-07-13	15 Apr 2026, 18:11	linking	bay17	Nvdia		Aniket	1st Shift	\N	2026-04-15 18:11:12.930047
7	DUE1	SN-DUE-001	PM43	Honeywell	203		R17.09.01				2026-04-11	15 Apr 2026, 18:14	SMT-2	Bay-B	WC-02		Aniket	1st Shift	\N	2026-04-15 18:15:05.968659
8	OVERDUE1	SN-OVD-001	PM43	Honeywell	203		R17.09.01	12	45	INRJNM0LOFT01, INRJNM0LOFT03	2026-04-06	15 Apr 2026, 18:39	SMT-3	Bay-C	WC-03		Aniket	1st Shift	\N	2026-04-15 18:39:43.770959
\.


--
-- Data for Name: printer_live_state; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_live_state (pmno, serial, ip, online_status, condition_status, error_reason, resolved_bay, resolved_stage, resolved_wc, location_display, updated_at, firmware_version, printer_km) FROM stdin;
7433	71J212300426	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
7434	71J212300420	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
7435	71J212300443	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
7436	71J212300435	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
7437	71J212300431	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
8590	71J201200383	\N	offline	unknown	\N	\N	PACKING	ERICSSON	PACKING / ERICSSON	2026-05-04 08:21:22.032306	\N	\N
DUE1	SN-DUE-001	\N	offline	unknown	\N	Bay-B	SMT-2	WC-02	Bay-B / SMT-2 / WC-02	2026-05-04 08:21:22.032306	\N	\N
OVERDUE1	SN-OVD-001	\N	offline	unknown	\N	Bay-C	SMT-3	WC-03	Bay-C / SMT-3 / WC-03	2026-05-04 08:21:22.032306	\N	\N
TIMEOUTTEST	TEMP	\N	offline	unknown	\N	\N	TEMP	TEMP	TEMP / TEMP	2026-05-04 08:21:22.032306	\N	\N
UPCOMING1	SN-UP-001	\N	offline	unknown	\N	Bay-A	SMT-1	WC-01	Bay-A / SMT-1 / WC-01	2026-05-04 08:21:22.032306	\N	\N
11079	71J223100314	\N	offline	unknown	\N	\N	PACKING	VERTIV	PACKING / VERTIV	2026-05-04 08:21:22.032306	\N	\N
11080	71J222100509	\N	offline	unknown	\N	\N	PACKING	VERTIV	PACKING / VERTIV	2026-05-04 08:21:22.032306	\N	\N
7040	71J192800075	\N	offline	unknown	\N	\N	PACKING	ERICSSON	PACKING / ERICSSON	2026-05-04 08:21:22.032306	\N	\N
7041	71J192900011	\N	offline	unknown	\N	\N	PACKING	ERICSSON	PACKING / ERICSSON	2026-05-04 08:21:22.032306	\N	\N
7329	71J211900012	\N	offline	unknown	\N	\N	ALSTOM	ALSTOM	ALSTOM / ALSTOM	2026-05-04 08:21:22.032306	\N	\N
7430	71J212300427	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
7431	71J212300428	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
1212	Desktop-5qfdpl4	10.197.11.27	online	unknown	Resolved to local PC IP	bay17	linking	Nvdia	bay17 / linking / Nvdia	2026-04-30 17:07:11.120759	\N	\N
7432	71J212300434	\N	offline	unknown	\N	\N	PACKING	Nvidia	PACKING / Nvidia	2026-05-04 08:21:22.032306	\N	\N
\.


--
-- Data for Name: printer_location_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_location_logs (id, pmno, serial, old_wc, old_stage, old_bay, old_loc, old_plant_location, new_wc, new_stage, new_bay, new_loc, new_plant_location, source, changed_by, changed_at) FROM stdin;
1	11079	71J223100314	OLD-WC-1	STAGING	Old Bay 1	Old location 1	B26	VERTIV	PACKING	\N	\N	B26	dummy_seed	Dummy Engineer	2026-05-04 07:25:09.909341
2	11080	71J222100509	OLD-WC-2	STAGING	Old Bay 2	Old location 2	B26	VERTIV	PACKING	\N	\N	B26	dummy_seed	Dummy Engineer	2026-05-04 07:25:09.916876
3	7040	71J192800075	OLD-WC-3	STAGING	Old Bay 3	Old location 3	B26	ERICSSON	PACKING	\N	\N	B26	dummy_seed	Dummy Engineer	2026-05-04 07:25:09.918891
4	7041	71J192900011	OLD-WC-4	STAGING	Old Bay 4	Old location 4	B26	ERICSSON	PACKING	\N	\N	B26	dummy_seed	Dummy Engineer	2026-05-04 07:25:09.920448
\.


--
-- Data for Name: printer_status_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printer_status_logs (id, pmno, serial, event_type, reason, old_online_status, new_online_status, old_condition_status, new_condition_status, old_error_reason, new_error_reason, old_ip, new_ip, logged_at) FROM stdin;
4	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-14 18:49:54.019787
5	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-14 18:49:54.019787
6	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-14 18:53:03.108198
7	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-14 18:53:03.108198
8	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 13:12:23.091804
9	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 13:12:23.091804
10	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-15 13:13:36.221167
11	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-15 13:13:36.221167
12	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 21:12:12.176135
13	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 21:12:12.176135
14	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-15 21:14:07.253924
15	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-15 21:14:07.253924
16	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 21:20:07.482555
17	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 21:20:07.482555
18	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-15 21:22:07.275713
19	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-15 21:22:07.275713
20	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 23:26:40.52533
21	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-15 23:26:40.52533
22	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-16 08:05:17.300322
23	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-16 08:05:17.300322
24	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 08:51:21.998416
25	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 08:53:18.915414
26	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 10:08:33.490026
27	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 12:45:23.43537
28	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 16:32:51.5203
29	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 16:45:06.634648
30	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 16:52:16.218138
31	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 16:52:57.521622
32	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-16 17:22:57.572056
33	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-16 17:22:57.572056
34	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-16 17:24:57.817215
35	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-16 17:24:57.817215
36	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-16 18:51:48.863465
37	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	127.0.0.1	2026-04-16 18:51:48.863465
38	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-16 18:55:49.144544
39	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.19.114.27	2026-04-16 18:55:49.144544
40	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 20:02:31.651062
41	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.19.114.27	172.19.114.27	2026-04-16 20:04:27.156479
42	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	172.20.10.2	2026-04-16 22:01:27.095879
43	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.19.114.27	172.20.10.2	2026-04-16 22:01:27.095879
44	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	172.20.10.2	172.20.183.27	2026-04-17 14:56:26.003427
45	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	172.20.10.2	172.20.183.27	2026-04-17 14:56:26.003427
46	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-17 17:18:27.318552
47	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-17 20:02:31.291935
48	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-17 21:59:08.349154
49	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-17 22:01:07.422379
50	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-17 22:03:07.407266
51	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-17 22:05:07.747109
52	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	10.27.132.27	2026-04-18 16:42:09.840837
53	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	10.27.132.27	2026-04-18 16:42:09.840837
54	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	10.27.132.27	172.20.183.27	2026-04-18 16:57:47.480833
55	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	10.27.132.27	172.20.183.27	2026-04-18 16:57:47.480833
56	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 10:46:24.972838
57	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 10:46:24.972838
58	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Web UI unreachable	Web UI unreachable	127.0.0.1	127.0.0.1	2026-04-19 10:47:58.012551
59	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-19 10:50:25.095045
60	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	offline	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-19 10:50:25.095045
61	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	offline	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-19 10:50:25.095045
62	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 12:56:06.571301
63	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 12:56:06.571301
64	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-19 14:14:26.830305
65	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-19 14:14:26.830305
66	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 15:20:55.125731
67	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 15:20:55.125731
68	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-19 15:41:24.966476
69	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-19 15:41:24.966476
70	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 22:31:13.964978
71	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-19 22:31:13.964978
72	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-20 07:27:09.462939
73	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-20 07:27:09.462939
74	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer went offline	online	offline	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-21 08:50:52.98308
75	1212	Desktop-5qfdpl4	ONLINE_STATUS_CHANGED	Printer came online	offline	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	172.20.183.27	2026-04-21 08:52:52.988512
76	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-26 21:44:01.96522
77	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Resolved to local PC IP	Web UI unreachable	172.20.183.27	127.0.0.1	2026-04-26 21:44:01.96522
78	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-26 21:48:00.636487
79	1212	Desktop-5qfdpl4	CONDITION_CHANGED	Printer returned to ready state	online	online	unknown	unknown	Web UI unreachable	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-26 21:48:00.636487
80	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	127.0.0.1	2026-04-27 21:51:11.701323
81	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-27 21:52:11.625937
82	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	127.0.0.1	2026-04-28 16:22:10.035233
83	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-28 16:24:10.064532
84	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	127.0.0.1	2026-04-28 19:52:08.540635
85	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-28 19:53:08.434318
86	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	127.0.0.1	2026-04-28 21:01:08.9283
87	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	127.0.0.1	172.20.183.27	2026-04-28 21:02:08.833306
88	1212	Desktop-5qfdpl4	IP_CHANGED	IP address changed	online	online	unknown	unknown	Resolved to local PC IP	Resolved to local PC IP	172.20.183.27	10.197.11.27	2026-04-30 17:00:11.075788
\.


--
-- Data for Name: printers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.printers (id, pmno, serial, make, model, dpi, ip, wc, loc, stage, bay, status, pmdate, sapno, mesno, firmware, loftware, buyoff, remarks, created_at, updated_at, plant_location, maintenance_type) FROM stdin;
12	DUE1	SN-DUE-001	Honeywell	PM43	203	\N	WC-02	\N	SMT-2	Bay-B	ready	2026-04-11	\N	\N	\N	\N	\N	\N	2026-04-14 18:29:43.388162	2026-04-14 18:29:43.388162	B26	quarterly
13	OVERDUE1	SN-OVD-001	Honeywell	PM43	203	\N	WC-03	\N	SMT-3	Bay-C	ready	2026-04-06	\N	\N	\N	\N	\N	\N	2026-04-14 18:29:43.392499	2026-04-14 18:29:43.392499	B26	quarterly
14	TIMEOUTTEST	TEMP	Zebra	ZT610	\N	\N	TEMP	\N	TEMP	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:50:33.823866	2026-04-16 09:50:33.823866	B26	quarterly
15	7329	71J211900012	Zebra	ZT610	\N	\N	ALSTOM	\N	ALSTOM	\N	ready	2025-02-12	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
16	7430	71J212300427	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
17	7431	71J212300428	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
18	7432	71J212300434	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
19	7433	71J212300426	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
20	7434	71J212300420	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
21	7435	71J212300443	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
22	7436	71J212300435	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
23	7437	71J212300431	Zebra	ZT610	\N	\N	Nvidia	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
24	11079	71J223100314	Zebra	ZT610	\N	\N	VERTIV	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
25	11080	71J222100509	Zebra	ZT610	\N	\N	VERTIV	\N	PACKING	\N	ready	2025-03-07	\N	\N	\N	\N	\N	\N	2026-04-16 09:53:26.405141	2026-04-16 09:53:26.405141	B26	quarterly
26	7040	71J192800075	Zebra	ZT610	\N	\N	ERICSSON	\N	PACKING	\N	ready	2025-02-15	\N	\N	\N	\N	\N	\N	2026-04-16 10:01:11.75689	2026-04-16 10:01:11.75689	B26	quarterly
27	7041	71J192900011	Zebra	ZT610	\N	\N	ERICSSON	\N	PACKING	\N	ready	2025-02-15	\N	\N	\N	\N	\N	\N	2026-04-16 10:01:11.75689	2026-04-16 10:01:11.75689	B26	quarterly
28	8590	71J201200383	Zebra	ZT610	\N	\N	ERICSSON	\N	PACKING	\N	ready	2025-02-15	\N	\N	\N	\N	\N	\N	2026-04-16 10:01:11.75689	2026-04-16 10:01:11.75689	B26	quarterly
11	UPCOMING1	SN-UP-001	Honeywell	PM43	203	\N	WC-01	\N	SMT-1	Bay-A	ready	2026-07-16	\N	\N	\N	\N	\N	\N	2026-04-14 18:29:43.374064	2026-04-17 14:56:26.003427	B26	quarterly
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recipes (id, name, make, model, dpi, media, width, length, top, left_margin, darkness, speed, loft, verifier, calibration, contrast, size, "desc", created_at, updated_at, config_json) FROM stdin;
3	Abc	\N	PX940	300-600	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-04-16 11:53:01.741812	2026-04-16 11:53:01.741812	{}
\.


--
-- Data for Name: registration_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registration_otps (id, email, otp, expires_at, is_used, created_at) FROM stdin;
1	aniketbhosale4993@gmail.com	968970	2026-04-16 16:44:28.08	f	2026-04-16 16:34:28.081299
2	printerassetmanager@gmail.com	557612	2026-04-16 16:56:05.249	f	2026-04-16 16:46:05.250747
3	printerassetmanager@gmail.com	674579	2026-04-16 16:57:08.301	f	2026-04-16 16:47:08.302135
4	aniketbhosale4993@gmail.com	404727	2026-04-16 16:58:08.548	f	2026-04-16 16:48:08.549461
5	aniketbhosale4993@gmail.com	878592	2026-04-16 16:58:33.653	f	2026-04-16 16:48:33.654274
6	test.printerassetmanager+otp@gmail.com	579691	2026-04-16 17:03:03.052	f	2026-04-16 16:53:03.053378
7	aniketbhosale4993@gmail.com	129491	2026-04-16 17:03:45.756	t	2026-04-16 16:53:45.757291
8	bagalkaustubh80@gmail.com	949033	2026-04-16 21:53:43.989	t	2026-04-16 21:43:43.994442
9	aniketbhosale8079@gmail.com	810566	2026-05-04 06:37:41.779	f	2026-05-04 06:27:41.780608
10	aniketbhosale8079@gmail.com	658317	2026-05-04 06:55:52.812	f	2026-05-04 06:45:52.815722
11	aniketbhosale8079@gmail.com	191718	2026-05-04 07:23:53.49	t	2026-05-04 07:13:53.493383
\.


--
-- Data for Name: spare_parts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spare_parts (id, code, name, compat, avail, min, loc, serial, condition, created_at, updated_at, plant_location, printer_model, category) FROM stdin;
7	honeywell printer	Printer head 600 dpi	Honeywell	1	2	Hubroom 4 rack 1	\N	New	2026-05-03 04:46:57.725492	2026-05-03 04:46:57.725492	B26	PX940	\N
8	Zebra Moter belt	Moter belt	Zebra	1	2	Hubroom 4 rack 1	\N	Used	2026-05-03 04:48:20.882068	2026-05-03 04:48:20.882068	B26	ZT610	\N
9	PWR-001	SMPS	Honeywell	3	2	Dummy Rack 1	DUMMY-SERIAL-1	New	2026-05-03 05:17:24.929798	2026-05-03 05:35:05.89954	B26	px940	Power
\.


--
-- Data for Name: user_approvals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_approvals (id, user_id, requested_at, approved_by, approved_at, status) FROM stdin;
3	5	2026-04-16 16:54:21.96251	aniketbhosale1012@gmail.com	2026-04-16 16:56:02.788483	approved
5	7	2026-05-04 07:14:37.441513	aniketbhosale1012@gmail.com	2026-05-04 07:19:00.536026	approved
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, full_name, role, status, created_at, updated_at, support_type) FROM stdin;
2	aniketbhosale1012@gmail.com	$2b$10$F3VGjBRCoNeZMvC7iYh63OPAXGuOjCSKkn0a.7gFWLbhXJz4hb9sG	Super Admin	super_admin	active	2026-04-16 12:58:57.38047	2026-04-16 12:58:57.38047	technical
5	aniketbhosale4993@gmail.com	$2b$10$rAK1Jc8d6bw6pFFTrvW3Su8GMhAb/.0hzJPK7InswW7.MIA2XkAg6	ANIKET	user	active	2026-04-16 16:54:21.957652	2026-04-16 16:54:21.957652	technical
7	aniketbhosale8079@gmail.com	$2b$10$nmpdNV6/sB3TfNXJPNG6MevWWQSOmPtdWJF.1ZOs2VUnZ6JZwqRMe	Aniket Bhosale	user	active	2026-05-04 07:14:37.32828	2026-05-04 07:14:37.32828	both
\.


--
-- Data for Name: vlan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vlan (id, port, ip, mac, sw, loc, stage, bay, wc, created_at, plant_location) FROM stdin;
3	Port01	172.19.114.25	jhkjjbvv j	Jobibjh	Phase1	Linking	Bay12	Nvidia	2026-04-15 21:30:32.072897	B26
\.


--
-- Name: app_support_servers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_support_servers_id_seq', 38291, true);


--
-- Name: app_support_terminal_deploy_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_support_terminal_deploy_history_id_seq', 1, false);


--
-- Name: app_support_terminal_failed_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_support_terminal_failed_devices_id_seq', 1, false);


--
-- Name: app_support_terminal_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_support_terminal_history_id_seq', 668, true);


--
-- Name: app_support_terminals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.app_support_terminals_id_seq', 3245, true);


--
-- Name: backup_printers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.backup_printers_id_seq', 6, true);


--
-- Name: cartridge_usage_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cartridge_usage_log_id_seq', 7, true);


--
-- Name: cartridges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cartridges_id_seq', 11, true);


--
-- Name: health_checkup_activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.health_checkup_activity_log_id_seq', 10, true);


--
-- Name: health_checkups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.health_checkups_id_seq', 11, true);


--
-- Name: hp_printers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hp_printers_id_seq', 12, true);


--
-- Name: i_learn_issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.i_learn_issues_id_seq', 1, true);


--
-- Name: i_learn_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.i_learn_steps_id_seq', 1, true);


--
-- Name: issue_activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_activity_log_id_seq', 21, true);


--
-- Name: issue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issue_id_seq', 1, false);


--
-- Name: issues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.issues_id_seq', 9, true);


--
-- Name: parts_usage_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parts_usage_log_id_seq', 6, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 2, true);


--
-- Name: pm_pasted_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pm_pasted_log_id_seq', 8, true);


--
-- Name: printer_location_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.printer_location_logs_id_seq', 4, true);


--
-- Name: printer_status_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.printer_status_logs_id_seq', 88, true);


--
-- Name: printers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.printers_id_seq', 29, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recipes_id_seq', 3, true);


--
-- Name: registration_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.registration_otps_id_seq', 11, true);


--
-- Name: spare_parts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.spare_parts_id_seq', 12, true);


--
-- Name: user_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_approvals_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: vlan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vlan_id_seq', 3, true);


--
-- Name: app_support_servers app_support_servers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_servers
    ADD CONSTRAINT app_support_servers_name_key UNIQUE (name);


--
-- Name: app_support_servers app_support_servers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_servers
    ADD CONSTRAINT app_support_servers_pkey PRIMARY KEY (id);


--
-- Name: app_support_terminal_deploy_history app_support_terminal_deploy_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminal_deploy_history
    ADD CONSTRAINT app_support_terminal_deploy_history_pkey PRIMARY KEY (id);


--
-- Name: app_support_terminal_failed_devices app_support_terminal_failed_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminal_failed_devices
    ADD CONSTRAINT app_support_terminal_failed_devices_pkey PRIMARY KEY (id);


--
-- Name: app_support_terminal_history app_support_terminal_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminal_history
    ADD CONSTRAINT app_support_terminal_history_pkey PRIMARY KEY (id);


--
-- Name: app_support_terminals app_support_terminals_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminals
    ADD CONSTRAINT app_support_terminals_code_key UNIQUE (code);


--
-- Name: app_support_terminals app_support_terminals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_terminals
    ADD CONSTRAINT app_support_terminals_pkey PRIMARY KEY (id);


--
-- Name: backup_printers backup_printers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_printers
    ADD CONSTRAINT backup_printers_pkey PRIMARY KEY (id);


--
-- Name: backup_printers backup_printers_pmno_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_printers
    ADD CONSTRAINT backup_printers_pmno_key UNIQUE (pmno);


--
-- Name: cartridge_usage_log cartridge_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartridge_usage_log
    ADD CONSTRAINT cartridge_usage_log_pkey PRIMARY KEY (id);


--
-- Name: cartridges cartridges_dn_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartridges
    ADD CONSTRAINT cartridges_dn_unique UNIQUE (dn);


--
-- Name: cartridges cartridges_model_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartridges
    ADD CONSTRAINT cartridges_model_key UNIQUE (model);


--
-- Name: cartridges cartridges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cartridges
    ADD CONSTRAINT cartridges_pkey PRIMARY KEY (id);


--
-- Name: health_checkup_activity_log health_checkup_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_checkup_activity_log
    ADD CONSTRAINT health_checkup_activity_log_pkey PRIMARY KEY (id);


--
-- Name: health_checkups health_checkups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.health_checkups
    ADD CONSTRAINT health_checkups_pkey PRIMARY KEY (id);


--
-- Name: hp_printers hp_printers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hp_printers
    ADD CONSTRAINT hp_printers_pkey PRIMARY KEY (id);


--
-- Name: hp_printers hp_printers_tag_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hp_printers
    ADD CONSTRAINT hp_printers_tag_key UNIQUE (tag);


--
-- Name: i_learn_issues i_learn_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.i_learn_issues
    ADD CONSTRAINT i_learn_issues_pkey PRIMARY KEY (id);


--
-- Name: i_learn_steps i_learn_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.i_learn_steps
    ADD CONSTRAINT i_learn_steps_pkey PRIMARY KEY (id);


--
-- Name: issue_activity_log issue_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity_log
    ADD CONSTRAINT issue_activity_log_pkey PRIMARY KEY (id);


--
-- Name: issues issues_issue_unique_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_issue_unique_id_key UNIQUE (issue_unique_id);


--
-- Name: issues issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (id);


--
-- Name: parts_usage_log parts_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_usage_log
    ADD CONSTRAINT parts_usage_log_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: pm_pasted_log pm_pasted_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_pasted_log
    ADD CONSTRAINT pm_pasted_log_pkey PRIMARY KEY (id);


--
-- Name: printer_live_state printer_live_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_live_state
    ADD CONSTRAINT printer_live_state_pkey PRIMARY KEY (pmno);


--
-- Name: printer_location_logs printer_location_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_location_logs
    ADD CONSTRAINT printer_location_logs_pkey PRIMARY KEY (id);


--
-- Name: printer_status_logs printer_status_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printer_status_logs
    ADD CONSTRAINT printer_status_logs_pkey PRIMARY KEY (id);


--
-- Name: printers printers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_pkey PRIMARY KEY (id);


--
-- Name: printers printers_pmno_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_pmno_key UNIQUE (pmno);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: registration_otps registration_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registration_otps
    ADD CONSTRAINT registration_otps_pkey PRIMARY KEY (id);


--
-- Name: spare_parts spare_parts_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_code_key UNIQUE (code);


--
-- Name: spare_parts spare_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_pkey PRIMARY KEY (id);


--
-- Name: user_approvals user_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_approvals
    ADD CONSTRAINT user_approvals_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vlan vlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vlan
    ADD CONSTRAINT vlan_pkey PRIMARY KEY (id);


--
-- Name: idx_app_support_terminal_deploy_history_pc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_support_terminal_deploy_history_pc ON public.app_support_terminal_deploy_history USING btree (pc_name, deployed_at DESC);


--
-- Name: idx_app_support_terminal_failed_devices_failed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_support_terminal_failed_devices_failed_at ON public.app_support_terminal_failed_devices USING btree (failed_at DESC);


--
-- Name: idx_app_support_terminal_history_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_support_terminal_history_recorded_at ON public.app_support_terminal_history USING btree (recorded_at);


--
-- Name: idx_app_support_terminal_history_terminal_code_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_app_support_terminal_history_terminal_code_recorded_at ON public.app_support_terminal_history USING btree (terminal_code, recorded_at);


--
-- Name: idx_backup_printers_plant_dpi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_printers_plant_dpi ON public.backup_printers USING btree (plant_location, dpi);


--
-- Name: idx_cartridge_usage_dn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cartridge_usage_dn ON public.cartridge_usage_log USING btree (dn);


--
-- Name: idx_cartridge_usage_used_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cartridge_usage_used_at ON public.cartridge_usage_log USING btree (used_at DESC);


--
-- Name: idx_health_checkup_activity_checked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_health_checkup_activity_checked_at ON public.health_checkup_activity_log USING btree (checked_at DESC);


--
-- Name: idx_i_learn_issues_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_i_learn_issues_category ON public.i_learn_issues USING btree (category);


--
-- Name: idx_i_learn_issues_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_i_learn_issues_created_at ON public.i_learn_issues USING btree (created_at DESC);


--
-- Name: idx_i_learn_steps_issue_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_i_learn_steps_issue_id ON public.i_learn_steps USING btree (issue_id);


--
-- Name: idx_i_learn_steps_step_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_i_learn_steps_step_number ON public.i_learn_steps USING btree (step_number);


--
-- Name: idx_issue_activity_issue_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issue_activity_issue_id ON public.issue_activity_log USING btree (issue_id);


--
-- Name: idx_issue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issue_status ON public.issues USING btree (status);


--
-- Name: idx_issue_unique_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issue_unique_id ON public.issues USING btree (issue_unique_id);


--
-- Name: idx_issues_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_category ON public.i_learn_issues USING btree (category);


--
-- Name: idx_issues_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_issues_created_at ON public.i_learn_issues USING btree (created_at DESC);


--
-- Name: idx_printer_location_logs_pmno_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_location_logs_pmno_time ON public.printer_location_logs USING btree (pmno, changed_at DESC);


--
-- Name: idx_printer_status_logs_logged_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_status_logs_logged_at ON public.printer_status_logs USING btree (logged_at DESC);


--
-- Name: idx_printer_status_logs_pmno_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_printer_status_logs_pmno_time ON public.printer_status_logs USING btree (pmno, logged_at DESC);


--
-- Name: idx_registration_otps_email_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_registration_otps_email_created ON public.registration_otps USING btree (email, created_at DESC);


--
-- Name: idx_steps_issue_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_steps_issue_id ON public.i_learn_steps USING btree (issue_id);


--
-- Name: idx_steps_step_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_steps_step_number ON public.i_learn_steps USING btree (step_number);


--
-- Name: app_support_servers app_support_servers_terminal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_support_servers
    ADD CONSTRAINT app_support_servers_terminal_id_fkey FOREIGN KEY (terminal_id) REFERENCES public.app_support_terminals(id) ON DELETE CASCADE;


--
-- Name: i_learn_steps i_learn_steps_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.i_learn_steps
    ADD CONSTRAINT i_learn_steps_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.i_learn_issues(id) ON DELETE CASCADE;


--
-- Name: issue_activity_log issue_activity_log_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_activity_log
    ADD CONSTRAINT issue_activity_log_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_approvals user_approvals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_approvals
    ADD CONSTRAINT user_approvals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict k5ZnQ55y5lbvmKuc73RteAGt3Peg97arw0cnRwaJxvabQx3LQNqqrZLNQrNQTTR

