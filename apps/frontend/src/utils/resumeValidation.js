import { flattenSkillCategories } from "./skills";

/**
 * Validates whether a specific resume section contains all required fields.
 *
 * @param {string} sectionId Section identifier ('personal', 'photo', 'summary', 'experience', 'education', 'projects', 'skills', 'custom', 'optimizer')
 * @param {Object} formData Current resume data state
 * @returns {Array<{sectionId: string, sectionName: string, field: string, description: string, inputName?: string}>}
 */
export function getMissingFieldsForSection(sectionId, formData) {
  const missing = [];
  const p = formData?.personalInfo || {};

  switch (sectionId) {
    case "personal": {
      const firstName = p.firstName?.trim() || "";
      const middleName = p.middleName?.trim() || "";
      const lastName = p.lastName?.trim() || "";
      const fullName = p.fullName?.trim() || "";
      const title = p.title?.trim() || "";
      const email = p.email?.trim() || "";
      const phone = p.phone?.trim() || "";
      const namePattern = /^[A-Za-z\s]+$/;

      if (!firstName && !fullName) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "First Name",
          description: "First name or full name is required for your resume header.",
          inputName: "firstName",
        });
      } else if (firstName && !namePattern.test(firstName)) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "First Name",
          description: "First name must not contain numbers or special characters.",
          inputName: "firstName",
        });
      }

      if (middleName && !namePattern.test(middleName)) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "Middle Name",
          description: "Middle name must not contain numbers or special characters.",
          inputName: "middleName",
        });
      }

      if (lastName && !namePattern.test(lastName)) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "Last Name",
          description: "Last name must not contain numbers or special characters.",
          inputName: "lastName",
        });
      }

      if (!title) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "Professional Title",
          description: "Your target job title or headline (e.g. Software Engineer, UI Designer).",
          inputName: "title",
        });
      }

      if (!email) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "Email Address",
          description: "A valid email address where recruiters can reach you.",
          inputName: "email",
        });
      }

      const phoneDigits = phone.replace(/\D/g, "");
      if (!phone) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "Phone Number",
          description: "A contact phone number for interview scheduling.",
          inputName: "phone",
        });
      } else if (phoneDigits.length !== 10) {
        missing.push({
          sectionId: "personal",
          sectionName: "Personal Information",
          field: "Phone Number",
          description: "Phone number must be exactly 10 digits.",
          inputName: "phone",
        });
      }
      break;
    }

    case "photo": {
      // Profile photo is strictly optional
      break;
    }

    case "summary": {
      const summary = formData?.summary?.trim() || "";
      if (!summary) {
        missing.push({
          sectionId: "summary",
          sectionName: "Professional Summary",
          field: "Executive Summary",
          description: "A brief summary of your background, key strengths, and career objectives.",
          inputName: "summary",
        });
      }
      break;
    }

    case "experience": {
      const experience = Array.isArray(formData?.experience) ? formData.experience : [];
      // Check for partially filled experience entries
      experience.forEach((item, index) => {
        const hasRole = Boolean(item.role?.trim());
        const hasCompany = Boolean(item.company?.trim());
        if (hasRole && !hasCompany) {
          missing.push({
            sectionId: "experience",
            sectionName: "Work Experience",
            field: `Experience #${index + 1} Company`,
            description: `Enter the company or organization for "${item.role}".`,
            inputName: `experience-${index}-company`,
          });
        } else if (!hasRole && hasCompany) {
          missing.push({
            sectionId: "experience",
            sectionName: "Work Experience",
            field: `Experience #${index + 1} Role`,
            description: `Enter the role or job title for "${item.company}".`,
            inputName: `experience-${index}-role`,
          });
        }
      });
      break;
    }

    case "education": {
      const education = Array.isArray(formData?.education) ? formData.education : [];
      const validEducation = education.filter(
        (item) => item.institution?.trim() && item.degree?.trim(),
      );

      if (validEducation.length === 0) {
        missing.push({
          sectionId: "education",
          sectionName: "Education",
          field: "Degree & Institution",
          description: "At least one education record with degree qualification and school/institution.",
          inputName: "education",
        });
      } else {
        education.forEach((item, index) => {
          const hasInst = Boolean(item.institution?.trim());
          const hasDeg = Boolean(item.degree?.trim());
          if (hasInst && !hasDeg) {
            missing.push({
              sectionId: "education",
              sectionName: "Education",
              field: `Degree #${index + 1} Qualification`,
              description: `Enter the degree/certificate for ${item.institution}.`,
              inputName: `education-${index}-degree`,
            });
          } else if (!hasInst && hasDeg) {
            missing.push({
              sectionId: "education",
              sectionName: "Education",
              field: `Degree #${index + 1} Institution`,
              description: `Enter the school or university name for ${item.degree}.`,
              inputName: `education-${index}-institution`,
            });
          }
        });
      }
      break;
    }

    case "projects": {
      const projects = Array.isArray(formData?.projects) ? formData.projects : [];
      const experience = Array.isArray(formData?.experience) ? formData.experience : [];
      const validExperience = experience.filter(
        (item) => item.role?.trim() && item.company?.trim(),
      );
      const validProjects = projects.filter((item) => item.name?.trim());

      // If user has neither experience nor projects, require at least one project
      if (validExperience.length === 0 && validProjects.length === 0) {
        missing.push({
          sectionId: "projects",
          sectionName: "Projects",
          field: "Project Name",
          description: "Add at least one project (or work experience) to showcase your practical work.",
          inputName: "projects",
        });
      }
      break;
    }

    case "skills": {
      const skillsList = flattenSkillCategories(formData?.skills);
      if (!skillsList || skillsList.length === 0) {
        missing.push({
          sectionId: "skills",
          sectionName: "Skills",
          field: "Skills List",
          description: "Add at least one relevant skill (technical, tool, or soft skill).",
          inputName: "skills",
        });
      }
      break;
    }

    case "custom":
    case "optimizer":
    default:
      break;
  }

  return missing;
}

/**
 * Checks whether navigating from currentSectionId to targetSectionId is allowed.
 * Prevents moving forward if any preceding mandatory section has unfilled required fields.
 *
 * @param {string} targetSectionId Section the user wants to navigate to
 * @param {string} currentSectionId Current active section
 * @param {Object} formData Resume data state
 * @param {Array<{id: string, label: string}>} sectionsList List of section definitions
 * @returns {{allowed: boolean, blockingSectionId?: string, blockingSectionName?: string, missingFields?: Array}}
 */
export function checkSectionNavigationAllowed(targetSectionId, currentSectionId, formData, sectionsList = []) {
  const currentIndex = sectionsList.findIndex((s) => s.id === currentSectionId);
  const targetIndex = sectionsList.findIndex((s) => s.id === targetSectionId);

  // Moving backward or staying on the same section is always allowed
  if (targetIndex <= currentIndex || currentIndex === -1 || targetIndex === -1) {
    return { allowed: true };
  }

  // Validate each section from current up to target - 1
  for (let i = currentIndex; i < targetIndex; i++) {
    const sec = sectionsList[i];
    const missing = getMissingFieldsForSection(sec.id, formData);
    if (missing.length > 0) {
      return {
        allowed: false,
        blockingSectionId: sec.id,
        blockingSectionName: sec.label || sec.id,
        missingFields: missing,
      };
    }
  }

  return { allowed: true };
}

/**
 * Validates whether the entire resume contains all required fields before generating/downloading a PDF.
 * Returns a detailed list of missing mandatory fields grouped by section.
 *
 * @param {Object} formData Current resume data state
 * @returns {Array<{sectionId: string, sectionName: string, field: string, description: string, inputName?: string}>}
 */
export function getMissingMandatoryFields(formData) {
  const sections = ["personal", "summary", "experience", "education", "projects", "skills"];
  const allMissing = [];

  sections.forEach((secId) => {
    allMissing.push(...getMissingFieldsForSection(secId, formData));
  });

  return allMissing;
}

/**
 * Checks if the resume is ready for PDF export.
 *
 * @param {Object} formData Current resume data state
 * @returns {boolean}
 */
export function isResumeValidForDownload(formData) {
  return getMissingMandatoryFields(formData).length === 0;
}
