# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# CSV Ingestion Pipeline Service (Python Backend)
# Mirroring src/lib/csv (Parser, Validator, Cleaner, Normalizer)
# ============================================================

import csv
import io
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Tuple

from app.models.schemas import (
    SafetyIncident,
    Dataset,
    DataQualityReport,
    QualitySummary,
    ColumnIssue,
    PipelineSummary,
    CsvPipelineResult,
    IncidentCategory,
)
from app.logic_engine.analyzer import analyze_narrative

IST = timezone(timedelta(hours=5, minutes=30))

NARRATIVE_ALIASES = [
    "narrative",
    "raw_narrative",
    "description",
    "observation",
    "observation_narrative",
    "incident_narrative",
    "incident_description",
    "unsafe_act_description",
    "unsafe_condition_description",
    "event_narrative",
    "event_description",
    "details",
    "event_details",
    "hazard_details",
    "remarks",
    "findings",
]

SITE_ALIASES = [
    "site",
    "location",
    "site_location",
    "installation",
    "facility",
    "asset",
    "rig",
    "station",
    "plant",
    "well",
]

COLUMN_MAPPINGS = {
    "id": ["id", "incident_id", "report_no", "log_id", "record_id", "reference_no", "sl_no"],
    "site": SITE_ALIASES,
    "basin": ["basin", "region", "field", "area", "operational_basin"],
    "category": ["category", "incident_type", "report_type", "type", "classification", "event_type"],
    "reportedBy": ["reported_by", "reportedby", "observer", "officer", "employee", "reporter", "supervisor", "logged_by"],
    "timestamp": ["timestamp", "date", "datetime", "event_date", "incident_date", "time", "occurred_at"],
    "narrative": NARRATIVE_ALIASES,
}

CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")

def clean_text(text: str) -> Tuple[str, bool, bool]:
    if not text:
        return "", False, False
    
    had_control_chars = bool(CONTROL_CHAR_REGEX.search(text))
    stripped = CONTROL_CHAR_REGEX.sub("", text)
    
    # Normalize unicode quotes and dashes
    normalized = (
        stripped.replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201C", '"')
        .replace("\u201D", '"')
        .replace("\u2013", "-")
        .replace("\u2014", "-")
    )
    
    had_whitespace_issues = bool(re.search(r"\s{2,}", normalized) or re.search(r"^\s|\s$", normalized))
    cleaned = re.sub(r"[ \t]+", " ", normalized).strip()
    return cleaned, had_control_chars, had_whitespace_issues

def clean_date(val: str) -> str:
    if not val or not val.strip():
        now = datetime.now(IST)
        return now.strftime("%d %b %Y, %H:%M IST")
        
    trimmed = val.strip()
    # Try common date formats
    for fmt in [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%d-%m-%Y %H:%M",
        "%d-%m-%Y",
        "%d %b %Y, %H:%M IST",
        "%d %b %Y %H:%M",
    ]:
        try:
            dt = datetime.strptime(trimmed.replace("Z", ""), fmt)
            return dt.strftime("%d %b %Y, %H:%M IST")
        except ValueError:
            continue
            
    return trimmed

def is_alias_match(header: str, candidate: str) -> bool:
    h_norm = re.sub(r"[\s\-_]+", "", header.lower().strip())
    c_norm = re.sub(r"[\s\-_]+", "", candidate.lower().strip())
    return h_norm == c_norm or c_norm in h_norm or (len(h_norm) >= 4 and h_norm in c_norm)

def find_mapped_value(row: Dict[str, str], candidates: List[str]) -> Optional[str]:
    for candidate in candidates:
        for k, v in row.items():
            if is_alias_match(k, candidate) and v and str(v).strip():
                return str(v).strip()
    return None

def parse_category(raw_cat: Optional[str]) -> IncidentCategory:
    if not raw_cat:
        return "UNSAFE_CONDITION"
    lower = raw_cat.lower()
    if "act" in lower or "behavior" in lower:
        return "UNSAFE_ACT"
    if "near" in lower or "miss" in lower:
        return "NEAR_MISS"
    return "UNSAFE_CONDITION"

def parse_csv_content(content: str) -> Tuple[List[str], List[Dict[str, str]]]:
    # Sniff delimiter if possible, default to comma
    sample = content[:2048] if len(content) > 2048 else content
    delimiter = ","
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
        delimiter = dialect.delimiter
    except Exception:
        delimiter = ","
        
    reader = csv.reader(io.StringIO(content), delimiter=delimiter)
    rows_raw = list(reader)
    if not rows_raw:
        return [], []
        
    headers = [h.strip() for h in rows_raw[0] if h.strip()]
    rows = []
    for r in rows_raw[1:]:
        if not any(cell.strip() for cell in r):
            continue
        row_dict = {}
        for i, h in enumerate(headers):
            row_dict[h] = r[i].strip() if i < len(r) else ""
        rows.append(row_dict)
        
    return headers, rows

def validate_csv_data(headers: List[str], rows: List[Dict[str, str]]) -> Dict[str, Any]:
    issues = []
    has_narrative_header = any(
        any(is_alias_match(h, a) for a in NARRATIVE_ALIASES)
        for h in headers
    )
    
    missing_crucial_headers = []
    if not has_narrative_header:
        missing_crucial_headers.append("Narrative/Description (Required for NLP & SIF Analysis)")
        
    valid_count = 0
    invalid_count = 0
    warning_count = 0
    
    for idx, row in enumerate(rows):
        row_num = idx + 1
        row_has_error = False
        row_has_warning = False
        
        narrative_val = find_mapped_value(row, NARRATIVE_ALIASES)
        if not narrative_val:
            issues.append({
                "rowNumber": row_num,
                "field": "narrative",
                "type": "ERROR",
                "message": "Empty observation narrative: cannot perform SIF analysis.",
            })
            row_has_error = True
        elif len(narrative_val) < 8:
            issues.append({
                "rowNumber": row_num,
                "field": "narrative",
                "type": "WARNING",
                "message": "Extremely brief narrative text: risk score confidence may be degraded.",
            })
            row_has_warning = True
            
        site_val = find_mapped_value(row, SITE_ALIASES)
        if not site_val:
            issues.append({
                "rowNumber": row_num,
                "field": "site",
                "type": "WARNING",
                "message": "Missing site location: will default to Brahmaputra Basin Installation.",
            })
            row_has_warning = True
            
        if row_has_error:
            invalid_count += 1
        else:
            valid_count += 1
            if row_has_warning:
                warning_count += 1
                
    is_valid = len(missing_crucial_headers) == 0 and valid_count > 0
    return {
        "isValid": is_valid,
        "totalRows": len(rows),
        "validRowCount": valid_count,
        "invalidRowCount": invalid_count,
        "warningRowCount": warning_count,
        "issues": issues,
        "missingCrucialHeaders": missing_crucial_headers,
    }

def clean_csv_data(rows: List[Dict[str, str]]) -> Tuple[List[Dict[str, str]], Dict[str, int]]:
    control_stripped = 0
    whitespace_fixed = 0
    duplicates = 0
    dates_standardized = 0
    seen_narratives = set()
    cleaned_rows = []
    
    for row in rows:
        cleaned_row = {}
        row_had_control = False
        row_had_whitespace = False
        
        for k, v in row.items():
            cleaned_val, had_c, had_w = clean_text(str(v or ""))
            if had_c:
                row_had_control = True
            if had_w:
                row_had_whitespace = True
                
            if re.search(r"date|time|timestamp", k, re.IGNORECASE):
                std_date = clean_date(cleaned_val)
                if std_date != cleaned_val:
                    dates_standardized += 1
                cleaned_row[k] = std_date
            else:
                cleaned_row[k] = cleaned_val
                
        if row_had_control:
            control_stripped += 1
        if row_had_whitespace:
            whitespace_fixed += 1
            
        narrative_val = find_mapped_value(cleaned_row, NARRATIVE_ALIASES)
        if narrative_val and len(narrative_val) > 10:
            norm_key = re.sub(r"[^a-z0-9]", "", narrative_val.lower())
            if norm_key in seen_narratives:
                duplicates += 1
            else:
                seen_narratives.add(norm_key)
                
        cleaned_rows.append(cleaned_row)
        
    report = {
        "totalCleaned": len(cleaned_rows),
        "duplicateCount": duplicates,
        "controlCharactersStripped": control_stripped,
        "whitespaceFixed": whitespace_fixed,
        "datesStandardized": dates_standardized,
    }
    return cleaned_rows, report

def normalize_csv_rows(
    cleaned_rows: List[Dict[str, str]],
    start_id_index: int = 2001,
    dataset_id: Optional[str] = None,
) -> List[SafetyIncident]:
    incidents: List[SafetyIncident] = []
    default_basin = "Assam Operational Basin"
    default_site = "Brahmaputra Basin Asset"
    now_ist = datetime.now(IST).strftime("%d %b %Y, %H:%M IST")
    
    for idx, row in enumerate(cleaned_rows):
        raw_narrative = find_mapped_value(row, COLUMN_MAPPINGS["narrative"]) or "Routine observation recorded during tour shift."
        site = find_mapped_value(row, COLUMN_MAPPINGS["site"]) or default_site
        basin = find_mapped_value(row, COLUMN_MAPPINGS["basin"]) or default_basin
        reported_by = find_mapped_value(row, COLUMN_MAPPINGS["reportedBy"]) or "Field HSSE Observer"
        category = parse_category(find_mapped_value(row, COLUMN_MAPPINGS["category"]))
        timestamp = find_mapped_value(row, COLUMN_MAPPINGS["timestamp"]) or now_ist
        custom_id = find_mapped_value(row, COLUMN_MAPPINGS["id"]) or f"OIL-2026-{start_id_index + idx}"
        
        # Run SIF Logic Engine
        analysis = analyze_narrative(raw_narrative, site)
        
        truncated_narrative = (
            raw_narrative[:117] + "..." if len(raw_narrative) > 120 else raw_narrative
        )
        
        incidents.append(
            SafetyIncident(
                id=custom_id,
                timestamp=timestamp,
                site=site,
                basin=basin,
                reportedBy=reported_by,
                category=category,
                rawNarrative=raw_narrative,
                truncatedNarrative=truncated_narrative,
                riskScore=analysis["risk"]["score"],
                riskLevel=analysis["risk"]["level"],
                isSifPrecursor=analysis["isSifPrecursor"],
                lsrCategory=analysis["lsr"]["code"],
                lsrTitle=analysis["lsr"]["title"],
                validationStatus="PENDING",
                lsrViolations=analysis["lsrViolations"],
                xaiTriggers=analysis["xaiTriggers"],
                hierarchyActions=analysis["hierarchyActions"],
                escalationLikelihood=analysis.get("escalationLikelihood"),
                datasetId=dataset_id,
            )
        )
        
    return incidents

def process_csv_pipeline(
    content: str,
    filename: str,
    uploaded_by: str = "T. Baruah (Chief HSSE Supt.)",
) -> CsvPipelineResult:
    now_ist = datetime.now(IST).strftime("%d %b %Y, %H:%M IST")
    dataset_id = str(uuid.uuid4())
    
    # 1. Parse
    headers, rows = parse_csv_content(content)
    if not headers or not rows:
        raise ValueError("CSV file is empty or could not be parsed.")
        
    # 2. Validate
    validation = validate_csv_data(headers, rows)
    if not validation["isValid"] and validation["missingCrucialHeaders"]:
        missing = ", ".join(validation["missingCrucialHeaders"])
        raise ValueError(f"Dataset Validation Failed: Missing required column(s): {missing}")
        
    # 3. Clean
    cleaned_rows, cleaning_report = clean_csv_data(rows)
    
    # 4. Normalize & SIF Inference
    incidents = normalize_csv_rows(
        cleaned_rows,
        start_id_index=1050 + (int(datetime.now().timestamp()) % 500),
        dataset_id=dataset_id,
    )
    
    sif_count = sum(1 for i in incidents if i.isSifPrecursor)
    critical_count = sum(1 for i in incidents if i.riskLevel == "CRITICAL")
    
    # 5. Dataset Model
    dataset = Dataset(
        id=dataset_id,
        filename=filename,
        uploadedAt=now_ist,
        uploadedBy=uploaded_by,
        status="READY",
        totalRows=len(rows),
        validRows=validation["validRowCount"],
        invalidRows=validation["invalidRowCount"],
        warningRows=validation["warningRowCount"],
    )
    
    # 6. Quality Report
    column_issues = []
    for col in headers:
        missing_count = sum(1 for r in rows if not r.get(col, "").strip())
        sample_issues = [f"{missing_count} rows have blank values"] if missing_count > 0 else []
        column_issues.append(
            ColumnIssue(
                column=col,
                missingCount=missing_count,
                invalidCount=0,
                sampleIssues=sample_issues,
            )
        )
        
    quality_report = DataQualityReport(
        datasetId=dataset_id,
        generatedAt=now_ist,
        filename=filename,
        totalRows=len(rows),
        validRows=validation["validRowCount"],
        invalidRows=validation["invalidRowCount"],
        warningRows=validation["warningRowCount"],
        cleanRate=int(round((validation["validRowCount"] / max(len(rows), 1)) * 100)),
        negationsPreserved=sum(len(i.xaiTriggers) for i in incidents if any(x.isNegation for x in i.xaiTriggers)),
        summary=QualitySummary(
            totalRows=len(rows),
            validRows=validation["validRowCount"],
            invalidRows=validation["invalidRowCount"],
            warningRows=validation["warningRowCount"],
            duplicateRows=cleaning_report["duplicateCount"],
        ),
        columnIssues=column_issues,
    )
    
    summary = PipelineSummary(
        totalRows=len(rows),
        validRows=validation["validRowCount"],
        invalidRows=validation["invalidRowCount"],
        warningRows=validation["warningRowCount"],
        sifCount=sif_count,
        criticalCount=critical_count,
    )
    
    return CsvPipelineResult(
        dataset=dataset,
        incidents=incidents,
        qualityReport=quality_report,
        summary=summary,
    )
