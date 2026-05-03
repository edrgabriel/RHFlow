-- Adiciona os novos campos de personalização de vagas
ALTER TABLE "RecruitmentLink" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "RecruitmentLink" ADD COLUMN IF NOT EXISTS "salaryInfo" TEXT;
ALTER TABLE "RecruitmentLink" ADD COLUMN IF NOT EXISTS "customQuestions" TEXT;

-- Adiciona o campo de respostas personalizadas no candidato
ALTER TABLE "PreCandidate" ADD COLUMN IF NOT EXISTS "customAnswers" TEXT;
