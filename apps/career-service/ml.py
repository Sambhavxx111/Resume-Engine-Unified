import math
import re
from collections import Counter


SKILL_PATTERNS = {
    'Python': r'\bpython\b',
    'JavaScript': r'\bjavascript\b|\bjs\b',
    'TypeScript': r'\btypescript\b|\bts\b',
    'React': r'\breact\b|\breactjs\b',
    'Node.js': r'\bnode\.?js\b|\bnodejs\b',
    'Express': r'\bexpress\b',
    'FastAPI': r'\bfastapi\b',
    'Django': r'\bdjango\b',
    'Flask': r'\bflask\b',
    'Java': r'\bjava\b',
    'SQL': r'\bsql\b',
    'MySQL': r'\bmysql\b',
    'PostgreSQL': r'\bpostgresql\b|\bpostgres\b',
    'MongoDB': r'\bmongodb\b',
    'Docker': r'\bdocker\b',
    'Kubernetes': r'\bkubernetes\b|\bk8s\b',
    'AWS': r'\baws\b|\bamazon web services\b',
    'Azure': r'\bazure\b',
    'GCP': r'\bgcp\b|\bgoogle cloud\b',
    'Git': r'\bgit\b|\bgithub\b',
    'REST APIs': r'\brest\b|\bapi\b',
    'HTML': r'\bhtml\b',
    'CSS': r'\bcss\b',
    'Tailwind CSS': r'\btailwind\b',
    'Machine Learning': r'\bmachine learning\b|\bml\b',
    'TensorFlow': r'\btensorflow\b',
    'PyTorch': r'\bpytorch\b',
    'Pandas': r'\bpandas\b',
    'NumPy': r'\bnumpy\b',
    'Scikit-learn': r'\bscikit[- ]learn\b|\bsklearn\b',
    'Power BI': r'\bpower bi\b',
    'Tableau': r'\btableau\b',
}


def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text or '').strip()


def extract_skills(text: str) -> list[str]:
    haystack = (text or '').lower()
    return [
        skill
        for skill, pattern in SKILL_PATTERNS.items()
        if re.search(pattern, haystack, flags=re.IGNORECASE)
    ]


def _tokenize(text: str) -> Counter:
    return Counter(re.findall(r'[a-z0-9\+#\.]{2,}', (text or '').lower()))


def compute_similarity(left: str, right: str) -> float:
    left_counts = _tokenize(left)
    right_counts = _tokenize(right)
    if not left_counts or not right_counts:
        return 0.0

    tokens = set(left_counts) | set(right_counts)
    dot_product = sum(left_counts[token] * right_counts[token] for token in tokens)
    left_norm = math.sqrt(sum(value * value for value in left_counts.values()))
    right_norm = math.sqrt(sum(value * value for value in right_counts.values()))

    if not left_norm or not right_norm:
        return 0.0

    return round(dot_product / (left_norm * right_norm), 4)


def match_skills(skills: list[str], description: str) -> list[str]:
    description_lower = (description or '').lower()
    return [skill for skill in skills if skill.lower() in description_lower]
