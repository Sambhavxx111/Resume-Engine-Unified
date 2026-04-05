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

  if (cleaned.length <= 115) {
    return cleaned;
  }

  return `${cleaned.slice(0, 112).trimEnd()}...`;
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
  skills: [],
  summary: "",
  customSections: [],
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
            },
            education:
              Array.isArray(data.resume.education) && data.resume.education.length
                ? data.resume.education
                : defaultResumeState.education,
            experience:
              Array.isArray(data.resume.experience) && data.resume.experience.length
                ? data.resume.experience
                : defaultResumeState.experience,
            skills: Array.isArray(data.resume.skills) ? data.resume.skills : [],
            customSections: Array.isArray(data.resume.customSections)
              ? data.resume.customSections
              : [],
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
      await exportResumePdf(formData, previewRef.current);
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
        },
        education:
          Array.isArray(data.resume?.education) && data.resume.education.length
            ? data.resume.education
            : defaultResumeState.education,
        experience:
          Array.isArray(data.resume?.experience) && data.resume.experience.length
            ? data.resume.experience
            : defaultResumeState.experience,
        skills: Array.isArray(data.resume?.skills) ? data.resume.skills : [],
        customSections: Array.isArray(data.resume?.customSections)
          ? data.resume.customSections
          : [],
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
          existingSkills: skillSeed,
        });

        if (Array.isArray(data.suggestedSkills)) {
          setFormData((prev) => ({
            ...prev,
            skills: Array.from(new Set([...prev.skills, ...data.suggestedSkills])),
          }));
        }

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
    <main className="page-shell">
      {loadingResume ? (
        <div className="glass-card flex min-h-[300px] items-center justify-center p-8">
          <Loader label="Fetching your resume..." />
        </div>
      ) : (
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
          previewRef={previewRef}
        />
      )}
    </main>
  );
}

export default ResumeBuilder;
