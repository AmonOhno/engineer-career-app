/**
 * ダッシュボード。年収 1000 万円という目標に対する現在地を 1 画面で示す。
 * - 目標との差額と、到達に必要な転職回数の目安
 * - 高年収レンジで評価される 6 軸のスコアと次の打ち手
 * - 応募パイプラインの提示年収
 * - 書類の充足度
 */

import { useMemo } from 'react';
import { useCareerStore, useCareerDataset } from '../stores/careerStore';
import {
  RAISE_RATE,
  computeIncomeGap,
  summarizePipeline,
} from '../lib/compensation';
import { evaluateMarketValue } from '../lib/marketValue';
import { evaluateOverallCompleteness } from '../lib/completeness';
import { buildNegotiationDraft } from '../lib/drafts';
import { formatManYen } from '../lib/format';
import { DEFAULT_TARGET_INCOME } from '../types/career';
import { copyToClipboard } from '../lib/download';
import { Button, Card, EmptyState, ScoreBar, Stat } from './ui';

export const Dashboard = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const dataset = useCareerDataset();
  const applications = useCareerStore((s) => s.applications);

  const targetIncome = dataset.profile?.targetAnnualIncome ?? DEFAULT_TARGET_INCOME;

  const gap = useMemo(
    () => computeIncomeGap(dataset.profile?.currentAnnualIncome, targetIncome),
    [dataset.profile?.currentAnnualIncome, targetIncome]
  );
  const marketValue = useMemo(() => evaluateMarketValue(dataset), [dataset]);
  const completeness = useMemo(
    () => evaluateOverallCompleteness(dataset),
    [dataset]
  );
  const pipeline = useMemo(
    () => summarizePipeline(applications, targetIncome),
    [applications, targetIncome]
  );

  const negotiationDraft = useMemo(
    () => buildNegotiationDraft(dataset, targetIncome),
    [dataset, targetIncome]
  );

  return (
    <>
      <Card
        title="年収ギャップ"
        description="目標との差が、そのまま次の転職で埋めるべき幅になる。"
      >
        <div className="stats">
          <Stat label="現年収" value={formatManYen(gap.currentIncome)} />
          <Stat label="目標年収" value={formatManYen(gap.targetIncome)} />
          <Stat
            label="残りの差額"
            value={formatManYen(gap.gapYen)}
            tone={gap.achieved ? 'good' : gap.gapYen > 3_000_000 ? 'bad' : 'warn'}
            sub={
              gap.requiredRaiseRate != null
                ? `必要な上げ幅 +${Math.round(gap.requiredRaiseRate * 100)}%`
                : '現年収を登録すると算出される'
            }
          />
          <Stat
            label="到達率"
            value={
              gap.achievementRate != null
                ? `${Math.round(gap.achievementRate * 100)}%`
                : '—'
            }
          />
        </div>

        {gap.achievementRate != null && (
          <ScoreBar score={Math.round(gap.achievementRate * 100)} />
        )}

        {gap.achieved ? (
          <p className="callout callout--ok">
            目標年収に到達済み。次は目標額の見直しか、条件面（裁量・リモート・
            ストックオプション）での上積みを狙う段階。
          </p>
        ) : (
          <div className="callout">
            <strong>到達までの目安</strong>
            <ul>
              <li>
                1 回の転職で +{Math.round(RAISE_RATE.conservative * 100)}% の場合:{' '}
                {gap.jobChangesConservative != null
                  ? `あと ${gap.jobChangesConservative} 回`
                  : '現年収を登録すると算出される'}
              </li>
              <li>
                1 回の転職で +{Math.round(RAISE_RATE.aggressive * 100)}% の場合:{' '}
                {gap.jobChangesAggressive != null
                  ? `あと ${gap.jobChangesAggressive} 回`
                  : '現年収を登録すると算出される'}
              </li>
            </ul>
            <p>
              1 回で届かない場合は、次の転職を「年収を最大化する転職」ではなく
              「1000 万円レンジに乗る経験を取りに行く転職」として設計する。
            </p>
          </div>
        )}
      </Card>

      <Card
        title="1000 万円レンジ到達力"
        description="高年収帯の求人で共通して見られる 6 軸を、登録済みデータから採点している。"
        actions={
          <span className="score-badge">{marketValue.totalScore}<small>/100</small></span>
        }
      >
        <div className="axes">
          {marketValue.axes.map((axis) => (
            <div key={axis.id} className="axis">
              <div className="axis__head">
                <span className="axis__label">{axis.label}</span>
                <span className="axis__score">{axis.score}</span>
              </div>
              <ScoreBar score={axis.score} />
              <span className="axis__evidence">{axis.evidence}</span>
            </div>
          ))}
        </div>

        {marketValue.actions.length > 0 && (
          <div className="callout">
            <strong>次に効く打ち手（効果の大きい順）</strong>
            <ol>
              {marketValue.actions.slice(0, 3).map((action) => (
                <li key={action.axis}>
                  <b>{action.axis}</b>: {action.advice}
                </li>
              ))}
            </ol>
          </div>
        )}

        {marketValue.uncoveredDomains.length > 0 && (
          <p className="record__meta">
            未カバーの高単価ドメイン: {marketValue.uncoveredDomains.join(' / ')}
          </p>
        )}
      </Card>

      <Card
        title="応募パイプライン"
        description="目標年収に届く求人がどれだけ動いているか。"
        actions={
          <Button variant="ghost" onClick={() => onNavigate('applications')}>
            応募管理へ
          </Button>
        }
      >
        {applications.length === 0 ? (
          <EmptyState message="応募先が未登録。まずは提示レンジの分かる求人を 3 件入れてみる。" />
        ) : (
          <div className="stats">
            <Stat label="選考中" value={`${pipeline.activeCount} 件`} />
            <Stat
              label="目標年収に届く求人"
              value={`${pipeline.reachingTargetCount} 件`}
              tone={pipeline.reachingTargetCount > 0 ? 'good' : 'warn'}
            />
            <Stat
              label="提示レンジ上限の最高"
              value={formatManYen(pipeline.bestPotentialIncome)}
            />
            <Stat
              label="オファー最高額"
              value={formatManYen(pipeline.bestOfferedIncome)}
              tone={
                pipeline.bestOfferedIncome != null &&
                pipeline.bestOfferedIncome >= targetIncome
                  ? 'good'
                  : undefined
              }
            />
          </div>
        )}
      </Card>

      <Card
        title="書類の準備状況"
        description="必須項目が埋まっていない書類は生成しても使えない。"
        actions={
          <Button variant="ghost" onClick={() => onNavigate('documents')}>
            書類生成へ
          </Button>
        }
      >
        <div className="stats">
          <Stat
            label="必須項目の充足度"
            value={`${completeness.score}%`}
            tone={completeness.ready ? 'good' : 'warn'}
          />
          <Stat label="登録スキル" value={`${dataset.skills.length} 件`} />
          <Stat label="登録プロジェクト" value={`${dataset.projects.length} 件`} />
          <Stat label="職歴" value={`${dataset.experiences.length} 社`} />
        </div>
        {completeness.missingRequired.length > 0 && (
          <div className="callout">
            <strong>未入力の必須項目</strong>
            <ul>
              {completeness.missingRequired.slice(0, 6).map((item) => (
                <li key={item.label}>
                  {item.label}{' '}
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => onNavigate(item.section)}
                  >
                    入力する
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card
        title="年収交渉の下書き"
        description="面談で希望年収を聞かれたときの型。登録済みの定量成果から組み立てている。"
        actions={
          <Button variant="ghost" onClick={() => copyToClipboard(negotiationDraft)}>
            コピー
          </Button>
        }
      >
        <pre className="preview preview--compact">{negotiationDraft}</pre>
      </Card>
    </>
  );
};
