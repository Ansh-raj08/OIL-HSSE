# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Logic Engine: Negation Detector (Python Backend)
# ============================================================

import re
from typing import List, Dict, Any

NEGATION_PATTERNS = [
    ("without", re.compile(r"without\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("not", re.compile(r"\bnot\s+([a-z0-9\s/\-]{3,30})", re.IGNORECASE)),
    ("no", re.compile(r"\bno\s+([a-z0-9\s/\-]{3,30})", re.IGNORECASE)),
    ("never", re.compile(r"\bnever\s+([a-z0-9\s/\-]{3,30})", re.IGNORECASE)),
    ("bypassed", re.compile(r"bypassed\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("unhooked", re.compile(r"unhooked\s+([a-z0-9\s/\-]{3,30})", re.IGNORECASE)),
    ("failed to", re.compile(r"failed\s+to\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("did not", re.compile(r"did\s+not\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("zero", re.compile(r"\bzero\s+([a-z0-9\s/\-]{3,30})", re.IGNORECASE)),
    ("missing", re.compile(r"\bmissing\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("lacked", re.compile(r"\black(ed|ing)\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("omitted", re.compile(r"\bomitted\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("in violation of", re.compile(r"in\s+violation\s+of\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("unauthorized", re.compile(r"\bunauthorized\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("unattended", re.compile(r"\bunattended\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("unsecured", re.compile(r"\bunsecured\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
    ("refused to", re.compile(r"refused\s+to\s+([a-z0-9\s/\-]{3,35})", re.IGNORECASE)),
]

BENIGN_ABSENCE_PATTERN = re.compile(
    r"\b(injury|injuries|damage|release|leak|spill|harm|fire|incident|loss|impact|active\s+leak|active\s+release|active\s+fire|hazard\s+found)\b",
    re.IGNORECASE,
)

def detect_negations(narrative: str) -> List[Dict[str, Any]]:
    matches = []
    
    for keyword, regex in NEGATION_PATTERNS:
        for match in regex.finditer(narrative):
            captured_phrase = match.group(0).strip()
            after_keyword = match.group(1) if match.groups() else ""
            
            # Skip benign absence-of-consequence statements
            if BENIGN_ABSENCE_PATTERN.search(after_keyword):
                continue
                
            matches.append({
                "phrase": captured_phrase,
                "negationKeyword": keyword,
                "startIndex": match.start(),
            })
            
    matches.sort(key=lambda x: x["startIndex"])
    return matches
