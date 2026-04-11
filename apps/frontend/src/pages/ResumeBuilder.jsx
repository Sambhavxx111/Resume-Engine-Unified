import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { API } from "../api/services";
import Loader from "../components/Loader";
import ResumeForm from "../components/ResumeForm";
import { exportResumePdf } from "../utils/pdf";
import { useAuth } from "../context/AuthContext";

const TEMPLATE_ID_ALIASES = {
  "executive-edge": "contemporary",
  "classic-core": "single-column",
  "compact-impact": "compact",
  "modern-split": "creative",
  "minimal-grid": "timeline",
};

const normalizeTemplateId = (templateId) => TEMPLATE_ID_ALIASES[templateId] || templateId || "contemporary";

const normalizeImportedName = (value = "") => {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\b([A-Za-z])'([A-Za-z])/g, (_, first, second) => `${first.toUpperCase()}'${second.toUpperCase()}`)
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

const resolveResumeFullName = (personalInfo = {}, resumeText = "", fileName = "") =>
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

const normalizeCustomSections = (customSections = []) =>
  (Array.isArray(customSections) ? customSections : []).filter(
    (section) => !isProjectSectionTitle(section?.title),
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
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    portfolio: "",
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
  skills: [],
  summary: "",
  customSections: [],
};

const defaultResumePhotoPlacement = {
  x: 0.72,
  y: 0.06,
};

function ResumeBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState(defaultResumeState);
  const [loadingResume, setLoadingResume] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState("");
  const [importingResume, setImportingResume] = useState(false);
  const [resumeImportFile, setResumeImportFile] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [aiInsights, setAiInsights] = useState(null);
  const [resumePhoto, setResumePhoto] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    const fetchResume = async () => {
      if (!isAuthenticated) {
        setLoadingResume(false);
        return;
      }

      setLoadingResume(true);
      setError("");

      try {
        const { data } = await axiosInstance.get(API.getResume);
        if (data.resume) {
          setFormData({
            ...defaultResumeState,
            ...data.resume,
            personalInfo: {
              ...defaultResumeState.personalInfo,
              ...(data.resume.personalInfo || {}),
              fullName: resolveResumeFullName(
                data.resume.personalInfo,
                data.resume.raw_text || data.resume.rawText || "",
                "",
              ),
            },
            education:
              Array.isArray(data.resume.education) && data.resume.education.length
                ? data.resume.education.map((item) => ({
                    ...defaultResumeState.education[0],
                    ...(item || {}),
                  }))
                : defaultResumeState.education,
            experience:
              Array.isArray(data.resume.experience) && data.resume.experience.length
                ? data.resume.experience
                : defaultResumeState.experience,
            projects:
              normalizeProjectItems(data.resume.projects, data.resume.customSections),
            skills: Array.isArray(data.resume.skills) ? data.resume.skills : [],
            customSections: normalizeCustomSections(data.resume.customSections),
            template: normalizeTemplateId(data.resume.template) || defaultResumeState.template,
          });
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Unable to fetch resume right now. You can still start from a blank draft.",
        );
      } finally {
        setLoadingResume(false);
      }
    };

    fetchResume();
  }, [isAuthenticated]);

  const redirectToLogin = (authPrompt) => {
    navigate("/login", {
      state: {
        from: location,
        authPrompt,
      },
    });
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      redirectToLogin("Please log in with your personal email to save your resume.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const { data } = await axiosInstance.post(API.saveResume, formData);
      await exportResumePdf(formData, { resumePhoto });
      setSuccessMessage(data.message || "Resume saved successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          "Unable to save resume. Please try again.",
      );
    } finally {
      setSaving(false);
    }
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
      });
      setSuccessMessage("Resume photo uploaded. Drag it inside the preview or use a photo-ready template.");
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

  const handleImportResume = async () => {
    if (!resumeImportFile) {
      setError("Please choose a PDF, DOCX, or TXT resume to import.");
      setSuccessMessage("");
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
      const importedResume = {
        ...defaultResumeState,
        ...(data.resume || {}),
        personalInfo: {
          ...defaultResumeState.personalInfo,
          ...(data.resume?.personalInfo || {}),
          fullName: resolveResumeFullName(
            data.resume?.personalInfo,
            data.extractedText || data.resume?.raw_text || data.resume?.rawText || "",
            data.fileName || resumeImportFile.name,
          ),
        },
        education:
          Array.isArray(data.resume?.education) && data.resume.education.length
            ? data.resume.education.map((item) => ({
                ...defaultResumeState.education[0],
                ...(item || {}),
              }))
            : defaultResumeState.education,
        experience:
          Array.isArray(data.resume?.experience) && data.resume.experience.length
            ? data.resume.experience
            : defaultResumeState.experience,
        projects:
          normalizeProjectItems(data.resume?.projects, data.resume?.customSections),
        skills: Array.isArray(data.resume?.skills) ? data.resume.skills : [],
        customSections: normalizeCustomSections(data.resume?.customSections),
        template: formData.template || defaultResumeState.template,
      };

      setFormData((prev) => ({
        ...defaultResumeState,
        ...importedResume,
        template: prev.template || importedResume.template || defaultResumeState.template,
      }));
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

    try {
      if (action === "summary") {
        const { data } = await axiosInstance.post(API.aiSummary, {
          resumeData: formData,
        });

        if (typeof data.summary === "string") {
          setFormData((prev) => ({ ...prev, summary: data.summary }));
        }

        setAiInsights({
          title: "Generated Summary",
          lines: buildConciseInsights([data.summary]),
        });
        setSuccessMessage(data.message || "Summary generated successfully.");
        return;
      }

      if (action === "skills") {
        const cleanedSkills = formData.skills.map((skill) => skill.trim()).filter(Boolean);
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

  return (
    <main className="page-shell max-w-[96rem]">
      {loadingResume ? (
        <div className="glass-card reveal-soft flex min-h-[300px] items-center justify-center p-8">
          <Loader label="Fetching your resume..." />
        </div>
      ) : (
        <div className="reveal-up delay-1">
          <ResumeForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onAIAction={handleAIAction}
            onImportResume={handleImportResume}
            onImportFileChange={setResumeImportFile}
            importFile={resumeImportFile}
            importLoading={importingResume}
            loading={saving}
            aiLoading={aiLoading}
            error={error}
            successMessage={successMessage}
            aiInsights={aiInsights}
            resumePhoto={resumePhoto}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
            onPhotoPlacementChange={handlePhotoPlacementChange}
            previewRef={previewRef}
          />
        </div>
      )}
    </main>
  );
}

export default ResumeBuilder;
