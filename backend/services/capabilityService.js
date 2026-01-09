const AGENCIES = [
    "DOD", "Department of Defense", "Army", "Navy", "Air Force", "USMC", "Marines",
    "DHS", "Homeland Security", "CBP", "TSA", "FEMA", "ICE",
    "HHS", "Health and Human Services", "CMS", "NIH", "CDC", "FDA",
    "VA", "Veterans Affairs",
    "GSA", "General Services Administration",
    "NASA", "DOT", "Transportation", "FAA",
    "DOE", "Energy", "USDA", "Agriculture",
    "DOC", "Commerce", "NOAA", "NIST",
    "DOJ", "Justice", "FBI", "DEA",
    "DOS", "State Department", "USAID",
    "Treasury", "IRS"
];

const SKILLS = [
    "Cybersecurity", "Zero Trust", "RMF", "ATO", "IAM", "Penetration Testing",
    "Cloud Migration", "AWS", "Azure", "Google Cloud", "DevSecOps", "CI/CD",
    "Software Development", "Agile", "Scrum", "Java", "Python", ".NET", "React", "Angular",
    "Data Analytics", "Big Data", "Machine Learning", "AI", "Artificial Intelligence", "NLP",
    "IT Support", "Help Desk", "Service Desk", "Network Engineering", "Systems Administration",
    "Facility Management", "Logistics", "Supply Chain", "Staffing", "Program Management"
];

exports.analyzeCapabilityText = (text) => {
    if (!text) return { naics: [], agencies: [], skills: [] };

    const normalizedText = text.toUpperCase();

    // 1. Extract NAICS Codes (6 digits, often starting with 541, 518, etc for tech/services)
    // We look for 6 digit numbers. To reduce false positives, we might filter widely known non-NAICS numbers if needed.
    const naicsRegex = /\b\d{6}\b/g;
    const foundNaics = text.match(naicsRegex) || [];

    // 2. Extract Agencies
    const foundAgencies = new Set();
    AGENCIES.forEach(agency => {
        if (normalizedText.includes(agency.toUpperCase())) {
            // Map full names to acronyms if desired, or just store what was found.
            // For simplicity, store the keyword found, or map nicely.
            foundAgencies.add(agency);
        }
    });

    // 3. Extract Skills
    const foundSkills = new Set();
    SKILLS.forEach(skill => {
        if (normalizedText.includes(skill.toUpperCase())) {
            foundSkills.add(skill);
        }
    });

    return {
        naics: [...new Set(foundNaics)], // Remove duplicates
        agencies: Array.from(foundAgencies),
        skills: Array.from(foundSkills)
    };
};
