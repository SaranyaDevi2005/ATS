import db from '../db/database.js';
import { toCamelCase, ALLOWED_STAGES, FUNNEL_STAGES } from '../utils/caseConverter.js';

/**
 * GET /api/dashboard
 * Aggregated analytics for ATS overview
 */
export function getDashboard(req, res, next) {
  try {
    // 1. Total candidates
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM candidates').get();
    const totalCandidates = totalRow ? totalRow.count : 0;

    // 2. Count per stage (map all allowed stages, defaulting to 0)
    const stageCounts = db.prepare('SELECT stage, COUNT(*) as count FROM candidates GROUP BY stage').all();
    const countPerStage = {};
    for (const stage of ALLOWED_STAGES) {
      countPerStage[stage] = 0;
    }
    for (const row of stageCounts) {
      countPerStage[row.stage] = row.count;
    }

    // 3. Candidates added in the last 7 days
    const last7DaysRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM candidates 
      WHERE created_at >= datetime('now', '-7 days')
    `).get();
    const candidatesAddedLast7Days = last7DaysRow ? last7DaysRow.count : 0;

    // 4. Hired count and Rejected count
    const hiredCount = countPerStage['HIRED'] || 0;
    const rejectedCount = countPerStage['REJECTED'] || 0;

    // 5. Conversion funnel percentages between stages:
    // Standard funnel: APPLIED -> SCREENING -> INTERVIEW -> OFFER -> HIRED
    // Calculate unique candidates who have reached each stage (either currently or historically)
    const funnelCounts = {};
    for (const stage of FUNNEL_STAGES) {
      const reachedRow = db.prepare(`
        SELECT COUNT(DISTINCT candidate_id) as count 
        FROM (
          SELECT id as candidate_id FROM candidates WHERE stage = ?
          UNION
          SELECT candidate_id FROM stage_history WHERE to_stage = ?
        )
      `).get(stage, stage);

      funnelCounts[stage] = reachedRow ? reachedRow.count : 0;
    }

    // Fallback: If a candidate started directly at APPLIED, ensure APPLIED count is at least totalCandidates
    if (funnelCounts['APPLIED'] < totalCandidates) {
      funnelCounts['APPLIED'] = totalCandidates;
    }

    const funnelStagesData = [];
    let previousCount = null;

    for (const stage of FUNNEL_STAGES) {
      const count = funnelCounts[stage] || 0;
      let conversionFromPrevious = 100;

      if (previousCount !== null) {
        conversionFromPrevious = previousCount > 0 
          ? Math.round((count / previousCount) * 1000) / 10 
          : 0;
      }

      const conversionFromTop = funnelCounts['APPLIED'] > 0
        ? Math.round((count / funnelCounts['APPLIED']) * 1000) / 10
        : 0;

      funnelStagesData.push({
        stage,
        count,
        conversionFromPrevious: `${conversionFromPrevious}%`,
        conversionFromTop: `${conversionFromTop}%`,
      });

      previousCount = count;
    }

    const overallConversion = funnelCounts['APPLIED'] > 0
      ? Math.round(((funnelCounts['HIRED'] || 0) / funnelCounts['APPLIED']) * 1000) / 10
      : 0;

    const conversionFunnel = {
      stages: funnelStagesData,
      overallHiredRate: `${overallConversion}%`,
    };

    // 6. Count per position
    const positionRows = db.prepare(`
      SELECT position, COUNT(*) as count 
      FROM candidates 
      GROUP BY position 
      ORDER BY count DESC
    `).all();

    // 7. Count per source
    const sourceRows = db.prepare(`
      SELECT source, COUNT(*) as count 
      FROM candidates 
      GROUP BY source 
      ORDER BY count DESC
    `).all();

    // 8. Latest 5 candidates
    const latestRows = db.prepare(`
      SELECT * FROM candidates 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    res.json({
      totalCandidates,
      countPerStage,
      candidatesAddedLast7Days,
      hiredCount,
      rejectedCount,
      conversionFunnel,
      countPerPosition: toCamelCase(positionRows),
      countPerSource: toCamelCase(sourceRows),
      latestCandidates: toCamelCase(latestRows),
    });
  } catch (err) {
    next(err);
  }
}
