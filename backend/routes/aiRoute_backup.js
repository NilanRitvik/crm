const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdf = require('pdf-parse');
const Lead = require('../models/Lead');
const Partner = require('../models/Partner');

// Helper to read Company Cap
const getCompanyCap = () => {
    try {
        const capPath = path.join(__dirname, '../../frontend/my-react-app/src/assets/companycap.txt');
        return fs.readFileSync(capPath, 'utf8');
    } catch (err) {
        console.error("Error reading capability statement:", err);
        return "";
    }
};

// Helper: Extract text from PDF attachments
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (err) {
        console.error("Error reading PDF:", err);
        return "";
    }
}

// POST /api/ai/score/:leadId
router.post('/score/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const lead = await Lead.findById(leadId);

        if (!lead) return res.status(404).json({ message: "Lead not found" });

        // 1. Gather Context
        const companyCapText = getCompanyCap();
        let opportunityText = `Title: ${lead.name}\\nDescription: ${lead.description || "No description provided."}\\nDeal Type: ${lead.dealType}\\nSector: ${lead.sector}\\nDepartment: ${lead.department}\\nStatus: ${lead.opportunityStatus}`;

        // 2. Process Attachments (if any)
        let attachmentContent = "";
        if (lead.attachments && lead.attachments.length > 0) {
            for (const att of lead.attachments) {
                const filePath = path.join(__dirname, '../', att.url);
                if (fs.existsSync(filePath)) {
                    if (att.name.toLowerCase().endsWith('.pdf')) {
                        const pdfText = await extractTextFromPDF(filePath);
                        attachmentContent += `\\n--- ${att.name} ---\\n${pdfText.substring(0, 2000)}`;
                    }
                }
            }
        }

        // 3. Gather Partner Context - Only Vetted, Active, or Prospective
        const partners = await Partner.find({
            status: { $in: ['Vetted', 'Active', 'Prospective'] }
        });

        const partnerDetails = partners.map(p => ({
            id: p._id.toString(),
            name: p.name,
            status: p.status,
            rating: p.performanceRating || 50,
            skills: p.skills || [],
            agencies: p.agencies || [],
            naics: p.naicsCodes || [],
            capabilities: p.capabilities || ""
        }));

        console.log("=== AI SCORING START ===");
        console.log("Company Cap Length:", companyCapText.length, "chars");
        console.log("Company Cap Preview:", companyCapText.substring(0, 200) + "...");
        console.log("Opportunity Text:", opportunityText);
        console.log("Attachment Content Length:", attachmentContent.length, "chars");
        console.log("Partners Available:", partners.length);
        if (partners.length > 0) {
            console.log("Partner Names:", partners.map(p => p.name).join(', '));
        }
        console.log("========================");

        // 4. Call AI API for intelligent analysis
        const analysisPrompt = `You are a government contracting expert. Analyze this RFP opportunity.

COMPANY CAPABILITIES:
${companyCapText.substring(0, 2000)}

OPPORTUNITY REQUIREMENTS:
${opportunityText}
${attachmentContent}

AVAILABLE TEAMING PARTNERS:
${partnerDetails.map(p => `- ${p.name} (${p.status}, Rating: ${p.rating}/100): Skills: ${p.skills.join(', ')}, Agencies: ${p.agencies.join(', ')}`).join('\\n')}

ANALYSIS REQUIRED:
1. Score our company's standalone capability (0-100) based on how well we match the opportunity requirements
2. Identify gaps in our capabilities
3. Recommend 1-3 partners from the list that fill those gaps
4. Calculate team score (company score + partner bonuses, max 100)
5. Final recommendation: Go, Conditional Go, or No-Go

Respond with ONLY valid JSON in this exact format:
{
  "company_score": 65,
  "company_reason": "Strong technical match but limited agency experience",
  "team_score": 80,
  "team_recommendation": "Go",
  "suggested_partners": [
    {
      "partnerId": "exact_id_from_list",
      "name": "Partner Name",
      "score": 15,
      "probability": 85,
      "reason": "Has required DHS past performance"
    }
  ],
  "breakdown": {"technical": 18, "platform": 12, "industry": 15, "compliance": 10, "delivery": 12, "strategic": 8},
  "strengths": ["Strong cloud expertise", "Proven automation capabilities"],
  "risks": ["No direct agency experience", "Competitive landscape"],
  "confidence": "High"
}`;

        let aiResponse = null;

        try {
            // Try Hugging Face API (free, no key needed)
            console.log("Calling Hugging Face AI...");
            const hfResponse = await axios.post(
                'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
                {
                    inputs: analysisPrompt,
                    parameters: {
                        max_new_tokens: 800,
                        temperature: 0.3,
                        return_full_text: false
                    }
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            let rawText = hfResponse.data;
            if (Array.isArray(rawText) && rawText[0]?.generated_text) {
                rawText = rawText[0].generated_text;
            }

            // Extract JSON from response
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResponse = JSON.parse(jsonMatch[0]);
                console.log("✅ AI Analysis Successful");
            }
        } catch (aiError) {
            console.log("⚠️ AI API Error, using intelligent fallback:", aiError.message);
        }

        // Intelligent fallback based on actual content analysis
        if (!aiResponse || !aiResponse.company_score) {
            console.log("Using content-based fallback analysis...");

            // Simple keyword matching for scoring
            const companyLower = companyCapText.toLowerCase();
            const oppLower = (opportunityText + attachmentContent).toLowerCase();

            // Check for technical matches
            const techKeywords = ['cloud', 'aws', 'azure', 'devops', 'agile', 'software', 'development'];
            const techMatches = techKeywords.filter(kw => companyLower.includes(kw) && oppLower.includes(kw));
            baseScore += techMatches.length * 3;

            // Check for agency mentions
            const agencies = ['dhs', 'dod', 'va', 'hhs', 'gsa', 'federal'];
            const agencyMatches = agencies.filter(ag => companyLower.includes(ag) && oppLower.includes(ag));
            baseScore += agencyMatches.length * 5;

            // Check for certifications
            const certs = ['iso', 'cmmi', 'fedramp', 'fisma'];
            const certMatches = certs.filter(cert => companyLower.includes(cert) && oppLower.includes(cert));
            baseScore += certMatches.length * 4;

            console.log("--- Content Analysis ---");
            console.log("Technical Matches:", techMatches.length, "=>", techMatches);
            console.log("Agency Matches:", agencyMatches.length, "=>", agencyMatches);
            console.log("Cert Matches:", certMatches.length, "=>", certMatches);
            console.log("Base Score Calculated:", baseScore);
            console.log("------------------------");

            baseScore = Math.min(baseScore, 85); // Cap at 85 for fallback

            // Find best matching partners
            const rankedPartners = partnerDetails.map(p => {
                let partnerScore = 0;
                const partnerText = `${p.skills.join(' ')} ${p.agencies.join(' ')} ${p.capabilities}`.toLowerCase();

                // Score based on how well partner fills gaps
                techKeywords.forEach(kw => {
                    if (oppLower.includes(kw) && !companyLower.includes(kw) && partnerText.includes(kw)) {
                        partnerScore += 5;
                    }
                });

                agencies.forEach(ag => {
                    if (oppLower.includes(ag) && !companyLower.includes(ag) && partnerText.includes(ag)) {
                        partnerScore += 8;
                    }
                });

                return { ...p, matchScore: partnerScore };
            }).sort((a, b) => b.matchScore - a.matchScore);

            const topPartners = rankedPartners.slice(0, 3).filter(p => p.matchScore > 0);
            const partnerBonus = topPartners.reduce((sum, p) => sum + Math.min(p.matchScore, 15), 0);

            aiResponse = {
                company_score: baseScore,
                company_reason: `Capability match analysis: ${techMatches.length} technical matches, ${agencyMatches.length} agency matches, ${certMatches.length} certifications`,
                team_score: Math.min(baseScore + partnerBonus, 99),
                team_recommendation: (baseScore + partnerBonus) >= 75 ? "Go" : (baseScore + partnerBonus) >= 60 ? "Conditional Go" : "No-Go",
                suggested_partners: topPartners.map(p => ({
                    partnerId: p.id,
                    name: p.name,
                    score: Math.min(p.matchScore, 15),
                    probability: Math.min(50 + p.matchScore * 3, 95),
                    reason: `${p.status} partner - Fills gaps in ${p.skills.slice(0, 2).join(', ')} ${p.agencies.length > 0 ? 'with ' + p.agencies[0] + ' experience' : ''}`
                })),
                breakdown: {
                    technical: Math.min(15 + techMatches.length * 2, 20),
                    platform: Math.min(10 + techMatches.length, 15),
                    industry: Math.min(10 + agencyMatches.length * 2, 15),
                    compliance: Math.min(8 + certMatches.length * 2, 12),
                    delivery: 10,
                    strategic: Math.min(8 + agencyMatches.length, 12)
                },
                strengths: [
                    ...techMatches.slice(0, 2).map(t => `Strong ${t} capabilities`),
                    ...agencyMatches.slice(0, 1).map(a => `${a.toUpperCase()} experience`)
                ],
                risks: [
                    techMatches.length < 2 ? "Limited technical depth" : "Competitive landscape",
                    agencyMatches.length === 0 ? "No direct agency experience" : "Tight timeline"
                ],
                confidence: baseScore >= 70 ? "High" : baseScore >= 50 ? "Medium" : "Low"
            };

            console.log("✅ Content-based analysis complete");
        }

        // Ensure we have partner suggestions if partners exist
        if ((!aiResponse.suggested_partners || aiResponse.suggested_partners.length === 0) && partners.length > 0) {
            aiResponse.suggested_partners = partners.slice(0, 2).map(p => ({
                partnerId: p._id.toString(),
                name: p.name,
                score: 10,
                probability: 65,
                reason: `${p.status} partner with relevant capabilities`
            }));
            aiResponse.team_score = (aiResponse.company_score || 60) + 10;
        }

        // Save to lead
        lead.aiScore = aiResponse.company_score || 60;
        lead.aiRecommendation = aiResponse.team_recommendation || "Conditional Go";
        lead.teamScore = aiResponse.team_score || lead.aiScore;
        lead.suggestedPartners = (aiResponse.suggested_partners || []).map(sp => ({
            partnerId: sp.partnerId,
            name: sp.name,
            score: sp.score || 10,
            probability: sp.probability || 65,
            reason: sp.reason || "Recommended partner"
        }));

        await lead.save();

        console.log("=== AI SCORING COMPLETE ===");
        console.log("Company Score:", aiResponse.company_score);
        console.log("Team Score:", aiResponse.team_score);
        console.log("Suggested Partners:", aiResponse.suggested_partners?.length || 0);
        console.log("Recommendation:", aiResponse.team_recommendation);
        console.log("===========================");

        res.json(aiResponse);

    } catch (err) {
        console.error("Server Scoring Error:", err);
        res.status(500).json({ message: "Failed to generate score" });
    }
});

module.exports = router;
