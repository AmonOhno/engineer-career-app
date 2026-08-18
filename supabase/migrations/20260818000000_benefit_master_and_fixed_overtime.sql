-- 福利厚生の一般的な項目のマスタ選択列と、みなし残業（固定残業代）の項目を追加する。
--
-- 自由記述（desired_benefits / benefits）は「マスタに無い項目」として残す。
-- 既存の自由記述はアプリ側の正規化（lib/masters/benefits.ts の toBenefitCode）で
-- マスタコードに寄せて比較するため、データ移行は行わない。
--
-- マスタのコード一覧は src/types/career.ts の BenefitCode を正とする。
-- 追加時に DB 側の制約更新が必要にならないよう、列は text[] で持つ。

-- ---------------------------------------------------------------------------
-- career_preferences（希望条件）
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."career_preferences"
    ADD COLUMN IF NOT EXISTS "desired_benefit_codes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    ADD COLUMN IF NOT EXISTS "allow_fixed_overtime" boolean DEFAULT true NOT NULL,
    ADD COLUMN IF NOT EXISTS "max_fixed_overtime_hours" integer,
    ADD COLUMN IF NOT EXISTS "require_overtime_pay_beyond_fixed" boolean DEFAULT false NOT NULL;

ALTER TABLE "public"."career_preferences"
    DROP CONSTRAINT IF EXISTS "career_preferences_max_fixed_overtime_hours_check";
ALTER TABLE "public"."career_preferences"
    ADD CONSTRAINT "career_preferences_max_fixed_overtime_hours_check"
    CHECK (("max_fixed_overtime_hours" IS NULL OR "max_fixed_overtime_hours" >= 0));

COMMENT ON COLUMN "public"."career_preferences"."desired_benefit_codes" IS '希望する福利厚生（マスタのコード）。ラベルと分類は lib/masters/benefits.ts。';
COMMENT ON COLUMN "public"."career_preferences"."desired_benefits" IS '希望する福利厚生のうち、マスタに無いもの（自由記述）。';
COMMENT ON COLUMN "public"."career_preferences"."allow_fixed_overtime" IS 'みなし残業ありの求人も受け入れるか。false の求人はマッチ度 0 + 未充足条件として警告する。';
COMMENT ON COLUMN "public"."career_preferences"."max_fixed_overtime_hours" IS '許容できるみなし残業時間（月/時間）。超える求人は未充足条件として警告する。';
COMMENT ON COLUMN "public"."career_preferences"."require_overtime_pay_beyond_fixed" IS 'みなし残業の超過分が別途支給されることを必須とするか。';

-- ---------------------------------------------------------------------------
-- career_applications（応募・選考管理）
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."career_applications"
    ADD COLUMN IF NOT EXISTS "benefit_codes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    ADD COLUMN IF NOT EXISTS "fixed_overtime_type" "text" DEFAULT 'unknown'::"text" NOT NULL,
    ADD COLUMN IF NOT EXISTS "fixed_overtime_hours" integer,
    ADD COLUMN IF NOT EXISTS "fixed_overtime_allowance" numeric,
    ADD COLUMN IF NOT EXISTS "overtime_pay_beyond_fixed" boolean DEFAULT false NOT NULL;

ALTER TABLE "public"."career_applications"
    DROP CONSTRAINT IF EXISTS "career_applications_fixed_overtime_type_check";
ALTER TABLE "public"."career_applications"
    ADD CONSTRAINT "career_applications_fixed_overtime_type_check"
    CHECK (("fixed_overtime_type" = ANY (ARRAY['unknown'::"text", 'none'::"text", 'included'::"text"])));

ALTER TABLE "public"."career_applications"
    DROP CONSTRAINT IF EXISTS "career_applications_fixed_overtime_hours_check";
ALTER TABLE "public"."career_applications"
    ADD CONSTRAINT "career_applications_fixed_overtime_hours_check"
    CHECK (("fixed_overtime_hours" IS NULL OR "fixed_overtime_hours" >= 0));

ALTER TABLE "public"."career_applications"
    DROP CONSTRAINT IF EXISTS "career_applications_fixed_overtime_allowance_check";
ALTER TABLE "public"."career_applications"
    ADD CONSTRAINT "career_applications_fixed_overtime_allowance_check"
    CHECK (("fixed_overtime_allowance" IS NULL OR "fixed_overtime_allowance" >= (0)::numeric));

COMMENT ON COLUMN "public"."career_applications"."benefit_codes" IS '求人票に記載された福利厚生（マスタのコード）。';
COMMENT ON COLUMN "public"."career_applications"."benefits" IS '求人票に記載された福利厚生のうち、マスタに無いもの（自由記述）。';
COMMENT ON COLUMN "public"."career_applications"."fixed_overtime_type" IS 'みなし残業の有無。unknown: 未確認 / none: なし / included: あり（固定残業代込み）。';
COMMENT ON COLUMN "public"."career_applications"."fixed_overtime_hours" IS 'みなし残業時間（月/時間）。';
COMMENT ON COLUMN "public"."career_applications"."fixed_overtime_allowance" IS '固定残業代（円/月）。';
COMMENT ON COLUMN "public"."career_applications"."overtime_pay_beyond_fixed" IS 'みなし残業を超えた分が別途支給されるか。';
