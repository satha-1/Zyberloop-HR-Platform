/**
 * Performance Management seed for 2026 Q1
 * Run: npx tsx src/modules/performance/performance.seed.ts
 */
import { connectDatabase } from '../../database/connection';
import { Employee } from '../employees/employee.model';
import {
  PerformanceCycle, Goal, RatingFormulaConfig, MeritMatrix,
  Appraisal, Feedback360Template, Feedback360Assignment, Feedback360Response, BiasFlag
} from './performance.model';
import { hashToken } from './performance.service';
import { User } from '../users/user.model';

async function seedPerformance() {
  await connectDatabase();

  // Find admin user for createdBy
  const admin = await User.findOne({ roles: { $in: ['ADMIN', 'HR_ADMIN'] } }).lean();
  const adminId = admin?._id ?? new (require('mongoose').Types.ObjectId)();

  // â”€â”€â”€ 1. Cycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let cycle = await PerformanceCycle.findOne({ name: '2026 Q1' });
  if (!cycle) {
    cycle = await PerformanceCycle.create({
      name: '2026 Q1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      status: 'ACTIVE',
      createdBy: adminId,
    });
    console.log('âœ… Created cycle: 2026 Q1');
  } else { console.log('â­ï¸  Cycle 2026 Q1 already exists'); }

  // â”€â”€â”€ 2. Rating Formula â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const existingFormula = await RatingFormulaConfig.findOne({ cycleId: cycle._id });
  if (!existingFormula) {
    await RatingFormulaConfig.create({
      cycleId: cycle._id,
      managerWeight: 0.5,
      okrWeight: 0.3,
      peerWeight: 0.2,
      scale: 5,
      okrMapping: { type: 'LINEAR', minPct: 0, maxPct: 100 },
      versionNumber: 1,
    });
    console.log('âœ… Created rating formula (0.5/0.3/0.2)');
  } else { console.log('â­ï¸  Rating formula already exists'); }

  // â”€â”€â”€ 3. Merit Matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const existingMatrix = await MeritMatrix.findOne({ cycleId: cycle._id });
  if (!existingMatrix) {
    await MeritMatrix.create({
      cycleId: cycle._id,
      bands: [
        { name: 'Exceeds', minRating: 4.5, maxRating: 5.0, minIncreasePct: 8, maxIncreasePct: 12 },
        { name: 'Meets', minRating: 3.5, maxRating: 4.49, minIncreasePct: 3, maxIncreasePct: 7 },
        { name: 'Below', minRating: 0, maxRating: 3.49, minIncreasePct: 0, maxIncreasePct: 2 },
      ],
      approvalChain: ['Manager', 'HRBP', 'Comp Committee', 'Finance'],
    });
    console.log('âœ… Created merit matrix');
  } else { console.log('â­ï¸  Merit matrix already exists'); }

  // â”€â”€â”€ 4. Find target employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sarah = await Employee.findOne({ email: 'sarah.johnson@company.com' });
  const michael = await Employee.findOne({ email: 'michael.chen@company.com' });
  const emily = await Employee.findOne({ email: 'emily.rodriguez@company.com' });

  if (!sarah || !michael || !emily) {
    console.warn('âš ï¸  One or more seed employees not found. Run main seed first (npm run seed).');
    process.exit(0);
  }

  // â”€â”€â”€ 5. Team Goals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const teamGoalsData = [
    { title: 'Q1 Revenue Target', description: 'Achieve $2M revenue in Q1 2026', weight: 40, status: 'ON_TRACK' },
    { title: 'Product Launch', description: 'Launch v2.0 by end of Q1', weight: 30, status: 'ON_TRACK' },
    { title: 'Customer Satisfaction', description: 'Achieve NPS > 60', weight: 30, status: 'AHEAD' },
  ];

  const teamGoals: any[] = [];
  for (const tg of teamGoalsData) {
    const existing = await Goal.findOne({ cycleId: cycle._id, title: tg.title, ownerType: 'TEAM' });
    if (!existing) {
      const g = await Goal.create({
        cycleId: cycle._id,
        title: tg.title,
        description: tg.description,
        ownerType: 'TEAM',
        ownerId: adminId,
        weight: tg.weight,
        progress: tg.status === 'AHEAD' ? 92 : tg.title.includes('Revenue') ? 85 : 65,
        status: tg.status,
        isSuggested: false,
        suggestionStatus: 'ACCEPTED',
        createdBy: adminId,
      });
      teamGoals.push(g);
    } else { teamGoals.push(existing); }
  }
  console.log('âœ… Team goals ready');

  // â”€â”€â”€ 6. Individual Goals for 3 employees â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const empGoalsData = [
    { emp: sarah, parentIdx: 0, title: 'Deliver API integration module', weight: 40, progress: 85, status: 'ON_TRACK' },
    { emp: sarah, parentIdx: 1, title: 'Complete product v2 features', weight: 35, progress: 65, status: 'ON_TRACK' },
    { emp: sarah, parentIdx: 2, title: 'Resolve customer-reported bugs', weight: 25, progress: 92, status: 'AHEAD' },
    { emp: michael, parentIdx: 0, title: 'Implement HR analytics dashboard', weight: 40, progress: 70, status: 'ON_TRACK' },
    { emp: michael, parentIdx: 1, title: 'Recruitment process optimization', weight: 35, progress: 60, status: 'AT_RISK' },
    { emp: michael, parentIdx: 2, title: 'Employee engagement score', weight: 25, progress: 80, status: 'ON_TRACK' },
    { emp: emily, parentIdx: 0, title: 'Drive Q1 marketing campaign ROI', weight: 40, progress: 95, status: 'AHEAD' },
    { emp: emily, parentIdx: 1, title: 'Launch product v2 campaign', weight: 35, progress: 90, status: 'AHEAD' },
    { emp: emily, parentIdx: 2, title: 'Social media NPS growth', weight: 25, progress: 95, status: 'AHEAD' },
  ];

  for (const gd of empGoalsData) {
    const existing = await Goal.findOne({ cycleId: cycle._id, title: gd.title, ownerId: gd.emp._id });
    if (!existing) {
      await Goal.create({
        cycleId: cycle._id,
        title: gd.title,
        ownerType: 'INDIVIDUAL',
        ownerId: gd.emp._id,
        weight: gd.weight,
        progress: gd.progress,
        status: gd.status,
        parentGoalId: teamGoals[gd.parentIdx]?._id,
        isSuggested: false,
        suggestionStatus: 'ACCEPTED',
        createdBy: adminId,
      });
    }
  }
  console.log('âœ… Individual goals ready');

  // â”€â”€â”€ 7. Appraisals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const appraisalData = [
    { emp: sarah, managerScore: 4.5, okrPct: 85, peerScore: 4.2, status: 'COMPLETED' },
    { emp: michael, managerScore: 4.0, okrPct: 75, peerScore: 4.0, status: 'IN_PROGRESS' },
    { emp: emily, managerScore: 4.8, okrPct: 95, peerScore: 4.5, status: 'COMPLETED' },
  ];

  for (const ad of appraisalData) {
    const existing = await Appraisal.findOne({ cycleId: cycle._id, employeeId: ad.emp._id });
    const okrScore = (ad.okrPct / 100) * 5;
    const finalRating = Math.round((0.5 * ad.managerScore + 0.3 * okrScore + 0.2 * ad.peerScore) * 100) / 100;
    if (!existing) {
      await Appraisal.create({
        cycleId: cycle._id,
        employeeId: ad.emp._id,
        managerId: (ad.emp as any).managerId,
        status: ad.status,
        managerScore: ad.managerScore,
        okrAchievementPct: ad.okrPct,
        peerFeedbackScore: ad.peerScore,
        finalRating,
        formulaVersionNumber: 1,
        selfAssessmentText: `Self-assessment for ${(ad.emp as any).firstName}`,
        managerAssessmentText: `Manager assessment for ${(ad.emp as any).firstName}`,
        approvals: [
          { stepName: 'Manager', status: ad.status === 'COMPLETED' ? 'APPROVED' : 'PENDING' },
          { stepName: 'HRBP', status: ad.status === 'COMPLETED' ? 'APPROVED' : 'PENDING' },
          { stepName: 'Comp Committee', status: 'PENDING' },
          { stepName: 'Finance', status: 'PENDING' },
        ],
      });
    } else {
      await Appraisal.findByIdAndUpdate(existing._id, {
        managerScore: ad.managerScore,
        okrAchievementPct: ad.okrPct,
        peerFeedbackScore: ad.peerScore,
        finalRating,
        status: ad.status,
      });
    }
  }
  console.log('âœ… Appraisals ready (Sarah: 4.4, Michael: 3.9, Emily: 4.7)');

  // â”€â”€â”€ 8. 360 Template â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let template = await Feedback360Template.findOne({ name: 'Standard 360 Feedback Q1' });
  if (!template) {
    template = await Feedback360Template.create({
      name: 'Standard 360 Feedback Q1',
      cycleId: cycle._id,
      reusable: false,
      sections: [
        {
          title: 'Performance',
          questions: [
            { id: 'q1', type: 'LIKERT', prompt: 'Delivers results consistently', required: true, scaleMin: 1, scaleMax: 5 },
            { id: 'q2', type: 'LIKERT', prompt: 'Meets commitments and deadlines', required: true, scaleMin: 1, scaleMax: 5 },
          ],
        },
        {
          title: 'Collaboration',
          questions: [
            { id: 'q3', type: 'LIKERT', prompt: 'Works effectively with team members', required: true, scaleMin: 1, scaleMax: 5 },
            { id: 'q4', type: 'TEXT', prompt: 'What could this person do differently to be more effective?', required: false },
          ],
        },
      ],
      settings: { anonymous: true, minResponsesToShow: 3 },
    });
    console.log('âœ… Created 360 template');
  } else { console.log('â­ï¸  360 template already exists'); }

  // â”€â”€â”€ 9. 360 Assignments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const assignData = [
    { emp: sarah, required: 7, collected: 5 },    // 71%
    { emp: michael, required: 6, collected: 3 },  // 50%
    { emp: emily, required: 6, collected: 4 },    // 67%
  ];

  for (const ad of assignData) {
    const existing = await Feedback360Assignment.findOne({ cycleId: cycle._id, targetEmployeeId: ad.emp._id });
    if (!existing) {
      const raters = [];
      for (let i = 0; i < ad.required; i++) {
        const tok = `seed-token-${ad.emp._id}-${i}-${Date.now()}`;
        raters.push({
          name: i === 0 ? `${(ad.emp as any).firstName} ${(ad.emp as any).lastName}` : `Rater ${i}`,
          email: i === 0 ? (ad.emp as any).email : `rater${i}@company.com`,
          roleType: i === 0 ? 'SELF' : i === 1 ? 'MANAGER' : 'PEER',
          tokenHash: hashToken(tok),
          status: i < ad.collected ? 'SUBMITTED' : 'SENT',
          submittedAt: i < ad.collected ? new Date() : undefined,
        });
      }
      const assignment = await Feedback360Assignment.create({
        cycleId: cycle._id,
        templateId: template._id,
        targetEmployeeId: ad.emp._id,
        requiredResponsesCount: ad.required,
        deadlineAt: new Date('2026-03-31'),
        status: ad.collected >= ad.required ? 'COMPLETED' : 'IN_PROGRESS',
        raters,
        collectedResponsesCount: ad.collected,
      });

      // Seed a few responses
      for (let i = 0; i < ad.collected; i++) {
        const raterTok = raters[i]?.tokenHash;
        if (raterTok) {
          await Feedback360Response.create({
            assignmentId: assignment._id,
            raterTokenHash: raterTok,
            answers: [
              { questionId: 'q1', value: String(3 + Math.floor(Math.random() * 3)) },
              { questionId: 'q2', value: String(3 + Math.floor(Math.random() * 3)) },
              { questionId: 'q3', value: String(3 + Math.floor(Math.random() * 3)) },
              { questionId: 'q4', value: 'Great communicator and team player.' },
            ],
            status: 'SUBMITTED',
            submittedAt: new Date(),
          });
        }
      }
    } else { console.log(`â­ï¸  360 assignment for ${(ad.emp as any).firstName} already exists`); }
  }
  console.log('âœ… 360 assignments seeded (Sarah 71%, Michael 50%, Emily 67%)');

  // â”€â”€â”€ 10. Bias Flags â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const existingFlag = await BiasFlag.findOne({ cycleId: cycle._id });
  if (!existingFlag) {
    await BiasFlag.create({
      cycleId: cycle._id,
      type: 'MANAGER_OUTLIER',
      subjectId: michael._id.toString(),
      metricName: 'avg_final_rating',
      metricValue: 2.8,
      threshold: 0.8,
      comparisonBaseline: 4.2,
      status: 'OPEN',
      notes: 'Manager average rating significantly below org average',
    });
    console.log('âœ… Created bias flag (MANAGER_OUTLIER - OPEN)');
  } else { console.log('â­ï¸  Bias flags already exist'); }

  console.log('\nðŸŽ‰ Performance seed complete for 2026 Q1!');
  process.exit(0);
}

seedPerformance().catch((e) => { console.error(e); process.exit(1); });
