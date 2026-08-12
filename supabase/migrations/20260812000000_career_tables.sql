-- Career Compass のテーブル一式。
--
-- 全テーブルで RLS を有効化し、auth.uid() = user_id の行のみ参照・更新できる。
-- id はクライアント側で `<prefix>_<uuid>` 形式を発行する（DB 側では採番しない）。

-- ---------------------------------------------------------------------------
-- 1. career_profiles（基本情報・年収・公開リンク）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_profiles" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "full_name_kana" "text" DEFAULT ''::"text" NOT NULL,
    "birth_date" "date",
    "gender" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "phone" "text" DEFAULT ''::"text" NOT NULL,
    "postal_code" "text" DEFAULT ''::"text" NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "nearest_station" "text" DEFAULT ''::"text" NOT NULL,
    "headline" "text" DEFAULT ''::"text" NOT NULL,
    "current_company" "text" DEFAULT ''::"text" NOT NULL,
    "current_job_title" "text" DEFAULT ''::"text" NOT NULL,
    "years_of_experience" numeric,
    "current_annual_income" numeric,
    "target_annual_income" numeric DEFAULT 10000000 NOT NULL,
    "job_change_target_date" "date",
    "github_url" "text" DEFAULT ''::"text" NOT NULL,
    "portfolio_url" "text" DEFAULT ''::"text" NOT NULL,
    "linkedin_url" "text" DEFAULT ''::"text" NOT NULL,
    "blog_url" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_profiles_current_annual_income_check" CHECK (("current_annual_income" IS NULL OR "current_annual_income" >= (0)::numeric)),
    CONSTRAINT "career_profiles_target_annual_income_check" CHECK (("target_annual_income" >= (0)::numeric))
);

ALTER TABLE "public"."career_profiles" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_profiles" IS '転職活動の基本情報。ユーザーごとに 1 行。id はクライアント側で prof_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_profiles"."headline" IS '職務経歴書の冒頭に載せる一行キャッチ。';
COMMENT ON COLUMN "public"."career_profiles"."current_annual_income" IS '現年収（円）。年収ギャップの算出に使う。';
COMMENT ON COLUMN "public"."career_profiles"."target_annual_income" IS '目標年収（円）。既定は 1000 万円。';

ALTER TABLE ONLY "public"."career_profiles"
    ADD CONSTRAINT "career_profiles_pkey" PRIMARY KEY ("id");

-- ユーザーごとに 1 行。upsert の onConflict 対象。
ALTER TABLE ONLY "public"."career_profiles"
    ADD CONSTRAINT "career_profiles_user_id_key" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."career_profiles"
    ADD CONSTRAINT "career_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2. career_skills（保有スキル）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_skills" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "name" "text" NOT NULL,
    "level" integer DEFAULT 3 NOT NULL,
    "years_of_experience" numeric,
    "last_used_on" "date",
    "is_core" boolean DEFAULT false NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_skills_level_check" CHECK (("level" >= 1 AND "level" <= 5)),
    CONSTRAINT "career_skills_category_check" CHECK (("category" = ANY (ARRAY['language'::"text", 'framework'::"text", 'cloud'::"text", 'database'::"text", 'infra'::"text", 'data'::"text", 'security'::"text", 'tool'::"text", 'domain'::"text", 'management'::"text"])))
);

ALTER TABLE "public"."career_skills" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_skills" IS '保有スキル。id はクライアント側で skill_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_skills"."level" IS '1: 学習中 〜 5: 他者を指導できる。';
COMMENT ON COLUMN "public"."career_skills"."last_used_on" IS '最終使用年月。2 年以上前のスキルは書類での訴求力が落ちるため、鮮度スコアの算出に使う。';
COMMENT ON COLUMN "public"."career_skills"."is_core" IS '書類の前面に出す主力スキル。';

ALTER TABLE ONLY "public"."career_skills"
    ADD CONSTRAINT "career_skills_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_skills"
    ADD CONSTRAINT "career_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_skills_user_id" ON "public"."career_skills" USING "btree" ("user_id");

-- ---------------------------------------------------------------------------
-- 3. career_experiences（職歴）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_experiences" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "employment_type" "text" DEFAULT 'full_time'::"text" NOT NULL,
    "started_on" "date" NOT NULL,
    "ended_on" "date",
    "job_title" "text" DEFAULT ''::"text" NOT NULL,
    "department" "text" DEFAULT ''::"text" NOT NULL,
    "industry" "text" DEFAULT ''::"text" NOT NULL,
    "headcount" integer,
    "annual_income" numeric,
    "business_description" "text" DEFAULT ''::"text" NOT NULL,
    "achievements" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_experiences_employment_type_check" CHECK (("employment_type" = ANY (ARRAY['full_time'::"text", 'contract'::"text", 'dispatch'::"text", 'freelance'::"text", 'part_time'::"text", 'internship'::"text"]))),
    CONSTRAINT "career_experiences_period_check" CHECK (("ended_on" IS NULL OR "ended_on" >= "started_on"))
);

ALTER TABLE "public"."career_experiences" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_experiences" IS '職歴（会社単位）。id はクライアント側で exp_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_experiences"."ended_on" IS 'NULL は在籍中。履歴書の「現在に至る」の判定に使う。';
COMMENT ON COLUMN "public"."career_experiences"."annual_income" IS '在籍時の年収（円）。年収推移の可視化と交渉材料に使う。';

ALTER TABLE ONLY "public"."career_experiences"
    ADD CONSTRAINT "career_experiences_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_experiences"
    ADD CONSTRAINT "career_experiences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_experiences_user_id" ON "public"."career_experiences" USING "btree" ("user_id");

-- ---------------------------------------------------------------------------
-- 4. career_projects（経験プロジェクト）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_projects" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "experience_id" "text",
    "name" "text" NOT NULL,
    "started_on" "date",
    "ended_on" "date",
    "role" "text" DEFAULT ''::"text" NOT NULL,
    "team_size" integer,
    "industry" "text" DEFAULT ''::"text" NOT NULL,
    "overview" "text" DEFAULT ''::"text" NOT NULL,
    "responsibilities" "text" DEFAULT ''::"text" NOT NULL,
    "challenge" "text" DEFAULT ''::"text" NOT NULL,
    "action" "text" DEFAULT ''::"text" NOT NULL,
    "result" "text" DEFAULT ''::"text" NOT NULL,
    "impact_metric" "text" DEFAULT ''::"text" NOT NULL,
    "tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "phases" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_highlighted" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_projects_period_check" CHECK (("ended_on" IS NULL OR "started_on" IS NULL OR "ended_on" >= "started_on"))
);

ALTER TABLE "public"."career_projects" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_projects" IS '経験プロジェクト。課題（challenge）→ 施策（action）→ 成果（result）で保持する。id はクライアント側で proj_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_projects"."experience_id" IS '紐づく職歴。個人開発・社外活動は NULL。';
COMMENT ON COLUMN "public"."career_projects"."impact_metric" IS '定量成果。高年収レンジの評価軸となるため、数値のみを抜き出して保持する。';
COMMENT ON COLUMN "public"."career_projects"."phases" IS '担当工程（requirements / basic_design / detail_design / implementation / test / release / operation / management）。';

ALTER TABLE ONLY "public"."career_projects"
    ADD CONSTRAINT "career_projects_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_projects"
    ADD CONSTRAINT "career_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- 職歴を削除してもプロジェクトの記録は残す（紐づけだけ外す）
ALTER TABLE ONLY "public"."career_projects"
    ADD CONSTRAINT "career_projects_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "public"."career_experiences"("id") ON DELETE SET NULL;

CREATE INDEX "idx_career_projects_user_id" ON "public"."career_projects" USING "btree" ("user_id");
CREATE INDEX "idx_career_projects_experience_id" ON "public"."career_projects" USING "btree" ("experience_id");

-- ---------------------------------------------------------------------------
-- 5. career_educations（学歴）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_educations" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "school_name" "text" NOT NULL,
    "faculty" "text" DEFAULT ''::"text" NOT NULL,
    "degree" "text" DEFAULT ''::"text" NOT NULL,
    "started_on" "date",
    "ended_on" "date",
    "status" "text" DEFAULT '卒業'::"text" NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."career_educations" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_educations" IS '学歴。履歴書の「学歴・職歴」欄に年表として出力する。id はクライアント側で edu_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_educations"."status" IS '卒業 / 中退 / 在学中 など。履歴書の卒業行に転記する。';

ALTER TABLE ONLY "public"."career_educations"
    ADD CONSTRAINT "career_educations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_educations"
    ADD CONSTRAINT "career_educations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_educations_user_id" ON "public"."career_educations" USING "btree" ("user_id");

-- ---------------------------------------------------------------------------
-- 6. career_certifications（資格・免許）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_certifications" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "issuer" "text" DEFAULT ''::"text" NOT NULL,
    "acquired_on" "date",
    "expires_on" "date",
    "score" "text" DEFAULT ''::"text" NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."career_certifications" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_certifications" IS '資格・免許。id はクライアント側で cert_<uuid> 形式を発行する。';

ALTER TABLE ONLY "public"."career_certifications"
    ADD CONSTRAINT "career_certifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_certifications"
    ADD CONSTRAINT "career_certifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_certifications_user_id" ON "public"."career_certifications" USING "btree" ("user_id");

-- ---------------------------------------------------------------------------
-- 7. career_highlights（職務要約・自己PR・志望動機など）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_highlights" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "is_default" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_highlights_kind_check" CHECK (("kind" = ANY (ARRAY['summary'::"text", 'self_pr'::"text", 'motivation'::"text", 'strength'::"text", 'future'::"text"])))
);

ALTER TABLE "public"."career_highlights" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_highlights" IS '職務要約・自己PR・志望動機などの文章ブロック。応募先ごとに書き分けられるよう種別ごとに複数持てる。id はクライアント側で pr_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_highlights"."is_default" IS '書類生成時に既定で使うブロック。種別ごとに 1 件を想定する。';

ALTER TABLE ONLY "public"."career_highlights"
    ADD CONSTRAINT "career_highlights_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_highlights"
    ADD CONSTRAINT "career_highlights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_highlights_user_id" ON "public"."career_highlights" USING "btree" ("user_id");

-- ---------------------------------------------------------------------------
-- 8. career_preferences（希望条件：業務内容 / 業務内容以外）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_preferences" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    -- 業務内容における希望条件
    "desired_job_titles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_roles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_industries" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_project_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "avoid_tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_phases" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_team_style" "text" DEFAULT ''::"text" NOT NULL,
    -- 業務内容以外の希望条件
    "income_floor" numeric,
    "desired_income_min" numeric,
    "desired_income_ideal" numeric DEFAULT 10000000 NOT NULL,
    "desired_locations" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "remote_preference" "text" DEFAULT 'any'::"text" NOT NULL,
    "max_commute_minutes" integer,
    "acceptable_overtime_hours" integer,
    "min_holidays" integer,
    "side_job_required" boolean DEFAULT false NOT NULL,
    "flextime_required" boolean DEFAULT false NOT NULL,
    "desired_benefits" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_company_sizes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "desired_employment_types" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    -- 優先順位
    "must_have_conditions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "nice_to_have_conditions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "deal_breakers" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "job_change_reason" "text" DEFAULT ''::"text" NOT NULL,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_preferences_remote_preference_check" CHECK (("remote_preference" = ANY (ARRAY['full_remote'::"text", 'hybrid'::"text", 'onsite'::"text", 'any'::"text"])))
);

ALTER TABLE "public"."career_preferences" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_preferences" IS '希望条件。業務内容の希望と業務内容以外（年収・勤務地・福利厚生）の希望をまとめて保持する。ユーザーごとに 1 行。id はクライアント側で pref_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_preferences"."income_floor" IS '提示されたら受ける最低ライン（円）。下回る求人はマッチ度計算で警告になる。';
COMMENT ON COLUMN "public"."career_preferences"."desired_income_ideal" IS '理想年収（円）。既定は 1000 万円。';
COMMENT ON COLUMN "public"."career_preferences"."must_have_conditions" IS '絶対条件。求人情報に含まれない条件は未充足として警告する。';

ALTER TABLE ONLY "public"."career_preferences"
    ADD CONSTRAINT "career_preferences_pkey" PRIMARY KEY ("id");

-- ユーザーごとに 1 行。upsert の onConflict 対象。
ALTER TABLE ONLY "public"."career_preferences"
    ADD CONSTRAINT "career_preferences_user_id_key" UNIQUE ("user_id");

ALTER TABLE ONLY "public"."career_preferences"
    ADD CONSTRAINT "career_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 9. career_applications（応募・選考管理）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_applications" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "job_title" "text" DEFAULT ''::"text" NOT NULL,
    "source" "text" DEFAULT ''::"text" NOT NULL,
    "agent_name" "text" DEFAULT ''::"text" NOT NULL,
    "status" "text" DEFAULT 'wishlist'::"text" NOT NULL,
    "applied_on" "date",
    "next_action" "text" DEFAULT ''::"text" NOT NULL,
    "next_action_on" "date",
    "income_range_min" numeric,
    "income_range_max" numeric,
    "offered_income" numeric,
    "job_url" "text" DEFAULT ''::"text" NOT NULL,
    "location" "text" DEFAULT ''::"text" NOT NULL,
    "remote_policy" "text" DEFAULT ''::"text" NOT NULL,
    "industry" "text" DEFAULT ''::"text" NOT NULL,
    "tech_stack" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "benefits" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "memo" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_applications_status_check" CHECK (("status" = ANY (ARRAY['wishlist'::"text", 'applied'::"text", 'document_screening'::"text", 'interview_1'::"text", 'interview_2'::"text", 'interview_final'::"text", 'offer'::"text", 'accepted'::"text", 'rejected'::"text", 'declined'::"text"]))),
    CONSTRAINT "career_applications_remote_policy_check" CHECK (("remote_policy" = ANY (ARRAY[''::"text", 'full_remote'::"text", 'hybrid'::"text", 'onsite'::"text", 'any'::"text"]))),
    CONSTRAINT "career_applications_income_range_check" CHECK (("income_range_min" IS NULL OR "income_range_max" IS NULL OR "income_range_max" >= "income_range_min"))
);

ALTER TABLE "public"."career_applications" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_applications" IS '応募・選考の管理。提示レンジと希望条件からマッチ度を算出する。id はクライアント側で app_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_applications"."income_range_max" IS '求人票の提示レンジ上限（円）。目標年収に届く求人の本数を数えるのに使う。';
COMMENT ON COLUMN "public"."career_applications"."offered_income" IS '実際のオファー年収（円）。';

ALTER TABLE ONLY "public"."career_applications"
    ADD CONSTRAINT "career_applications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_applications"
    ADD CONSTRAINT "career_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE INDEX "idx_career_applications_user_id" ON "public"."career_applications" USING "btree" ("user_id");

-- ---------------------------------------------------------------------------
-- 10. career_documents（生成した書類のスナップショット）
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."career_documents" (
    "id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "format" "text" DEFAULT 'markdown'::"text" NOT NULL,
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "application_id" "text",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "career_documents_kind_check" CHECK (("kind" = ANY (ARRAY['resume'::"text", 'career_history'::"text", 'skill_sheet'::"text"]))),
    CONSTRAINT "career_documents_format_check" CHECK (("format" = ANY (ARRAY['markdown'::"text", 'html'::"text", 'text'::"text"])))
);

ALTER TABLE "public"."career_documents" OWNER TO "postgres";

COMMENT ON TABLE "public"."career_documents" IS '生成した履歴書・職務経歴書・スキルシートのスナップショット。提出時点の内容を残す。id はクライアント側で doc_<uuid> 形式を発行する。';
COMMENT ON COLUMN "public"."career_documents"."application_id" IS '応募先ごとに書き分けた場合の紐づけ。応募先を削除しても書類は残す。';

ALTER TABLE ONLY "public"."career_documents"
    ADD CONSTRAINT "career_documents_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."career_documents"
    ADD CONSTRAINT "career_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."career_documents"
    ADD CONSTRAINT "career_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."career_applications"("id") ON DELETE SET NULL;

CREATE INDEX "idx_career_documents_user_id" ON "public"."career_documents" USING "btree" ("user_id");

-- ---------------------------------------------------------------------------
-- 権限
-- ---------------------------------------------------------------------------
GRANT ALL ON TABLE "public"."career_profiles" TO "anon";
GRANT ALL ON TABLE "public"."career_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."career_profiles" TO "service_role";

GRANT ALL ON TABLE "public"."career_skills" TO "anon";
GRANT ALL ON TABLE "public"."career_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."career_skills" TO "service_role";

GRANT ALL ON TABLE "public"."career_experiences" TO "anon";
GRANT ALL ON TABLE "public"."career_experiences" TO "authenticated";
GRANT ALL ON TABLE "public"."career_experiences" TO "service_role";

GRANT ALL ON TABLE "public"."career_projects" TO "anon";
GRANT ALL ON TABLE "public"."career_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."career_projects" TO "service_role";

GRANT ALL ON TABLE "public"."career_educations" TO "anon";
GRANT ALL ON TABLE "public"."career_educations" TO "authenticated";
GRANT ALL ON TABLE "public"."career_educations" TO "service_role";

GRANT ALL ON TABLE "public"."career_certifications" TO "anon";
GRANT ALL ON TABLE "public"."career_certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."career_certifications" TO "service_role";

GRANT ALL ON TABLE "public"."career_highlights" TO "anon";
GRANT ALL ON TABLE "public"."career_highlights" TO "authenticated";
GRANT ALL ON TABLE "public"."career_highlights" TO "service_role";

GRANT ALL ON TABLE "public"."career_preferences" TO "anon";
GRANT ALL ON TABLE "public"."career_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."career_preferences" TO "service_role";

GRANT ALL ON TABLE "public"."career_applications" TO "anon";
GRANT ALL ON TABLE "public"."career_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."career_applications" TO "service_role";

GRANT ALL ON TABLE "public"."career_documents" TO "anon";
GRANT ALL ON TABLE "public"."career_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."career_documents" TO "service_role";

-- ---------------------------------------------------------------------------
-- RLS（全テーブルで自分の行のみ）
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."career_profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_profiles_select_own" ON "public"."career_profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_profiles_insert_own" ON "public"."career_profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_profiles_update_own" ON "public"."career_profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_profiles_delete_own" ON "public"."career_profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_skills" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_skills_select_own" ON "public"."career_skills" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_skills_insert_own" ON "public"."career_skills" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_skills_update_own" ON "public"."career_skills" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_skills_delete_own" ON "public"."career_skills" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_experiences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_experiences_select_own" ON "public"."career_experiences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_experiences_insert_own" ON "public"."career_experiences" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_experiences_update_own" ON "public"."career_experiences" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_experiences_delete_own" ON "public"."career_experiences" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_projects" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_projects_select_own" ON "public"."career_projects" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_projects_insert_own" ON "public"."career_projects" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_projects_update_own" ON "public"."career_projects" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_projects_delete_own" ON "public"."career_projects" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_educations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_educations_select_own" ON "public"."career_educations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_educations_insert_own" ON "public"."career_educations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_educations_update_own" ON "public"."career_educations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_educations_delete_own" ON "public"."career_educations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_certifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_certifications_select_own" ON "public"."career_certifications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_certifications_insert_own" ON "public"."career_certifications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_certifications_update_own" ON "public"."career_certifications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_certifications_delete_own" ON "public"."career_certifications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_highlights" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_highlights_select_own" ON "public"."career_highlights" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_highlights_insert_own" ON "public"."career_highlights" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_highlights_update_own" ON "public"."career_highlights" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_highlights_delete_own" ON "public"."career_highlights" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_preferences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_preferences_select_own" ON "public"."career_preferences" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_preferences_insert_own" ON "public"."career_preferences" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_preferences_update_own" ON "public"."career_preferences" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_preferences_delete_own" ON "public"."career_preferences" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_applications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_applications_select_own" ON "public"."career_applications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_applications_insert_own" ON "public"."career_applications" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_applications_update_own" ON "public"."career_applications" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_applications_delete_own" ON "public"."career_applications" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

ALTER TABLE "public"."career_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career_documents_select_own" ON "public"."career_documents" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_documents_insert_own" ON "public"."career_documents" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_documents_update_own" ON "public"."career_documents" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
CREATE POLICY "career_documents_delete_own" ON "public"."career_documents" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
