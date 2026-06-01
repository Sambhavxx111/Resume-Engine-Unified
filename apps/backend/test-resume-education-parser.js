const assert = require('node:assert/strict');
const { buildImportedResumeData } = require('./src/utils/resumeHeuristics');

const resumeText = `
Kushagra Pitre
kushagrapitre2@gmail.com
EDUCATION
University of Petroleum and Energy Studies, Dehradun, India   Aug 2025 - present
Masters of Computer Applications   SGPA:7.05/10
Ajeenkya DY Patil University Pune, India   Aug 2022 - June 2025
Bachelors of Computer Applications   GPA: 7.84/10.0
Shri Bhumika higher secondary school, India   May 2022
SSC Higher Secondary Certificate   Percentage: 54.5/100.0
Progress High School Sankhali, India   June 2017
SSC High School Certificate   CGPA: 9.4/10.0
INTERNSHIP
Cyber Security Analyst Intern   Feb 2025 - May 2025
`;

const { education } = buildImportedResumeData(resumeText, 'kushagra pitre Resume final boss.pdf');

assert.equal(education.length, 4);
assert.deepEqual(education.map((item) => item.institution), [
  'University of Petroleum and Energy Studies',
  'Ajeenkya DY Patil University',
  'Shri Bhumika higher secondary school',
  'Progress High School',
]);
assert.deepEqual(education.map((item) => item.degree), [
  'Masters of Computer Applications',
  'Bachelors of Computer Applications',
  'SSC Higher Secondary Certificate',
  'SSC High School Certificate',
]);
assert.deepEqual(education.map((item) => item.score), [
  'SGPA:7.05/10',
  'GPA: 7.84/10.0',
  'Percentage: 54.5/100.0',
  'CGPA: 9.4/10.0',
]);
assert.deepEqual(education.map((item) => item.endDate), ['present', 'June 2025', 'May 2022', 'June 2017']);

console.log('Education parser regression passed');
