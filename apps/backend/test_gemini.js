require('dotenv').config();
const { diagnoseResume, optimizeResume, generateSummary, suggestSkills } = require('./src/services/gemini.service');

(async () => {
  try {
    const resume = {
      personalInfo: { fullName: 'Test User', email: 'test@example.com' },
      summary: 'Experienced developer with a focus on backend services.',
      experience: [
        {
          jobTitle: 'Software Engineer',
          company: 'ACME',
          startDate: '2020-01',
          endDate: '2022-01',
          description: 'Built and maintained backend services.'
        }
      ],
      skills: ['JavaScript', 'Node.js']
    };

    console.log('\n=== Running diagnoseResume ===');
    const diagnosis = await diagnoseResume(resume);
    console.log('Diagnosis result:', JSON.stringify(diagnosis, null, 2));

    console.log('\n=== Running optimizeResume ===');
    const optimization = await optimizeResume(resume, 'Senior Backend Engineer with Node.js and performance tuning experience');
    console.log('Optimization result:', JSON.stringify(optimization, null, 2));

    console.log('\n=== Running generateSummary ===');
    const summary = await generateSummary(resume);
    console.log('Generated summary:', JSON.stringify(summary, null, 2));

    console.log('\n=== Running suggestSkills ===');
    const skills = await suggestSkills(['JavaScript','Node.js']);
    console.log('Suggested skills:', JSON.stringify(skills, null, 2));

  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  }
})();
