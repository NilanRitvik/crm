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

        console.log("\\n=== AI SCORING START ===");
        console.log("Company Cap Length:", companyCapText.length, "chars");
        console.log("Opportunity:", lead.name);
        console.log("Opportunity Details:", opportunityText.length, "chars");
        console.log("Attachments:", attachmentContent.length, "chars");
        console.log("Partners Available:", partners.length);
        console.log("========================\\n");

        // Content-based intelligent scoring (0-100 range)
        const companyLower = companyCapText.toLowerCase();
        const oppLower = (opportunityText + attachmentContent).toLowerCase();
        
        // START FROM 0 - Build up based on actual matches
        let baseScore = 0;
        
        // 1. Content Quality Check (0-20 points)
        const oppWordCount = oppLower.split(/\\s+/).filter(w => w.length > 2).length;
        if (oppWordCount < 10) {
            baseScore = 5; // Minimal content
        } else if (oppWordCount < 50) {
            baseScore = 12; // Basic content
        } else if (oppWordCount < 150) {
            baseScore = 18; // Good content
        } else {
            baseScore = 25; // Comprehensive content
        }
        
        // 2. Technical Capability Match (0-25 points)
        const techKeywords = ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'devops', 'ci/cd', 'agile', 'scrum', 'software', 'development', 'cybersecurity', 'ai', 'ml', 'data', 'analytics'];
        const techMatches = techKeywords.filter(kw => companyLower.includes(kw) && oppLower.includes(kw));
        const techScore = Math.min(techMatches.length * 2.5, 25);
        baseScore += techScore;
        
        // 3. Agency/Industry Match (0-25 points)
        const agencies = ['dhs', 'dod', 'department of defense', 'va', 'veterans affairs', 'hhs', 'health', 'gsa', 'federal', 'nasa', 'doe', 'energy', 'treasury', 'state department', 'usaid'];
        const agencyMatches = agencies.filter(ag => companyLower.includes(ag) && oppLower.includes(ag));
        const agencyScore = Math.min(agencyMatches.length * 5, 25);
        baseScore += agencyScore;
        
        // 4. Compliance/Certifications (0-20 points)
        const certs = ['iso', 'iso 9001', 'iso 27001', 'cmmi', 'cmmi level 3', 'fedramp', 'fisma', 'nist', 'hipaa', 'sox', 'pci'];
        const certMatches = certs.filter(cert => companyLower.includes(cert) && oppLower.includes(cert));
        const certScore = Math.min(certMatches.length * 4, 20);
        baseScore += certScore;
        
        // 5. Past Performance Indicators (0-10 points)
        const perfKeywords = ['past performance', 'experience', 'proven', 'delivered', 'successful', 'completed', 'years of'];
        const perfMatches = perfKeywords.filter(kw => companyLower.includes(kw));
        const perfScore = Math.min(perfMatches.length * 2, 10);
        baseScore += perfScore;
        
        console.log("--- COMPANY SCORING ---");
        console.log("Opportunity Words:", oppWordCount, `(+${oppWordCount < 10 ? 5 : oppWordCount < 50 ? 12 : oppWordCount < 150 ? 18 : 25} pts)`);
        console.log("Technical Matches:", techMatches.length, "=>", techMatches.slice(0, 5), `(+${techScore} pts)`);
        console.log("Agency Matches:", agencyMatches.length, "=>", agencyMatches, `(+${agencyScore} pts)`);
        console.log("Cert Matches:", certMatches.length, "=>", certMatches, `(+${certScore} pts)`);
        console.log("Performance:", perfMatches.length, `(+${perfScore} pts)`);
        console.log("COMPANY SCORE:", baseScore, "/100");
        console.log("-----------------------\\n");
        
        // NO CAPS - Full 0-100 range
        baseScore = Math.max(0, Math.min(baseScore, 100));
        
        // PARTNER SCORING - Can be 0 if bad partners
        const rankedPartners = partnerDetails.map(p => {
            let partnerScore = 0;
            const partnerText = `${p.skills.join(' ')} ${p.agencies.join(' ')} ${p.capabilities}`.toLowerCase();
            const partnerWordCount = partnerText.split(/\\s+/).filter(w => w.length > 2).length;
            
            // Quality baseline from their rating (0-15 points)
            const qualityScore = Math.round((p.rating / 100) * 15);
            partnerScore += qualityScore;
            
            // Penalty for empty partner data
            if (partnerWordCount < 5) {
                partnerScore = Math.max(0, partnerScore - 10);
            }
            
            // Gap-filling analysis (0-35 points)
            let gapScore = 0;
            
            // Technical gaps
            techKeywords.forEach(kw => {
                if (oppLower.includes(kw) && !companyLower.includes(kw) && partnerText.includes(kw)) {
                    gapScore += 3;
                }
            });
            
            // Agency gaps (more valuable)
            agencies.forEach(ag => {
                if (oppLower.includes(ag) && !companyLower.includes(ag) && partnerText.includes(ag)) {
                    gapScore += 7;
                }
            });
            
            // Cert gaps
            certs.forEach(cert => {
                if (oppLower.includes(cert) && !companyLower.includes(cert) && partnerText.includes(cert)) {
                    gapScore += 5;
                }
            });
            
            partnerScore += Math.min(gapScore, 35);
            
            // Calculate probability (0-100%)
            const probability = Math.max(5, Math.min(Math.round(partnerScore * 1.8), 100));
            
            return { 
                ...p, 
                matchScore: Math.max(0, Math.round(partnerScore)),
                probability: probability,
                gapScore: gapScore,
                qualityScore: qualityScore,
                wordCount: partnerWordCount
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
        
        console.log("--- PARTNER SCORING ---");
        rankedPartners.forEach(p => {
            console.log(`${p.name}: Total=${p.matchScore}/50, Quality=${p.qualityScore}, GapFill=${p.gapScore}, Probability=${p.probability}%, Words=${p.wordCount}`);
        });
        console.log("-----------------------\\n");
        
        // Top 3 partners
        const topPartners = rankedPartners.slice(0, 3);
        
        // Partner bonus: Each partner can add 0-30 points
        const partnerBonus = topPartners.reduce((sum, p) => {
            const bonus = Math.round((p.matchScore / 50) * 30); // Scale 0-50 score to 0-30 bonus
            return sum + bonus;
        }, 0);
        
        // Team score: 0-100 (no cap)
        const teamScore = Math.max(0, Math.min(baseScore + partnerBonus, 100));
        
        const aiResponse = {
            company_score: baseScore,
            company_reason: `Content analysis: ${oppWordCount} words. ${techMatches.length} technical, ${agencyMatches.length} agency, ${certMatches.length} cert matches. ${baseScore < 25 ? '⚠️ Very limited match' : baseScore < 50 ? 'Moderate match' : baseScore < 75 ? 'Good match' : 'Excellent match'}.`,
            team_score: teamScore,
            team_recommendation: teamScore >= 75 ? "Go" : teamScore >= 55 ? "Conditional Go" : "No-Go",
            suggested_partners: topPartners.map(p => ({
                partnerId: p.id,
                name: p.name,
                score: Math.round((p.matchScore / 50) * 30),
                probability: p.probability,
                reason: p.matchScore === 0 ? 
                    `⚠️ ${p.status} - No relevant capabilities found` :
                    p.matchScore < 15 ?
                    `${p.status} - Limited match (Rating: ${p.rating}/100, ${p.wordCount} words)` :
                    p.matchScore < 30 ?
                    `${p.status} - Moderate match. ${p.gapScore > 0 ? 'Fills some gaps' : 'Basic capabilities'}` :
                    `✅ ${p.status} - Strong match! Fills critical gaps. ${p.agencies.length > 0 ? p.agencies[0].toUpperCase() + ' experience' : ''}`
            })),
            breakdown: {
                technical: Math.round(techScore * 0.8),
                platform: Math.round(techScore * 0.6),
                industry: Math.round(agencyScore * 0.6),
                compliance: Math.round(certScore * 0.6),
                delivery: Math.round(perfScore),
                strategic: Math.round((techScore + agencyScore) * 0.25)
            },
            strengths: [
                ...techMatches.slice(0, 3).map(t => `${t.toUpperCase()} capabilities`),
                ...agencyMatches.slice(0, 2).map(a => `${a.toUpperCase()} experience`),
                ...certMatches.slice(0, 2).map(c => `${c.toUpperCase()} certified`)
            ].filter(Boolean).slice(0, 5),
            risks: [
                techMatches.length === 0 ? "⚠️ No technical capability match" : null,
                agencyMatches.length === 0 ? "⚠️ No agency experience match" : null,
                certMatches.length === 0 ? "⚠️ No compliance certifications" : null,
                oppWordCount < 30 ? "⚠️ Very limited opportunity details" : null,
                baseScore < 30 ? "⚠️ Critical: Low capability alignment" : "Competitive landscape"
            ].filter(Boolean).slice(0, 5),
            confidence: baseScore >= 60 ? "High" : baseScore >= 30 ? "Medium" : "Low"
        };
        
        // Save to lead
        lead.aiScore = baseScore;
        lead.aiRecommendation = aiResponse.team_recommendation;
        lead.teamScore = teamScore;
        lead.suggestedPartners = aiResponse.suggested_partners.map(sp => ({
            partnerId: sp.partnerId,
            name: sp.name,
            score: sp.score,
            probability: sp.probability,
            reason: sp.reason
        }));

        await lead.save();

        console.log("=== SCORING COMPLETE ===");
        console.log("Company:", baseScore, "| Partners Bonus:", partnerBonus, "| Team:", teamScore);
        console.log("Recommendation:", aiResponse.team_recommendation);
        console.log("========================\\n");

        res.json(aiResponse);

    } catch (err) {
        console.error("Server Scoring Error:", err);
        res.status(500).json({ message: "Failed to generate score" });
    }
});

module.exports = router;
