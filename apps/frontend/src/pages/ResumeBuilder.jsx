import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { API } from "../api/services";
import Loader from "../components/Loader";
import ResumeForm from "../components/ResumeForm";
import { exportResumePdf } from "../utils/pdf";
import { flattenSkillCategories, normalizeSkillsForStorage } from "../utils/skills";
import { getMissingMandatoryFields } from "../utils/resumeValidation";
import { useAuth } from "../context/AuthContext";

const TEMPLATE_ID_ALIASES = {
  "executive-edge": "contemporary",
  "classic-core": "single-column",
  "compact-impact": "compact",
  "modern-split": "creative",
  "minimal-grid": "timeline",
  socs: "socs-official",
};

const normalizeTemplateId = (templateId) => TEMPLATE_ID_ALIASES[templateId] || templateId || "contemporary";

const normalizeImportedName = (value = "") => {
  const cleaned = String(value || "")
    .replace(/[^A-Za-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
};

const deriveNameFromFileName = (fileName = "") => {
  const cleaned = String(fileName || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(resume|cv|curriculum vitae|final|updated|latest|copy)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return /[A-Za-z]/.test(cleaned) ? normalizeImportedName(cleaned) : "";
};

const isLikelyResumeNameLine = (line = "") => {
  const cleaned = String(line || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return false;
  if (cleaned.length < 4 || cleaned.length > 48) return false;
  if (cleaned.split(/\s+/).length > 5) return false;
  if (/@|\+?\d|linkedin|github|portfolio|resume|curriculum vitae|email|phone/i.test(cleaned)) {
    return false;
  }
  if (/^(summary|profile|education|experience|skills|projects|certifications|achievements)$/i.test(cleaned)) {
    return false;
  }

  return /^[A-Za-z][A-Za-z\s.'-]+$/.test(cleaned);
};

const deriveNameFromResumeText = (resumeText = "") => {
  const lines = String(resumeText || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 12);

  return normalizeImportedName(lines.find(isLikelyResumeNameLine) || "");
};

const splitNameParts = (value = "") => {
  const parts = normalizeImportedName(value).split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", middleName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: "" };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

const buildFullNameFromParts = (personalInfo = {}) =>
  [personalInfo.firstName, personalInfo.middleName, personalInfo.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");

const resolveResumeFullName = (personalInfo = {}, resumeText = "", fileName = "") =>
  normalizeImportedName(buildFullNameFromParts(personalInfo)) ||
  normalizeImportedName(personalInfo.fullName || personalInfo.name || "") ||
  deriveNameFromResumeText(resumeText) ||
  deriveNameFromFileName(fileName);

const isProjectSectionTitle = (title = "") => /project/i.test(String(title || "").trim());

const normalizeProjectItems = (projects = [], customSections = []) => {
  const directProjects = (Array.isArray(projects) ? projects : []).map((item, index) => ({
    name: String(item?.name || item?.title || "").trim(),
    bullets: Array.isArray(item?.bullets) && item.bullets.length
      ? item.bullets
      : String(item?.description || "")
          .split(/\r?\n+/)
          .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
          .filter(Boolean),
  }));

  const customProjects = (Array.isArray(customSections) ? customSections : [])
    .filter((section) => isProjectSectionTitle(section?.title))
    .flatMap((section) =>
      (section.items || []).map((item, index) => {
        const [rawName, ...rawDetails] = String(item || "").split(/\s*[:|-]\s+/);
        const fallbackName = section.items.length === 1 ? section.title : `Project ${index + 1}`;
        return {
          name: String(rawName || fallbackName).trim(),
          bullets: (rawDetails.length ? rawDetails : [item])
            .flatMap((detail) => String(detail || "").split(/\r?\n+/))
            .map((detail) => detail.replace(/^\s*[-*]\s*/, "").trim())
            .filter(Boolean),
        };
      }),
    );

  const normalized = [...directProjects, ...customProjects]
    .map((project) => ({
      name: project.name,
      bullets: project.bullets?.length ? project.bullets : [""],
    }))
    .filter((project) => project.name || project.bullets.some(Boolean));

  return normalized.length ? normalized : defaultResumeState.projects;
};

const isInternshipSectionTitle = (title = "") =>
  /\b(internship|internships|training|industrial training|work experience)\b/i.test(String(title || "").trim());

const hasMeaningfulExperience = (experience = []) =>
  (Array.isArray(experience) ? experience : []).some((item) =>
    [item?.company, item?.role, item?.description, item?.startDate, item?.endDate]
      .map((value) => String(value || "").trim())
      .some(Boolean),
  );

const normalizeDuplicateComparisonText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isCustomSectionDuplicatedInExperience = (section = {}, experience = []) => {
  const sectionText = normalizeDuplicateComparisonText(
    [section?.title, ...(Array.isArray(section?.items) ? section.items : [])].join(" "),
  );
  const experienceText = normalizeDuplicateComparisonText(
    (Array.isArray(experience) ? experience : [])
      .flatMap((item) => [item?.company, item?.role, item?.description, item?.startDate, item?.endDate])
      .join(" "),
  );

  if (!sectionText || !experienceText) return false;
  if (experienceText.includes(sectionText) || sectionText.includes(experienceText)) return true;

  const sectionTokens = Array.from(new Set(sectionText.split(" ").filter((token) => token.length > 3)));
  if (sectionTokens.length < 3) return false;

  const matchedTokens = sectionTokens.filter((token) => experienceText.includes(token));
  return matchedTokens.length / sectionTokens.length >= 0.72;
};

const normalizeCustomSections = (customSections = [], experience = []) =>
  (Array.isArray(customSections) ? customSections : []).filter(
    (section) =>
      !isProjectSectionTitle(section?.title) &&
      !(
        hasMeaningfulExperience(experience) &&
        (isInternshipSectionTitle(section?.title) ||
          (!String(section?.title || "").trim() && isCustomSectionDuplicatedInExperience(section, experience)))
      ),
  );

const toConciseInsight = (value) => {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  if (!raw) {
    return null;
  }

  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0] || raw;
  const cleaned = firstSentence
    .replace(/^why:\s*/i, "")
    .replace(/^overall assessment:\s*/i, "")
    .trim();

  return cleaned;
};

const buildConciseInsights = (items = []) =>
  Array.from(new Set(items.map(toConciseInsight).filter(Boolean))).slice(0, 6);

const defaultResumeState = {
  template: "contemporary",
  personalInfo: {
    firstName: "",
    middleName: "",
    lastName: "",
    fullName: "",
    title: "",
    email: "",
    countryCode: "+91",
    phone: "",
    location: "",
    portfolio: "",
    github: "",
  },
  education: [
    {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      location: "",
      score: "",
    },
  ],
  experience: [
    {
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  projects: [
    {
      name: "",
      bullets: [""],
    },
  ],
  skills: [
    {
      category: "",
      items: [""],
    },
  ],
  summary: "",
  customSections: [],
};

const defaultResumePhotoPlacement = {
  x: 0.72,
  y: 0.06,
};

const defaultResumePhotoCrop = {
  x: 0.5,
  y: 0.5,
};

const defaultResumePhotoFrameScale = 1;
const MIN_SAVE_FEEDBACK_MS = 180;

const normalizeResumeForBuilder = (resume = {}, fallbackTemplate = defaultResumeState.template, source = {}) => ({
  ...defaultResumeState,
  ...resume,
  personalInfo: (() => {
    const mergedPersonalInfo = {
      ...defaultResumeState.personalInfo,
      ...(resume.personalInfo || {}),
    };
    const resolvedFullName = resolveResumeFullName(
      mergedPersonalInfo,
      source.resumeText || resume.raw_text || resume.rawText || "",
      source.fileName || "",
    );
    const nameParts = splitNameParts(resolvedFullName);
    return {
      ...mergedPersonalInfo,
      firstName: normalizeImportedName(mergedPersonalInfo.firstName || nameParts.firstName),
      middleName: normalizeImportedName(mergedPersonalInfo.middleName || nameParts.middleName),
      lastName: normalizeImportedName(mergedPersonalInfo.lastName || nameParts.lastName),
      fullName: resolvedFullName,
      countryCode: mergedPersonalInfo.countryCode || "+91",
    };
  })(),
  education:
    Array.isArray(resume.education) && resume.education.length
      ? resume.education.map((item) => ({
          ...defaultResumeState.education[0],
          ...(item || {}),
        }))
      : defaultResumeState.education,
  experience:
    Array.isArray(resume.experience) && resume.experience.length
      ? resume.experience
      : defaultResumeState.experience,
  projects:
    normalizeProjectItems(resume.projects, resume.customSections),
  skills: (() => {
    if (!Array.isArray(resume.skills) || !resume.skills.length) {
      return defaultResumeState.skills;
    }
    const normalized = normalizeSkillsForStorage(resume.skills);
    return normalized.length ? normalized : defaultResumeState.skills;
  })(),
  customSections: normalizeCustomSections(resume.customSections, resume.experience),
  template: normalizeTemplateId(resume.template || fallbackTemplate) || defaultResumeState.template,
});

const serializeResumeState = (resume = {}) =>
  JSON.stringify({
    ...resume,
    skills: normalizeSkillsForStorage(resume.skills),
  });

const formatDraftTimestamp = (value) => {
  if (!value) {
    return "Recently saved";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Recently saved";
  }
};

function ResumeBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState(defaultResumeState);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => serializeResumeState(defaultResumeState));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveAction, setSaveAction] = useState("");
  const [aiLoading, setAiLoading] = useState("");
  const [importingResume, setImportingResume] = useState(false);
  const [resumeImportFile, setResumeImportFile] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [exportError, setExportError] = useState("");
  const [summaryUpdateSuccess, setSummaryUpdateSuccess] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [resumePhoto, setResumePhoto] = useState(null);
  const previewRef = useRef(null);
  const draftsDropdownRef = useRef(null);
  const [isDraftsDropdownOpen, setIsDraftsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (draftsDropdownRef.current && !draftsDropdownRef.current.contains(event.target)) {
        setIsDraftsDropdownOpen(false);
      }
    };
    if (isDraftsDropdownOpen) {
      window.addEventListener("pointerdown", handleOutsideClick);
      return () => window.removeEventListener("pointerdown", handleOutsideClick);
    }
  }, [isDraftsDropdownOpen]);

  useEffect(() => {
    const fetchResumeDrafts = async () => {
      if (!isAuthenticated) {
        setLoadingDrafts(false);
        return;
      }

      setLoadingDrafts(true);
      setError("");

      try {
        const { data } = await axiosInstance.get(API.listResumeDrafts);
        setDrafts(Array.isArray(data.resumes) ? data.resumes : []);
        const blankResume = normalizeResumeForBuilder(defaultResumeState);
        setFormData(blankResume);
        setActiveResumeId(null);
        setLastSavedSnapshot(serializeResumeState(blankResume));
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Unable to fetch saved drafts right now. You can still start from a blank draft.",
        );
      } finally {
        setLoadingDrafts(false);
      }
    };

    fetchResumeDrafts();
  }, [isAuthenticated]);

  useEffect(() => {
    setHasUnsavedChanges(serializeResumeState(formData) !== lastSavedSnapshot);
  }, [formData, lastSavedSnapshot]);

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!hasUnsavedChanges) {
        return undefined;
      }

      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const refreshDrafts = async () => {
    if (!isAuthenticated) {
      return;
    }

    const { data } = await axiosInstance.get(API.listResumeDrafts);
    setDrafts(Array.isArray(data.resumes) ? data.resumes : []);
  };

  const confirmUnsavedChanges = () => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm("You have unsaved resume changes. Discard those changes and continue?");
  };

  const redirectToLogin = (authPrompt) => {
    navigate("/login", {
      state: {
        from: location,
        authPrompt,
      },
    });
  };

  const persistResume = async (mode = "resume") => {
    if (!isAuthenticated) {
      redirectToLogin(
        mode === "draft"
          ? "Please log in with your personal email to save your draft."
          : "Please log in with your personal email to save your resume.",
      );
      return;
    }

    if (mode === "resume" || mode === "hard-copy") {
      const missing = getMissingMandatoryFields(formData);
      if (missing.length > 0) {
        setError(
          `Please fill in all mandatory fields before downloading (${missing.map((f) => f.field).join(", ")}).`,
        );
        return;
      }
    }

    setSaveAction(mode);
    setError("");
    setExportError("");
    setSuccessMessage("");
    const saveStartedAt = Date.now();

    try {
      const resumeForSave = {
        ...formData,
        skills: normalizeSkillsForStorage(formData.skills),
      };
      const { data } = activeResumeId
        ? await axiosInstance.put(API.updateResumeDraft(activeResumeId), resumeForSave)
        : await axiosInstance.post(API.createResumeDraft, resumeForSave);
      if (data.resumeId) {
        setActiveResumeId(data.resumeId);
      }
      setLastSavedSnapshot(serializeResumeState(resumeForSave));
      await refreshDrafts();
      setSuccessMessage(
        mode === "draft"
          ? "Draft saved successfully"
          : data.message || "Resume saved successfully.",
      );

      if (mode === "resume" || mode === "hard-copy") {
        try {
          await exportResumePdf(resumeForSave, {
            previewElement: previewRef.current,
            resumePhoto,
            hardCopyMode: mode === "hard-copy",
          });
        } catch (exportError) {
          setExportError(exportError?.message || "Resume saved successfully, but PDF export failed.");
        }
      }

      const elapsed = Date.now() - saveStartedAt;
      if (elapsed < MIN_SAVE_FEEDBACK_MS) {
        await new Promise((resolve) => window.setTimeout(resolve, MIN_SAVE_FEEDBACK_MS - elapsed));
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          (mode === "draft"
            ? "Unable to save your draft. Please try again."
            : "Unable to save resume. Please try again."),
      );
    } finally {
      setSaveAction("");
    }
  };

  const handleSaveDraft = async () => {
    await persistResume("draft");
  };

  const handleSave = async () => {
    await persistResume("resume");
  };

  const handleSaveHardCopy = async () => {
    await persistResume("hard-copy");
  };

  const handlePhotoUpload = async (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file for the resume photo.");
      setSuccessMessage("");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Resume photo must be 2 MB or smaller.");
      setSuccessMessage("");
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to read the selected image."));
        reader.readAsDataURL(file);
      });

      const image = await new Promise((resolve, reject) => {
        const nextImage = new Image();
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = () => reject(new Error("Unable to load the selected image."));
        nextImage.src = src;
      });

      const normalizedSrc = await new Promise((resolve, reject) => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth || image.width || 1;
          canvas.height = image.naturalHeight || image.height || 1;
          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Unable to prepare the selected image."));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/png"));
        } catch (canvasError) {
          reject(new Error("Unable to prepare the selected image."));
        }
      });

      const dimensions = {
        width: image.naturalWidth || image.width || 0,
        height: image.naturalHeight || image.height || 0,
      };

      setResumePhoto({
        src: normalizedSrc,
        name: file.name,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
        placement: defaultResumePhotoPlacement,
        crop: defaultResumePhotoCrop,
        frameScale: defaultResumePhotoFrameScale,
        zoom: 1,
      });
      setSuccessMessage("Resume photo uploaded. Place it in the preview, then zoom and adjust it inside the circle.");
    } catch (photoError) {
      setError(photoError.message || "Unable to upload the selected image.");
      setSuccessMessage("");
    }
  };

  const handlePhotoRemove = () => {
    setResumePhoto(null);
    setSuccessMessage("Resume photo removed.");
  };

  const handlePhotoPlacementChange = (placement) => {
    setResumePhoto((prev) => (prev ? { ...prev, placement } : prev));
  };

  const handlePhotoCropChange = (crop) => {
    setResumePhoto((prev) => (prev ? { ...prev, crop: { ...prev.crop, ...crop } } : prev));
  };

  const handlePhotoZoomChange = (zoom) => {
    setResumePhoto((prev) => (prev ? { ...prev, zoom } : prev));
  };

  const handlePhotoFrameScaleChange = (frameScale) => {
    setResumePhoto((prev) => (prev ? { ...prev, frameScale } : prev));
  };

  const handleImportResume = async () => {
    if (!resumeImportFile) {
      setError("Please choose a PDF, DOCX, or TXT resume to import.");
      setSuccessMessage("");
      return;
    }

    if (!confirmUnsavedChanges()) {
      return;
    }

    setImportingResume(true);
    setError("");
    setSuccessMessage("");
    setAiInsights(null);

    const payload = new FormData();
    payload.append("file", resumeImportFile);

    try {
      const { data } = await axiosInstance.post(API.importResumeFile, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const importedResume = normalizeResumeForBuilder(data.resume || {}, formData.template, {
        resumeText: data.extractedText,
        fileName: data.fileName || resumeImportFile.name,
      });

      setFormData((prev) => ({
        ...defaultResumeState,
        ...importedResume,
        template: prev.template || importedResume.template || defaultResumeState.template,
      }));
      setActiveResumeId(null);
      setSuccessMessage(
        "Resume imported into the builder. Review the extracted sections, then use the AI tools or save your upgraded draft.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.details ||
        requestError.response?.data?.detail ||
        requestError.response?.data?.error ||
          "Unable to import this resume right now. Try a clean PDF, DOCX, or TXT file.",
      );
    } finally {
      setImportingResume(false);
    }
  };

  const handleBeginFromScratch = () => {
    if (!confirmUnsavedChanges()) {
      return;
    }

    const blankResume = {
      ...defaultResumeState,
      template: formData.template || defaultResumeState.template,
    };
    setFormData(blankResume);
    setActiveResumeId(null);
    setLastSavedSnapshot(serializeResumeState(blankResume));
    setResumePhoto(null);
    setResumeImportFile(null);
    setError("");
    setSuccessMessage("");
    setSummaryUpdateSuccess(false);
    setAiInsights(null);
  };

  const handleOpenDraft = async (resumeId) => {
    if (!isAuthenticated) {
      redirectToLogin("Please log in to open your saved resume drafts.");
      return;
    }

    if (!confirmUnsavedChanges()) {
      return;
    }

    setSaveAction(`open-${resumeId}`);
    setError("");
    setSuccessMessage("");

    try {
      const { data } = await axiosInstance.get(API.getResumeDraft(resumeId));
      const loadedResume = normalizeResumeForBuilder(data.resume || {});
      setFormData(loadedResume);
      setActiveResumeId(data.resumeId || resumeId);
      setLastSavedSnapshot(serializeResumeState(loadedResume));
      setResumeImportFile(null);
      setResumePhoto(null);
      setSuccessMessage("Draft opened. Continue editing from where you left off.");
      await refreshDrafts();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to open this draft right now.",
      );
    } finally {
      setSaveAction("");
    }
  };

  const handleDiscardResume = async () => {
    const confirmed = window.confirm(
      activeResumeId
        ? "Discard this saved resume draft? This removes it from your draft list."
        : "Discard this unsaved resume and reset the builder?",
    );

    if (!confirmed) {
      return;
    }

    setSaveAction("discard");
    setError("");
    setSuccessMessage("");

    try {
      if (activeResumeId && isAuthenticated) {
        await axiosInstance.delete(API.discardResumeDraft(activeResumeId));
        await refreshDrafts();
      }

      const blankResume = normalizeResumeForBuilder(defaultResumeState);
      setFormData(blankResume);
      setActiveResumeId(null);
      setLastSavedSnapshot(serializeResumeState(blankResume));
      setResumePhoto(null);
      setResumeImportFile(null);
      setAiInsights(null);
      setSuccessMessage("Resume discarded. The builder is ready for a new resume.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to discard this resume right now.",
      );
    } finally {
      setSaveAction("");
    }
  };

  const deriveSkillSeed = () => {
    const candidates = [
      formData.personalInfo.title,
      formData.summary,
      ...formData.experience.flatMap((item) => [item.role, item.company, item.description]),
      ...(formData.projects || []).flatMap((item) => [item.name, ...(item.bullets || [])]),
      ...formData.education.flatMap((item) => [item.degree, item.fieldOfStudy]),
    ]
      .filter(Boolean)
      .join(" ");

    const tokens = candidates.match(/[A-Za-z][A-Za-z.+#-]{2,}/g) || [];
    return Array.from(new Set(tokens)).slice(0, 5);
  };

  const handleAIAction = async (action) => {
    setAiLoading(action);
    setError("");
    setSuccessMessage("");
    setAiInsights(null);
    if (action === "summary") {
      setSummaryUpdateSuccess(false);
    }

    try {
      if (action === "summary") {
        const { data } = await axiosInstance.post(API.aiSummary, {
          resumeData: formData,
        });

        if (typeof data.summary === "string") {
          setFormData((prev) => ({ ...prev, summary: data.summary }));
        }
        setSummaryUpdateSuccess(true);
        return;
      }

      if (action === "skills") {
        const cleanedSkills = flattenSkillCategories(formData.skills);
        const skillSeed = cleanedSkills.length ? cleanedSkills : deriveSkillSeed();

        if (!skillSeed.length) {
          setError("Add a title, summary, or experience first so AI can suggest relevant skills.");
          return;
        }

        const { data } = await axiosInstance.post(API.aiSkills, {
          resumeData: formData,
          existingSkills: skillSeed,
        });

        setAiInsights({
          title: "Suggested Skills",
          lines: buildConciseInsights([
            ...(Array.isArray(data.suggestedSkills) ? data.suggestedSkills : []),
            data.reasoning ? `Why: ${data.reasoning}` : null,
          ]),
        });
        setSuccessMessage(data.message || "Skill suggestions generated successfully.");
        return;
      }

      const { data } = await axiosInstance.post(API.aiOptimize, {
        resumeData: formData,
      });

      const improvementLines = Array.isArray(data.improvements)
        ? data.improvements.map((item) =>
            typeof item === "string"
              ? item
              : `${item.section}: ${item.suggested} (${item.reason})`,
          )
        : [];

      setAiInsights({
        title: "Optimization Suggestions",
        lines: buildConciseInsights([
          ...(Array.isArray(data.priorityImprovements) ? data.priorityImprovements : []),
          ...(data.overallAssessment ? [data.overallAssessment] : []),
          ...improvementLines,
        ]),
      });
      setSuccessMessage(data.message || "Resume optimization suggestions generated.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          requestError.response?.data?.details ||
          "Unable to complete the AI request right now.",
      );
    } finally {
      setAiLoading("");
    }
  };

  const activeDraft = drafts.find((d) => d.id === activeResumeId);
  const activeDocumentTitle =
    activeDraft?.title ||
    (formData?.personalInfo?.firstName
      ? `${formData.personalInfo.firstName}'s Resume`
      : "Untitled Resume");

  return (
    <main className="page-shell max-w-[96rem]">
        <div className="reveal-up delay-1 space-y-6">
          {/* Sleek Document Identity & Studio Command Bar */}
          <section className="glass-card p-3.5 sm:p-4 shadow-sm border border-slate-300 relative z-40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Document Info & Status */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-200/50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                      {activeDocumentTitle}
                    </h2>
                    {activeResumeId ? (
                      <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 shadow-xs">
                        Saved Draft
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                        New Document
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    {hasUnsavedChanges ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md ring-1 ring-amber-200/60">
                        <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                        Unsaved changes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md ring-1 ring-emerald-200/60">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        All changes saved
                      </span>
                    )}
                    {activeDraft?.updated_at ? (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="hidden sm:inline">Saved {formatDraftTimestamp(activeDraft.updated_at)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right: Actions (My Resumes dropdown + Start New) */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Drafts Dropdown Popover */}
                <div className="relative" ref={draftsDropdownRef}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 shadow-xs active:scale-95"
                    onClick={() => setIsDraftsDropdownOpen((open) => !open)}
                    aria-expanded={isDraftsDropdownOpen}
                  >
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>My Resumes ({drafts.length})</span>
                    <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isDraftsDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDraftsDropdownOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-300 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Saved Drafts</p>
                        <button
                          type="button"
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          onClick={() => {
                            setIsDraftsDropdownOpen(false);
                            handleBeginFromScratch();
                          }}
                        >
                          + New Blank
                        </button>
                      </div>

                      <div className="mt-1 max-h-64 overflow-y-auto space-y-1">
                        {loadingDrafts ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            <Loader label="Loading drafts..." />
                          </div>
                        ) : drafts.length ? (
                          drafts.map((draft) => (
                            <button
                              key={draft.id}
                              type="button"
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                                activeResumeId === draft.id
                                  ? "bg-indigo-50/80 font-semibold text-indigo-950 ring-1 ring-indigo-500/20"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                              onClick={() => {
                                setIsDraftsDropdownOpen(false);
                                handleOpenDraft(draft.id);
                              }}
                              disabled={Boolean(saveAction)}
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{draft.title || "Untitled resume"}</p>
                                <p className="text-[11px] text-slate-400">
                                  {saveAction === `open-${draft.id}` ? "Opening..." : `Updated ${formatDraftTimestamp(draft.updated_at)}`}
                                </p>
                              </div>
                              {activeResumeId === draft.id && (
                                <span className="shrink-0 rounded-md bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                  Active
                                </span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="py-6 text-center text-xs text-slate-500">
                            No saved drafts yet. Click &quot;Save Draft&quot; in the toolbar to save.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Start New Resume */}
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-400 hover:text-indigo-900 shadow-xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleBeginFromScratch}
                  disabled={Boolean(saveAction)}
                  title="Start a new blank resume"
                >
                  <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New</span>
                </button>
              </div>
            </div>
          </section>
          <ResumeForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onSaveHardCopy={handleSaveHardCopy}
            onSaveDraft={handleSaveDraft}
            onAIAction={handleAIAction}
            onImportResume={handleImportResume}
            onBeginFromScratch={handleBeginFromScratch}
            onDiscardResume={handleDiscardResume}
            onImportFileChange={setResumeImportFile}
            importFile={resumeImportFile}
            importLoading={importingResume}
            saveAction={saveAction}
            aiLoading={aiLoading}
            error={error}
            successMessage={successMessage}
            exportError={exportError}
            summaryUpdateSuccess={summaryUpdateSuccess}
            aiInsights={aiInsights}
            resumePhoto={resumePhoto}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
            onPhotoPlacementChange={handlePhotoPlacementChange}
            onPhotoCropChange={handlePhotoCropChange}
            onPhotoZoomChange={handlePhotoZoomChange}
            onPhotoFrameScaleChange={handlePhotoFrameScaleChange}
            previewRef={previewRef}
          />
        </div>
    </main>
  );
}

export default ResumeBuilder;
