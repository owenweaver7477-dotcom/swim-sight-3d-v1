import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { report_id } = await req.json();
  if (!report_id) return Response.json({ error: 'report_id required' }, { status: 400 });

  // Load report + findings
  const reports = await base44.entities.Report.filter({ id: report_id });
  const report = reports[0];
  if (!report) return Response.json({ error: 'Report not found' }, { status: 404 });
  if (report.is_deleted) return Response.json({ error: 'Report is deleted' }, { status: 404 });

  const findings = await base44.entities.Finding.filter({ report_id }, '-created_date', 100);
  const aiFinding = findings.filter(f => f.source === 'ai');

  if (!aiFinding.length) {
    return Response.json({ error: 'No AI findings to compare' }, { status: 400 });
  }

  // Classify each finding
  const approved = [];
  const edited = [];
  const rejected = [];

  for (const f of aiFinding) {
    if (f.approval_status === 'rejected') {
      rejected.push(f);
      continue;
    }
    if (f.approval_status !== 'approved') continue;

    // Compare coach fields vs originals (fallback: use current as original if missing)
    const origName    = f.original_finding_name  || f.finding_name;
    const origCue     = f.original_cue            || f.cue;
    const origSev     = f.original_severity       || f.severity;
    const origPhase   = f.original_phase          || f.phase;
    const origDrill   = f.original_drill          || f.drill;
    const origFocus   = f.original_next_focus     || f.next_focus;

    const wasEdited =
      (f.finding_name   !== origName  && f.finding_name)  ||
      (f.cue            !== origCue   && f.cue)           ||
      (f.severity       !== origSev   && f.severity)      ||
      (f.phase          !== origPhase && f.phase)         ||
      (f.drill          !== origDrill && f.drill && origDrill) ||
      (f.next_focus     !== origFocus && f.next_focus && origFocus);

    if (wasEdited) {
      edited.push({ finding: f, origName, origCue, origSev, origPhase, origDrill, origFocus });
    } else {
      approved.push(f);
    }
  }

  const total = aiFinding.length;
  const acceptanceRate = total > 0 ? Math.round(((approved.length + edited.length) / total) * 100) : 0;
  const strokeType = report.title?.match(/(Freestyle|Backstroke|Breaststroke|Butterfly|IM)/i)?.[1] || 'swimming';

  // Build plain-English summary via LLM
  const approvedNames   = approved.map(f => f.finding_name).join(', ') || 'none';
  const editedSummary   = edited.map(e =>
    `"${e.origName}" — coach changed cue from "${e.origCue || 'not set'}" to "${e.finding.cue || 'not set'}"`
  ).join('; ') || 'none';
  const rejectedNames   = rejected.map(f => f.original_finding_name || f.finding_name).join(', ') || 'none';
  const finalFocus      = approved.concat(edited.map(e => e.finding)).map(f => f.next_focus).filter(Boolean).slice(0, 3).join('; ');

  const prompt = `You are a professional swim coach assistant writing a concise coach feedback comparison summary.

Report: ${report.title || 'AI Technique Report'}
Stroke / context: ${strokeType}
AI acceptance rate: ${acceptanceRate}% (${approved.length + edited.length} of ${total} findings accepted)

Approved unchanged (${approved.length}): ${approvedNames}
Edited by coach (${edited.length}): ${editedSummary}
Rejected/dismissed (${rejected.length}): ${rejectedNames}
Final coaching focus points: ${finalFocus || 'not specified'}

Write a 3-5 sentence plain-English paragraph summarising:
1. What the AI got right (approved findings)
2. What the coach changed and why it likely matters
3. What the coach rejected and what that implies about priorities
4. What the final coaching priority is for this swimmer
5. What this means for the swimmer's next training focus

Keep it factual and honest. Do NOT claim the AI has learned from this or will improve automatically.
Use wording like "coach feedback summary" and "comparison between AI suggestions and coach-approved report".
Write in third person (e.g. "The coach approved..."). Be concise — max 5 sentences.`;

  const summaryRes = await base44.integrations.Core.InvokeLLM({ prompt });
  const summary = typeof summaryRes === 'string' ? summaryRes : summaryRes?.text || summaryRes?.content || String(summaryRes);

  // Save to report
  await base44.entities.Report.update(report_id, {
    coach_feedback_summary: summary,
    coach_feedback_generated_at: new Date().toISOString(),
  });

  return Response.json({
    summary,
    stats: {
      total_ai_findings: total,
      approved_unchanged: approved.length,
      edited_by_coach: edited.length,
      rejected_by_coach: rejected.length,
      ai_acceptance_rate: acceptanceRate,
    },
  });
});