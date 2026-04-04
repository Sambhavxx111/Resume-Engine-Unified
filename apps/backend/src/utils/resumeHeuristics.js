const SECTION_NAME_MAP = {
  contact: 'contact',
  professional_summary: 'summary',
  summary: 'summary',
  profile: 'summary',
  objective: 'summary',
  experience: 'experience',
  work_experience: 'experience',
  professional_experience: 'experience',
  employment: 'experience',
  education: 'education',
  academics: 'education',
  skills: 'skills',
  technical_skills: 'skills',
  core_skills: 'skills',
  projects: 'projects',
  certifications: 'certifications',
  achievements: 'achievements',
  languages: 'languages',
  interests: 'interests',
};

const ROLE_SKILL_HINTS = {
  react: ['TypeScript', 'Responsive Design', 'REST APIs'],
  javascript: ['TypeScript', 'Testing', 'Debugging'],
  node: ['Express.js', 'REST APIs', 'SQL'],
  express: ['Node.js', 'JWT Authentication', 'API Design'],
  python: ['FastAPI', 'Data Analysis', 'Automation'],
  java: ['Spring Boot', 'OOP', 'DSA'],
  sql: ['Database Design', 'Query Optimization', 'Data Modeling'],
  html: ['CSS', 'Accessibility', 'Responsive Design'],
  css: ['Tailwind CSS', 'Responsive Design', 'UI Polish'],
  figma: ['Design Systems', 'Prototyping', 'UX Research'],
  aws: ['Cloud Deployment', 'Monitoring', 'Docker'],
};

const normalizeWhitespace = (value = '') =>
  String(value || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line))
    .map((line) => line.replace(/\s+/g, ' ').trim());

const resolveSectionName = (line = '') =>
  SECTION_NAME_MAP[
    String(line || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
  ] || null;

const filterFilled = (items = []) => items.filter(Boolean);
const normalizeCustomSectionKey = (line = '') =>
  String(line || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');

const cleanComparable = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeComparable = (value = '') =>
  cleanComparable(value)
    .split(/[^a-z0-9+#./-]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const hasEnoughGrounding = (value = '', sourceText = '') => {
  const candidate = cleanComparable(value);
  const source = cleanComparable(sourceText);

  if (!candidate || !source) return false;
  if (source.includes(candidate)) return true;

  const tokens = Array.from(
    new Set(tokenizeComparable(candidate).filter((token) => !/^(and|the|for|with|from|into|using|built|worked|project)$/.test(token))),
  );

  if (!tokens.length) return false;

  const matched = tokens.filter((token) => source.includes(token)).length;
  const ratio = matched / tokens.length;
  return tokens.length === 1 ? matched === 1 : ratio >= 0.7;
};

const cleanField = (value = '') =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const isLikelyNameLine = (line = '') =>
  /^[A-Z][A-Z\s.]{3,40}$/.test(String(line).trim()) &&
  !resolveSectionName(line) &&
  !/@|\d{4}|\+?\d/.test(String(line));

const isLikelyTitleLine = (line = '') => {
  const cleaned = cleanField(line);
  if (!cleaned || cleaned.length > 70) return false;
  if (/@|https?:\/\/|www\.|\+?\d[\d\s()-]{7,}/i.test(cleaned)) return false;
  if (/[|]/.test(cleaned)) return false;
  if (looksLikeDateOrMeta(cleaned)) return false;
  return /(engineer|developer|analyst|intern|manager|designer|specialist|consultant|architect|student|associate|undergraduate|software|frontend|backend|full stack|data scientist)/i.test(
    cleaned,
  );
};

const extractExplicitPortfolio = (text = '') =>
  cleanField(
    String(text || '').match(/((?:https?:\/\/|www\.)[^\s|]+|(?:linkedin\.com|github\.com)\/[^\s|]+)/i)?.[0] || '',
  );

const extractContactDetails = (lines = []) => {
  const contactText = lines.join(' ');
  const email = contactText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = contactText.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0]?.trim() || '';
  const portfolio = extractExplicitPortfolio(contactText);
  const location =
    lines
      .map((line) =>
        String(line || '')
          .replace(email, '')
          .replace(phone, '')
          .replace(portfolio, '')
          .replace(/[|]/g, ' ')
          .replace(/\b\d{6}\b/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .find((line) => {
        if (!line) return false;
        if (isLikelyNameLine(line)) return false;
        if (line.length > 48) return false;
        if (line.split(/\s+/).length > 5) return false;
        if (/(bachelor|master|university|college|engineering|expected|passionate|experience|algorithm|developer|intern)/i.test(line)) return false;
        return /^(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})?|india|uttarakhand|dehradun|remote|onsite|hybrid)$/i.test(
          line,
        );
      }) || '';

  return { email, phone, location, portfolio };
};

const inferProfessionalTitle = (lines = [], summaryLines = []) => {
  const explicitTitle = lines.find((line) => isLikelyTitleLine(line)) || '';

  if (explicitTitle) {
    return explicitTitle;
  }

  return (
    summaryLines
      .map((line) =>
        isLikelyTitleLine(line.match(/^([A-Za-z][A-Za-z\s/-]{4,60}?)(?:\s+with|\s+experienced|\s+focused|\s+skilled)/i)?.[1]?.trim())
          ? line.match(/^([A-Za-z][A-Za-z\s/-]{4,60}?)(?:\s+with|\s+experienced|\s+focused|\s+skilled)/i)?.[1]?.trim()
          : '',
      )
      .find(Boolean) || ''
  );
};

const splitSkillTokens = (lines = []) =>
  Array.from(
    new Set(
      lines.flatMap((line) => {
        const cleaned = String(line || '').replace(/^[-*]\s*/, '').trim();
        if (!cleaned) return [];

        const candidateText = cleaned.includes(':') ? cleaned.split(':').slice(1).join(':').trim() : cleaned;
        const simpleSkillTokenPattern =
          /^(c|c\+\+|c#|python|java|javascript|typescript|html|css|react|node(?:\.js)?|express(?:\.js)?|mysql|sql|mongodb|postgres(?:ql)?|dbms|dsa|os|oop|aws|docker|linux|git)$/i;
        const baseParts = candidateText
          .split(/[,|/]|•|\t+/)
          .flatMap((part) => part.split(/\s{2,}/))
          .map((part) => part.replace(/\band\b/gi, '').trim())
          .filter(Boolean);

        return baseParts.flatMap((part) => {
          const normalized = part.replace(/\s+/g, ' ').trim();
          const spaceTokens = normalized.split(' ').filter(Boolean);
          const averageLength =
            spaceTokens.reduce((sum, token) => sum + token.length, 0) / Math.max(spaceTokens.length, 1);

          if (
            spaceTokens.length >= 2 &&
            !/[()]/.test(normalized) &&
            spaceTokens.every((token) => simpleSkillTokenPattern.test(token)) &&
            (averageLength <= 6 || spaceTokens.length >= 3)
          ) {
            return spaceTokens;
          }

          return [normalized];
        });
      }),
    ),
  ).slice(0, 24);

const inferSummary = (lines = [], title = '') => {
  const longLine = lines.find(
    (line) =>
      line.length > 70 &&
      !/^(contact|summary|profile|objective|experience|education|skills|projects|certifications|achievements)$/i.test(
        line,
      ),
  );

  if (longLine) {
    return longLine;
  }

  if (title) {
    return `Results-driven ${title.toLowerCase()} with practical experience, technical depth, and clear business impact.`;
  }

  return '';
};

const looksLikeDateOrMeta = (line = '') =>
  /\b(19|20)\d{2}\b|present|current|intern|remote|hybrid|onsite|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(
    line,
  );

const buildExperienceItems = (lines = []) => {
  if (!lines.length) return [];

  const groups = [];
  let current = null;

  lines.forEach((line) => {
    const cleaned = line.replace(/^[-*]\s*/, '').trim();
    if (!cleaned) return;

    const looksLikeHeading =
      !line.startsWith('-') &&
      !line.startsWith('*') &&
      cleaned.length < 100 &&
      /^[A-Z]/.test(cleaned);

    if (!current || looksLikeHeading) {
      if (current) groups.push(current);
      current = { heading: cleaned, details: [] };
      return;
    }

    current.details.push(cleaned);
  });

  if (current) groups.push(current);

  return groups.map((group) => {
    const metaLine = group.details.find((item) => looksLikeDateOrMeta(item)) || '';
    const companyLine =
      group.details.find((item) => !looksLikeDateOrMeta(item) && item.length < 80) || '';
    const detailLines = group.details.filter((item) => item !== metaLine && item !== companyLine);

    return {
      company: companyLine,
      role: group.heading,
      startDate: '',
      endDate: metaLine,
      description: detailLines.join(' ').trim(),
    };
  });
};

const buildEducationItems = (lines = []) => {
  if (!lines.length) return [];

  const chunks = [];
  let current = [];

  lines.forEach((line) => {
    if (/^[A-Z]/.test(line) && current.length >= 2) {
      chunks.push(current);
      current = [line];
      return;
    }

    current.push(line);
  });

  if (current.length) {
    chunks.push(current);
  }

  return chunks.map((chunk) => ({
    institution: chunk[1] || '',
    degree: chunk[0] || '',
    fieldOfStudy: chunk[2] || '',
    startDate: '',
    endDate:
      chunk.find(
        (line) =>
          line !== chunk[0] &&
          line !== chunk[1] &&
          /\b(19|20)\d{2}\b|present|current/i.test(line),
      ) || '',
  }));
};

const toTitleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());

const buildResumeSections = (resumeText = '') => {
  const lines = normalizeWhitespace(resumeText);
  const introLines = [];
  const sectionMap = {};
  let currentSection = null;

  lines.forEach((line) => {
    const resolvedSection = resolveSectionName(line);
    const isAllCapsHeading = /^[A-Z][A-Z\s&/-]{2,}$/.test(line);

    if (isAllCapsHeading && (resolvedSection || currentSection)) {
      currentSection = resolvedSection || normalizeCustomSectionKey(line);
      if (!sectionMap[currentSection]) {
        sectionMap[currentSection] = [];
      }
      return;
    }

    if (!currentSection) {
      introLines.push(line);
      return;
    }

    sectionMap[currentSection].push(line.replace(/^[-*]\s*/, '').trim());
  });

  return { lines, introLines, sectionMap };
};

const buildImportedResumeData = (resumeText = '', originalName = '', template = 'contemporary') => {
  const { lines, introLines, sectionMap } = buildResumeSections(resumeText);

  const derivedName = String(originalName || 'uploaded resume')
    .replace(/\.[^/.]+$/, '')
    .replace(/_enhancv-replica$/i, '')
    .replace(/_enhancv-columns$/i, '')
    .replace(/_resume$/i, '')
    .replace(/\s+resume$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();

  const introName = introLines.find((line) => isLikelyNameLine(line)) || '';
  const contactDetails = extractContactDetails([
    ...introLines,
    ...(sectionMap.contact || []),
  ]);
  const summarySectionLines = filterFilled(sectionMap.summary || []);
  const title = inferProfessionalTitle(introLines, summarySectionLines);
  const summaryLines = summarySectionLines.filter((line) => line.length > 25);
  const skills = splitSkillTokens(sectionMap.skills || []);
  const experience = buildExperienceItems(sectionMap.experience || []);
  const education = buildEducationItems(sectionMap.education || []);

  return {
    template,
    personalInfo: {
      fullName: introName || derivedName,
      title,
      email: contactDetails.email,
      phone: contactDetails.phone,
      location: contactDetails.location,
      portfolio: contactDetails.portfolio,
    },
    education: education.length
      ? education
      : [{ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }],
    experience: experience.length
      ? experience
      : [{ company: '', role: '', startDate: '', endDate: '', description: '' }],
    skills,
    summary: summaryLines.join(' ').trim() || inferSummary(lines, title),
    customSections: Object.entries(sectionMap)
      .filter(([key, values]) => !['summary', 'skills', 'experience', 'education', 'contact'].includes(key) && values.length)
      .map(([key, values]) => ({
        title: toTitleCase(key),
        items: filterFilled(values).filter(
          (item) =>
            /[A-Za-z]/.test(item) &&
            !/powered by|enhancv\.com/i.test(item) &&
            !/^[•\s]+$/.test(item) &&
            !/^[Eq\s]+$/i.test(item),
        ),
      })),
    raw_text: resumeText,
  };
};

const normalizeList = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => cleanField(item))
    .filter(Boolean);

const normalizeStructuredItem = (item = {}, fields = []) =>
  fields.reduce((acc, field) => {
    acc[field] = cleanField(item?.[field] || '');
    return acc;
  }, {});

const groundImportedResumeData = (resumeData = {}, resumeText = '', originalName = '') => {
  const fallback = buildImportedResumeData(resumeText, originalName, resumeData?.template || 'contemporary');
  const sourceText = normalizeWhitespace(resumeText).join('\n');
  const { introLines, sectionMap } = buildResumeSections(resumeText);
  const personalInfo = resumeData?.personalInfo || {};

  const summaryFromSource = normalizeList(sectionMap.summary).join(' ');
  const groundedTitle = cleanField(personalInfo.title);
  const strictTitle = isLikelyTitleLine(groundedTitle) && hasEnoughGrounding(groundedTitle, introLines.join('\n'))
    ? groundedTitle
    : fallback.personalInfo.title;

  const strictPortfolio = extractExplicitPortfolio(sourceText);
  const strictEmail = sourceText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || fallback.personalInfo.email;
  const strictPhone = sourceText.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0]?.trim() || fallback.personalInfo.phone;

  const sanitizeGroundedText = (value = '', fallbackValue = '') => {
    const cleaned = cleanField(value);
    if (cleaned && hasEnoughGrounding(cleaned, sourceText)) {
      return cleaned;
    }
    return cleanField(fallbackValue);
  };

  const sanitizeCollection = (items = [], fallbackItems = [], fields = []) => {
    const normalizedItems = Array.isArray(items) ? items : [];
    const grounded = normalizedItems
      .map((item) => normalizeStructuredItem(item, fields))
      .map((item) =>
        fields.reduce((acc, field) => {
          acc[field] = sanitizeGroundedText(item[field], '');
          return acc;
        }, {}),
      )
      .filter((item) => fields.some((field) => item[field]));

    return grounded.length ? grounded : fallbackItems;
  };

  return {
    template: resumeData?.template || fallback.template,
    personalInfo: {
      fullName:
        sanitizeGroundedText(personalInfo.fullName, '').match(/[A-Za-z]/)
          ? sanitizeGroundedText(personalInfo.fullName, fallback.personalInfo.fullName)
          : fallback.personalInfo.fullName,
      title: strictTitle,
      email: strictEmail,
      phone: strictPhone,
      location: sanitizeGroundedText(personalInfo.location, fallback.personalInfo.location),
      portfolio: strictPortfolio,
    },
    education: sanitizeCollection(
      resumeData?.education,
      fallback.education,
      ['institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate'],
    ),
    experience: sanitizeCollection(
      resumeData?.experience,
      fallback.experience,
      ['company', 'role', 'startDate', 'endDate', 'description'],
    ),
    skills: Array.from(
      new Set(
        normalizeList(resumeData?.skills)
          .filter((skill) => hasEnoughGrounding(skill, sourceText))
          .concat(fallback.skills),
      ),
    ).slice(0, 24),
    summary: summaryFromSource || '',
    customSections: sanitizeCollection(
      resumeData?.customSections?.map((section) => ({
        title: cleanField(section?.title),
        items: normalizeList(section?.items).join(' || '),
      })),
      fallback.customSections.map((section) => ({
        title: section.title,
        items: normalizeList(section.items).join(' || '),
      })),
      ['title', 'items'],
    ).map((section) => ({
      title: section.title,
      items: normalizeList(String(section.items || '').split('||')),
    })),
    raw_text: resumeText,
  };
};

const buildResumeTextFromData = (resumeData = {}) => {
  const lines = [];
  const personalInfo = resumeData.personalInfo || {};
  const identityLine = filterFilled([
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.portfolio,
  ]).join(' | ');

  if (personalInfo.fullName) lines.push(personalInfo.fullName);
  if (personalInfo.title) lines.push(personalInfo.title);
  if (identityLine) lines.push(identityLine);

  if (resumeData.summary) {
    lines.push('', 'SUMMARY', resumeData.summary);
  }

  if (Array.isArray(resumeData.skills) && resumeData.skills.length) {
    lines.push('', 'SKILLS', resumeData.skills.join(', '));
  }

  if (Array.isArray(resumeData.experience) && resumeData.experience.some((item) => item.role || item.company || item.description)) {
    lines.push('', 'EXPERIENCE');
    resumeData.experience.forEach((item) => {
      const heading = filterFilled([item.role, item.company]).join(' - ');
      const meta = filterFilled([item.startDate, item.endDate]).join(' to ');
      if (heading) lines.push(heading);
      if (meta) lines.push(meta);
      if (item.description) lines.push(item.description);
      lines.push('');
    });
  }

  if (Array.isArray(resumeData.education) && resumeData.education.some((item) => item.degree || item.institution || item.fieldOfStudy)) {
    lines.push('EDUCATION');
    resumeData.education.forEach((item) => {
      const heading = filterFilled([item.degree, item.fieldOfStudy]).join(' - ');
      if (heading) lines.push(heading);
      if (item.institution) lines.push(item.institution);
      const meta = filterFilled([item.startDate, item.endDate]).join(' to ');
      if (meta) lines.push(meta);
      lines.push('');
    });
  }

  if (Array.isArray(resumeData.customSections)) {
    resumeData.customSections.forEach((section) => {
      if (!section?.title || !Array.isArray(section.items) || !section.items.length) return;
      lines.push(section.title.toUpperCase());
      section.items.forEach((item) => lines.push(item));
      lines.push('');
    });
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const collectResumeSignals = (resumeData = {}) =>
  [
    resumeData.personalInfo?.title,
    resumeData.summary,
    ...(resumeData.skills || []),
    ...(resumeData.experience || []).flatMap((item) => [item.role, item.company, item.description]),
    ...(resumeData.education || []).flatMap((item) => [item.degree, item.fieldOfStudy]),
  ]
    .filter(Boolean)
    .join(' ');

const generateSummaryFallback = (resumeData = {}) => {
  const personalInfo = resumeData.personalInfo || {};
  const title = personalInfo.title || 'candidate';
  const topSkills = Array.isArray(resumeData.skills) ? resumeData.skills.filter(Boolean).slice(0, 4) : [];
  const topExperience = (resumeData.experience || []).find((item) => item.role || item.company);

  const firstSentence = `Results-driven ${String(title).toLowerCase()} with hands-on experience building practical solutions and communicating impact clearly.`;
  const secondSentence = topSkills.length
    ? `Brings strength in ${topSkills.join(', ')}${topExperience?.role ? `, backed by experience as ${topExperience.role}` : ''}.`
    : topExperience?.role
      ? `Offers relevant experience in ${topExperience.role}${topExperience.company ? ` at ${topExperience.company}` : ''}.`
      : 'Focused on delivering reliable work, continuous learning, and strong collaboration.';

  return `${firstSentence} ${secondSentence}`.trim();
};

const suggestSkillsFallback = (existingSkills = []) => {
  const normalized = existingSkills
    .map((skill) => String(skill || '').trim())
    .filter(Boolean);
  const lower = normalized.map((skill) => skill.toLowerCase());
  const suggestions = [];

  lower.forEach((skill, index) => {
    (ROLE_SKILL_HINTS[skill] || []).forEach((candidate) => {
      if (!lower.includes(candidate.toLowerCase()) && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
    });
    if (index === lower.length - 1 && suggestions.length < 5) {
      ['Communication', 'Problem Solving', 'Testing', 'Documentation', 'API Integration'].forEach((candidate) => {
        if (!lower.includes(candidate.toLowerCase()) && !suggestions.includes(candidate)) {
          suggestions.push(candidate);
        }
      });
    }
  });

  return {
    suggestedSkills: suggestions.slice(0, 5),
    reasoning: 'Fallback suggestions were generated from the skills already present in the resume.',
  };
};

const optimizeResumeFallback = (resumeData = {}, jobDescription = null) => {
  const improvements = [];
  const priorityImprovements = [];
  const jobText = String(jobDescription || '').toLowerCase();
  const resumeSignals = collectResumeSignals(resumeData).toLowerCase();
  const topResumeKeywords = Array.from(new Set((resumeSignals.match(/\b[a-z][a-z+#.-]{2,}\b/g) || []).slice(0, 80)));
  const missingJobTerms = Array.from(
    new Set(
      (jobText.match(/\b[a-z][a-z+#.-]{2,}\b/g) || [])
        .filter((term) => term.length > 3 && !topResumeKeywords.includes(term))
        .slice(0, 5),
    ),
  );

  if (!resumeData.summary?.trim()) {
    improvements.push({
      section: 'Summary',
      current: 'No professional summary present.',
      suggested: generateSummaryFallback(resumeData),
      reason: 'A short summary helps recruiters and ATS systems identify role fit quickly.',
    });
    priorityImprovements.push('Add a 2-3 sentence summary tailored to your target role.');
  }

  const experienceWithoutMetrics = (resumeData.experience || []).some(
    (item) => item.description && !/\d/.test(item.description),
  );
  if (experienceWithoutMetrics) {
    improvements.push({
      section: 'Experience',
      current: 'Experience bullets are descriptive but not quantified.',
      suggested: 'Add numbers, percentages, time saved, users served, or project scale where truthful.',
      reason: 'Measured outcomes improve ATS scoring and recruiter confidence.',
    });
    priorityImprovements.push('Quantify experience bullets with real outcomes.');
  }

  if (!Array.isArray(resumeData.skills) || resumeData.skills.length < 5) {
    improvements.push({
      section: 'Skills',
      current: 'Skill coverage is limited.',
      suggested: 'Expand the skills section with the strongest tools, languages, and frameworks already reflected in your work.',
      reason: 'A fuller skills section improves keyword coverage without inventing experience.',
    });
    priorityImprovements.push('Expand the skills section using tools already shown in projects or experience.');
  }

  if (missingJobTerms.length) {
    improvements.push({
      section: 'Keywords',
      current: 'Important job-description language is missing from the resume.',
      suggested: `Where truthful, reflect terms like ${missingJobTerms.join(', ')} in your summary or experience bullets.`,
      reason: 'Mirroring the target role vocabulary improves ATS match quality.',
    });
    priorityImprovements.push(`Align wording with the target role: ${missingJobTerms.join(', ')}.`);
  }

  if (!improvements.length) {
    improvements.push({
      section: 'Polish',
      current: 'The resume already has core sections in place.',
      suggested: 'Tighten wording, keep bullets concise, and ensure the strongest work appears near the top.',
      reason: 'Even solid resumes benefit from clearer prioritization and tighter phrasing.',
    });
  }

  return {
    improvements,
    priorityImprovements: priorityImprovements.slice(0, 3),
    overallAssessment:
      'Fallback optimization completed locally. The draft structure is usable, but AI-powered phrasing enhancements were unavailable during this request.',
  };
};

const optimizeUploadedResumeTextFallback = (resumeText = '', atsInsights = {}, originalName = 'uploaded resume') => {
  const optimizedResumeData = buildImportedResumeData(resumeText, originalName);
  const keyChanges = [];

  if (!optimizedResumeData.summary) {
    optimizedResumeData.summary = generateSummaryFallback(optimizedResumeData);
    keyChanges.push('Added a concise professional summary based on the detected role and skills.');
  }

  if (!optimizedResumeData.skills.length) {
    keyChanges.push('Could not confidently extract a skills list, so the original resume text was preserved for manual review.');
  }

  if (Array.isArray(atsInsights.missingSections) && atsInsights.missingSections.length) {
    keyChanges.push(`Review missing sections: ${atsInsights.missingSections.join(', ')}.`);
  }

  if (Array.isArray(atsInsights.missingKeywords) && atsInsights.missingKeywords.length) {
    keyChanges.push(`Consider adding truthful keywords such as ${atsInsights.missingKeywords.slice(0, 5).join(', ')}.`);
  }

  if (!keyChanges.length) {
    keyChanges.push('Normalized the uploaded resume into a cleaner ATS-friendly structure without inventing new facts.');
  }

  return {
    headline: 'Structured ATS-ready draft prepared',
    optimizedResumeText: buildResumeTextFromData(optimizedResumeData) || normalizeWhitespace(resumeText).join('\n'),
    optimizedResumeData,
    keyChanges,
  };
};

module.exports = {
  buildImportedResumeData,
  buildResumeTextFromData,
  generateSummaryFallback,
  groundImportedResumeData,
  suggestSkillsFallback,
  optimizeResumeFallback,
  optimizeUploadedResumeTextFallback,
};
