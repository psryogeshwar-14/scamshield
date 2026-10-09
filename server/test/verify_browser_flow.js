import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prismaClient.js';

async function verifyBrowserFlow() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('🧪 SCAMSHIELD END-TO-END BROWSER / API USER FLOW VERIFICATION');
  console.log('════════════════════════════════════════════════════════════');

  let testRecordId = null;

  try {
    // Step 1: Client performs initial health check & service discovery
    console.log('\n[Flow Step 1] Initial App Discovery & Health Check:');
    const healthRes = await request(app).get('/api/health');
    console.log(`  -> Status: ${healthRes.status} OK`);
    console.log(`  -> Service: ${healthRes.body.data.service}`);
    console.log(`  -> Correlation ID: ${healthRes.headers['x-request-id']}`);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    // Step 2: User pastes phishing URL on HomePage and submits
    console.log('\n[Flow Step 2] User Submits Suspicious URL for Analysis:');
    const targetUrl = 'http://secure-paypal-verify.login-update.xyz';
    console.log(`  -> Target: "${targetUrl}"`);
    const analyzeRes = await request(app)
      .post('/api/analyze/url')
      .send({ url: targetUrl });

    console.log(`  -> Status: ${analyzeRes.status} OK`);
    console.log(`  -> Threat Assessment ID: ${analyzeRes.body.data.id}`);
    console.log(`  -> Classification: ${analyzeRes.body.data.riskLevel.toUpperCase()}`);
    console.log(`  -> Threat Category: ${analyzeRes.body.data.threatType}`);
    console.log(`  -> Heuristics Flagged: ${analyzeRes.body.data.whyThisResult.deterministicChecks.findings.join(', ')}`);
    console.log(`  -> Actionable Steps Generated: ${analyzeRes.body.data.safetySteps?.length || 0}`);

    testRecordId = analyzeRes.body.data.id;
    if (!testRecordId || analyzeRes.body.data.riskLevel !== 'high_risk') {
      throw new Error('Analysis response missing or inaccurate');
    }

    // Step 3: User views Result Page & completes first checklist mitigation item
    console.log('\n[Flow Step 3] User Navigates to Result Page & Toggles Action Step:');
    const recordRes = await request(app).get(`/api/history/${testRecordId}`);
    const recs = recordRes.body.data.safetyRecommendations || [];
    console.log(`  -> Loaded ${recs.length} actionable safety recommendations`);
    const firstRec = recs[0];
    console.log(`  -> First action: "${firstRec.title}" (Completed: ${firstRec.completed})`);

    const toggleRes = await request(app)
      .patch(`/api/history/${testRecordId}/recommendations/${firstRec.id}`)
      .send({ completed: true });

    console.log(`  -> Toggled completion status: ${toggleRes.body.data.completed}`);
    if (toggleRes.body.data.completed !== true) throw new Error('Checklist toggle failed');

    // Step 4: User navigates to History Page to review recent security checks
    console.log('\n[Flow Step 4] User Opens History Dashboard:');
    const historyRes = await request(app).get('/api/history?page=1&limit=10');
    console.log(`  -> Status: ${historyRes.status} OK`);
    console.log(`  -> Total Saved Records: ${historyRes.body.pagination.total}`);
    const found = historyRes.body.data.some((item) => item.id === testRecordId);
    console.log(`  -> Newly inspected threat present in history: ${found}`);
    if (!found) throw new Error('Threat check not listed in history');

    // Step 5: User cleans up and deletes threat check from history
    console.log('\n[Flow Step 5] User Deletes Threat Dossier:');
    const deleteRes = await request(app).delete(`/api/history/${testRecordId}`);
    console.log(`  -> Status: ${deleteRes.status} OK`);
    console.log(`  -> Deleted ID: ${deleteRes.body.deletedId}`);

    // Verify deletion
    const verifyRes = await request(app).get(`/api/history/${testRecordId}`);
    console.log(`  -> Post-delete lookup status: ${verifyRes.status} (Expected 404)`);
    if (verifyRes.status !== 404) throw new Error('Record not deleted');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ ALL BROWSER / API WORKFLOW STEPS VALIDATED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n❌ End-to-End Workflow Failed:', err);
    process.exit(1);
  } finally {
    if (testRecordId) {
      await prisma.threatCheck.deleteMany({ where: { id: testRecordId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

verifyBrowserFlow();
