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
SPK Infrahack Pvt Ltd   Pune, India
 Performed web application vulnerability assessments and assisted in penetration testing activities.
 Conducted reconnaissance, scanning, and vulnerability analysis using industry-standard security tools.
 Prepared detailed security reports with risk analysis and mitigation recommendations
PROJECTS
Malware Analysis Sandbox
• Built an AI-powered malware analysis sandbox with file upload, static and dynamic analysis.
• Integrated machine learning for efficient and accurate malware detection.
Advanced Vulnerability Scanner
• Developed a Python-based automated vulnerability scanner integrating tools like Nmap, Nikto, and OpenVAS for deep web and network
analysis.
• Enabled OWASP Top 10 detection, real-time dashboards, report generation, modular scanning, and secure data handling with optimized
performance
CERTIFICATES
 CS406: Information Security - Saylor Academy
 Kali Linux Penetration Testing - Infosys Springboard
`;

const { education, experience, projects, customSections } = buildImportedResumeData(resumeText, 'kushagra pitre Resume final boss.pdf');

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

assert.equal(experience[0].role, 'Cyber Security Analyst Intern');
assert.equal(experience[0].startDate, 'Feb 2025');
assert.equal(experience[0].endDate, 'May 2025');
assert.match(experience[0].description, /^Performed web application vulnerability assessments/);
assert.equal(projects.length, 2);
assert.equal(projects[1].name, 'Advanced Vulnerability Scanner');
assert.deepEqual(projects[1].bullets, [
  'Developed a Python-based automated vulnerability scanner integrating tools like Nmap, Nikto, and OpenVAS for deep web and network analysis.',
  'Enabled OWASP Top 10 detection, real-time dashboards, report generation, modular scanning, and secure data handling with optimized performance',
]);
assert.deepEqual(customSections[0].items, [
  'CS406: Information Security - Saylor Academy',
  'Kali Linux Penetration Testing - Infosys Springboard',
]);

console.log('Resume section parser regression passed');
