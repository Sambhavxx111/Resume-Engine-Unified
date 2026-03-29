import math
import re
from collections import Counter


SKILL_PATTERNS = {
    # Programming / web
    'C': r'(?<![a-z])c(?![a-z\+#])',
    'C++': r'\bc\+\+\b',
    'C#': r'\bc#\b|\basp\.net\b|\bdotnet\b|\b\.net\b',
    'Python': r'\bpython\b',
    'JavaScript': r'\bjavascript\b|\bjs\b',
    'TypeScript': r'\btypescript\b|\bts\b',
    'Java': r'\bjava\b',
    'Go': r'\bgolang\b|\bgo\b',
    'PHP': r'\bphp\b',
    'Ruby': r'\bruby\b',
    'JSP': r'\bjsp\b|\bjava server pages\b',
    'HTML': r'\bhtml\b',
    'CSS': r'\bcss\b',
    'Tailwind CSS': r'\btailwind\b',
    'Bootstrap': r'\bbootstrap\b',
    'React': r'\breact\b|\breactjs\b',
    'Vue': r'\bvue\b|\bvuejs\b',
    'Angular': r'\bangular\b',
    'Node.js': r'\bnode\.?js\b|\bnodejs\b',
    'Express': r'\bexpress\b',
    'FastAPI': r'\bfastapi\b',
    'Django': r'\bdjango\b',
    'Flask': r'\bflask\b',
    'Spring Boot': r'\bspring boot\b|\bspring\b',
    'REST APIs': r'\brest\b|\bapi\b',

    # Databases / data engineering
    'SQL': r'\bsql\b',
    'MySQL': r'\bmysql\b',
    'PostgreSQL': r'\bpostgresql\b|\bpostgres\b',
    'MongoDB': r'\bmongodb\b',
    'Oracle': r'\boracle\b|\bpl/sql\b',
    'Firebase': r'\bfirebase\b',
    'Redis': r'\bredis\b',
    'ETL': r'\betl\b',
    'Data Warehousing': r'\bdata warehousing\b|\bdata warehouse\b',

    # DevOps / cloud / infra
    'Git': r'\bgit\b',
    'GitHub': r'\bgithub\b',
    'Docker': r'\bdocker\b',
    'Kubernetes': r'\bkubernetes\b|\bk8s\b',
    'AWS': r'\baws\b|\bamazon web services\b',
    'Azure': r'\bazure\b',
    'GCP': r'\bgcp\b|\bgoogle cloud\b',
    'Linux': r'\blinux\b',
    'Terraform': r'\bterraform\b',
    'Ansible': r'\bansible\b',
    'Jenkins': r'\bjenkins\b',
    'CI/CD': r'\bci/cd\b|\bcontinuous integration\b|\bcontinuous deployment\b',

    # AI / data science / analytics
    'Machine Learning': r'\bmachine learning\b|\bml\b',
    'Deep Learning': r'\bdeep learning\b',
    'NLP': r'\bnlp\b|\bnatural language processing\b',
    'Computer Vision': r'\bcomputer vision\b',
    'TensorFlow': r'\btensorflow\b',
    'PyTorch': r'\bpytorch\b',
    'Pandas': r'\bpandas\b',
    'NumPy': r'\bnumpy\b',
    'Scikit-learn': r'\bscikit[- ]learn\b|\bsklearn\b',
    'Power BI': r'\bpower bi\b',
    'Tableau': r'\btableau\b',
    'Excel': r'\bexcel\b',
    'Statistics': r'\bstatistics\b|\bstatistical analysis\b',
    'Data Analysis': r'\bdata analysis\b|\bdata analytics\b',

    # Cybersecurity / networking
    'VAPT': r'\bvapt\b|\bvulnerability assessment\b|\bpenetration testing\b',
    'Computer Networking': r'\bcomputer networking\b|\bnetworking\b|\bnetwork security\b',
    'SOC': r'\bsoc\b|\bsecurity operations center\b',
    'Threat Intelligence': r'\bthreat intelligence\b',
    'Malware Analysis': r'\bmalware analysis\b',
    'SIEM': r'\bsiem\b',
    'Digital Forensics': r'\bdigital forensics\b|\bforensics\b',
    'Ethical Hacking': r'\bethical hacking\b',
    'Endpoint Security': r'\bendpoint security\b|\bendpoint security tool\b|\bedr\b|\bxdr\b',
    'Incident Response': r'\bincident response\b',
    'Cybersecurity': r'\bcybersecurity\b|\bcyber security\b|\binformation security\b',

    # Security tools / platforms
    'TryHackMe': r'\btryhackme\b',
    'Kali Linux': r'\bkali linux\b|\bkali\b',
    'Wireshark': r'\bwireshark\b',
    'ANY.RUN': r'\bany\.?\s*run\b',
    'Metasploit': r'\bmetasploit\b',
    'Nmap': r'\bnmap\b',
    'FTK Imager': r'\bftk\s*imager\b|\bftkimager\b',
    'Burp Suite': r'\bburp suite\b|\bburp\b',

    # QA / testing
    'QA': r'\bqa\b|\bquality assurance\b',
    'Manual Testing': r'\bmanual testing\b',
    'Automation Testing': r'\bautomation testing\b|\btest automation\b',
    'Selenium': r'\bselenium\b',

    # Mobile / design / creative
    'Android': r'\bandroid\b',
    'iOS': r'\bios\b',
    'Flutter': r'\bflutter\b',
    'React Native': r'\breact native\b',
    'UI/UX': r'\bui/ux\b|\bui ux\b|\bux design\b|\bui design\b',
    'Figma': r'\bfigma\b',
    'Graphic Design': r'\bgraphic design\b',
    'Photoshop': r'\bphotoshop\b',
    'Illustrator': r'\billustrator\b',
    'Premiere Pro': r'\bpremiere pro\b|\bpremier pro\b',
    'CapCut': r'\bcapcut\b',
    'Canva': r'\bcanva\b',
    'Video Production': r'\bvideo production\b|\bvideo editing\b',
    'Podcast Creation': r'\bpodcast creation\b|\bpodcasting\b|\bpodcast producer\b',
    'Content Creation': r'\bcontent creation\b|\bcontent creator\b',

    # Business / marketing / operations
    'Business Analysis': r'\bbusiness analysis\b|\bbusiness analyst\b',
    'Product Management': r'\bproduct management\b|\bproduct manager\b',
    'Project Management': r'\bproject management\b|\bproject manager\b',
    'Agile': r'\bagile\b',
    'Scrum': r'\bscrum\b',
    'Operations': r'\boperations\b',
    'Risk Management': r'\brisk management\b',
    'Supply Chain': r'\bsupply chain\b',
    'Logistics': r'\blogistics\b',
    'HR': r'\bhr\b|\bhuman resources\b',
    'Recruitment': r'\brecruitment\b|\btalent acquisition\b',
    'Marketing': r'\bmarketing\b',
    'Digital Marketing': r'\bdigital marketing\b',
    'Performance Marketing': r'\bperformance marketing\b',
    'Social Media Marketing': r'\bsocial media marketing\b',
    'Google Analytics': r'\bgoogle analytics\b',
    'HubSpot': r'\bhubspot\b',
    'Meta Ads': r'\bmeta ads\b|\bfacebook ads\b|\bfacebook meta suite\b|\binstagram ads\b',
    'TikTok Ads': r'\btiktok ads\b',
    'SEO': r'\bseo\b|\bsearch engine optimization\b',
    'SEM': r'\bsem\b|\bsearch engine marketing\b|\bgoogle ads\b',
    'Content Writing': r'\bcontent writing\b|\bcontent writer\b',
    'Copywriting': r'\bcopywriting\b|\bcopywriter\b',
    'Branding': r'\bbranding\b',
    'CRM': r'\bcrm\b|\bcustomer relationship management\b',

    # Finance / commerce
    'Finance': r'\bfinance\b',
    'Accounting': r'\baccounting\b|\baccountant\b',
    'Tally': r'\btally\b',
    'Taxation': r'\btaxation\b',
    'Investment Banking': r'\binvestment banking\b',

    # Core engineering / manufacturing
    'Mechanical Engineering': r'\bmechanical engineering\b|\bmechanical engineer\b',
    'Civil Engineering': r'\bcivil engineering\b|\bcivil engineer\b',
    'Electrical Engineering': r'\belectrical engineering\b|\belectrical engineer\b',
    'Electronics': r'\belectronics\b|\belectronics engineer\b',
    'Embedded Systems': r'\bembedded systems\b|\bfirmware\b',
    'AutoCAD': r'\bautocad\b',
    'SolidWorks': r'\bsolidworks\b',
    'CATIA': r'\bcatia\b',
    'MATLAB': r'\bmatlab\b',
    'PLC': r'\bplc\b',

    # Healthcare / education / legal / media
    'Nursing': r'\bnursing\b|\bnurse\b',
    'Pharmacy': r'\bpharmacy\b|\bpharmacist\b',
    'Biotechnology': r'\bbiotechnology\b|\bbiotech\b',
    'Biology': r'\bbiology\b',
    'Chemistry': r'\bchemistry\b',
    'Teaching': r'\bteaching\b|\bteacher\b',
    'Education': r'\beducation\b',
    'Law': r'\blaw\b|\blegal\b',
    'Legal Research': r'\blegal research\b',
    'Journalism': r'\bjournalism\b|\bjournalist\b',
    'Media': r'\bmedia\b|\bcommunications\b',
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
