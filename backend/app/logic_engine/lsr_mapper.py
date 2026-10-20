# ============================================================
# OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
# Logic Engine: LSR (Life-Saving Rule) Mapper (Python Backend)
# Matches IOGP Report 459 - 9 Life-Saving Rules
# ============================================================

import re
from typing import Dict, List, Any, Optional

LSR_KEYWORD_GROUPS = [
    {
        "code": "LSR-07",
        "title": "LSR-07: H₂S / Toxic Gas Exposure",
        "category": "toxic_gas",
        "pattern": re.compile(
            r"h2s|hydrogen\s+sulphide|toxic\s+gas|ppm\s+(h2s|gas)|gas\s+monitor|eeba|scba|breathing\s+apparatus|respirator|sour\s+(gas|crude)|mercaptan|sulfur\s+dioxide|so2|lethal\s+concentration|gas\s+leak|gas\s+alarm|gas\s+cloud",
            re.IGNORECASE,
        ),
        "base_score": 40,
    },
    {
        "code": "LSR-08",
        "title": "LSR-08: Bypassing Safety Controls",
        "category": "safety_controls",
        "pattern": re.compile(
            r"bypass(ed|ing)?|safety\s+interlock|inhibit|overrid(e|den)|tamper|disabled|safety\s+control|safety\s+critical\s+element|\bsce\b|alarm\s+shelved|defeat(ed|ing)?\s+interlock|relief\s+valve\s+isolated|\bpsv\b\s+gagged",
            re.IGNORECASE,
        ),
        "base_score": 36,
    },
    {
        "code": "LSR-02",
        "title": "LSR-02: Confined Space Entry",
        "category": "confined_space",
        "pattern": re.compile(
            r"confined\s+space|manway|vessel\s+entry|tank\s+(entry|cleaning|inspection)|separator\s+(entry|vessel)|sump(\s+pit)?|mud\s+pit|frac\s+tank|column\s+entry|below\s+grade|enclosed\s+(space|area)|oxygen\s+(deficien\w*|enrich\w*)|atmospheric\s+test(ing)?|hole\s+watch|standby\s+(person|attendant)|trench\s+entry|excavation\s+entry|slug\s+catcher\s+entry",
            re.IGNORECASE,
        ),
        "base_score": 37,
    },
    {
        "code": "LSR-06",
        "title": "LSR-06: Line of Fire & Dropped Objects",
        "category": "line_of_fire",
        "pattern": re.compile(
            r"line\s+of\s+fire|drop\s+zone|exclusion\s+zone|struck\s+by|falling\s+object|dropped\s+object|rotary\s+table|tongs?(\s+swing|\s+line)?|cathead|winch\s+line|snubbing|whipping\s+hose|whip\s*check|pressurized\s+hose|stored\s+energy|pinch\s+point|crush(ed|ing)?\s+hazard|moving\s+machinery|rebound\s+zone|pressure\s+recoil",
            re.IGNORECASE,
        ),
        "base_score": 35,
    },
    {
        "code": "LSR-01",
        "title": "LSR-01: Energy Isolation / LOTO",
        "category": "energy_isolation",
        "pattern": re.compile(
            r"loto|lockout|tagout|lock.out|tag.out|isolat(ed|ion)|manifold\s+isolation|depressuri[sz]|esd\s+valve|bleed\s+down|blind(ing)?|spade|double\s+block|dbb|hazardous\s+energy|live\s+circuit|electrical\s+isolation|zero\s+energy|de-energiz|trapped\s+pressure|unrelieved\s+pressure|residual\s+pressure",
            re.IGNORECASE,
        ),
        "base_score": 38,
    },
    {
        "code": "LSR-04",
        "title": "LSR-04: Hot Work",
        "category": "hot_work",
        "pattern": re.compile(
            r"hot\s+work|grinding|welding|weld(er|ing)?|open\s+flame|explosive\s+atmospher|lel|spark|ignition|combustible|cutting\s+torch|brazing|gas\s+free|hydrocarbon\s+vapou?r|flammable\s+gas|fire\s+watch",
            re.IGNORECASE,
        ),
        "base_score": 36,
    },
    {
        "code": "LSR-03",
        "title": "LSR-03: Working at Height",
        "category": "working_at_height",
        "pattern": re.compile(
            r"height|meter(s)?\s+height|monkey\s+board|scaffold(ing)?|ladder|fall\s+(arrest|protection|hazard)|lanyard|harness|tie.off|derrick|mast|elevated\s+platform|work\s+basket|man\s+basket|floor\s+opening|open\s+hatch|handrail\s+missing|edge\s+protection",
            re.IGNORECASE,
        ),
        "base_score": 35,
    },
    {
        "code": "LSR-09",
        "title": "LSR-09: Mechanical Lifting Operations",
        "category": "lifting",
        "pattern": re.compile(
            r"crane|suspended\s+load|rigging|sling(s)?|hoist(ing)?|bop\s+(handling|lift)|tubular\s+lift|lifting\s+(gear|ops|operation)|spreader\s+bar|tag\s+line|shackle|load\s+line|banksman|rigger|crane\s+hook|winch\s+drum",
            re.IGNORECASE,
        ),
        "base_score": 34,
    },
    {
        "code": "LSR-05",
        "title": "LSR-05: Driving & Vehicle Safety",
        "category": "driving",
        "pattern": re.compile(
            r"driv(ing|er)|vehicle|seatbelt|speed(ing)?|escort|transport|trailer|km\/h|road|tanker|bowser|journey\s+management|rollover|forklift|heavy\s+truck",
            re.IGNORECASE,
        ),
        "base_score": 30,
    },
]

def classify_lsr(narrative: str) -> Dict[str, Any]:
    all_matches = []
    for group in LSR_KEYWORD_GROUPS:
        if group["pattern"].search(narrative):
            all_matches.append({
                "code": group["code"],
                "title": group["title"],
                "category": group["category"],
            })
            
    if all_matches:
        primary = all_matches[0]
        secondary = all_matches[1:]
        return {
            "code": primary["code"],
            "title": primary["title"],
            "matchType": "RULE_MATCHED",
            "matchedCategory": primary["category"],
            "secondaryMatches": secondary if secondary else None,
        }
        
    return {
        "code": "LSR-08",
        "title": "LSR-08: Bypassing Safety Controls",
        "matchType": "DEFAULT",
        "matchedCategory": "general",
        "secondaryMatches": None,
    }

def get_lsr_base_score(narrative: str) -> int:
    for group in LSR_KEYWORD_GROUPS:
        if group["pattern"].search(narrative):
            return group["base_score"]
    return 15
