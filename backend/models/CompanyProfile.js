const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
    // A. Legal & Business Information
    legalName: { type: String, required: true },
    dba: String,
    uei: String, // Unique Entity ID
    cageCode: String,
    taxId: String, // Encrypted in production
    incorporationState: String,
    businessType: { type: String, enum: ['LLC', 'Corporation', 'S-Corp', 'Partnership', 'Sole Proprietorship', 'Other'] },
    yearEstablished: Number,
    websiteUrl: String,
    primaryAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: { type: String, default: 'USA' }
    },
    additionalLocations: [{
        name: String,
        street: String,
        city: String,
        state: String,
        zip: String
    }],
    legalAttachments: [{
        name: String,
        url: String,
        type: String, // 'Articles', 'License', 'EIN Letter'
        uploadedAt: { type: Date, default: Date.now }
    }],

    // B. Federal & State Registration
    samStatus: { type: String, enum: ['Active', 'Expired', 'Not Registered'], default: 'Not Registered' },
    samExpirationDate: Date,
    stateVendorIds: [{
        state: String,
        vendorId: String,
        status: String
    }],
    gsaSchedule: String,
    naspoContracts: [String],
    registrationAttachments: [{
        name: String,
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // C. Business Size & Socio-Economic Status
    businessSize: { type: String, enum: ['Small', 'Large'] },
    sbaCertifications: [{
        type: { type: String, enum: ['8(a)', 'HUBZone', 'WOSB', 'EDWOSB', 'SDVOSB', 'VOSB'] },
        certificationNumber: String,
        expirationDate: Date
    }],
    minorityOwned: { type: Boolean, default: false },
    womanOwned: { type: Boolean, default: false },
    veteranOwned: { type: Boolean, default: false },
    naicsCodes: [{
        code: String,
        description: String,
        isPrimary: { type: Boolean, default: false }
    }],
    pscCodes: [String],
    certificationAttachments: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // D. Capability & Technical Profile
    coreCapabilities: String, // Rich text summary
    differentiators: [String],
    primaryIndustries: [String],
    technologyStack: [String],
    deliveryModels: [{ type: String, enum: ['Onsite', 'Hybrid', 'Remote', 'All'] }],
    securityCapabilities: String,
    capabilityAttachments: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // E. Past Performance & Experience
    pastPerformance: [{
        clientAgency: String,
        contractNumber: String,
        contractValue: Number,
        performancePeriodStart: Date,
        performancePeriodEnd: Date,
        scopeSummary: String,
        cparsRating: String,
        attachments: [{
            name: String,
            url: String
        }]
    }],

    // F. Financial & Banking
    annualRevenue: [{
        year: Number,
        revenue: Number
    }],
    bankingInstitution: String,
    dcaaCompliant: { type: Boolean, default: false },
    accountingSystem: String,
    insuranceCoverage: [{
        type: String, // 'General Liability', 'Professional', 'Cyber'
        limit: Number,
        expirationDate: Date
    }],
    financialAttachments: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // G. Compliance, Security & Certifications
    isoCertifications: [{
        standard: String, // 'ISO 9001', 'ISO 27001'
        certificationDate: Date,
        expirationDate: Date
    }],
    hipaaCompliant: { type: Boolean, default: false },
    soc2: { type: String, enum: ['None', 'Type I', 'Type II'] },
    cmmcLevel: { type: String, enum: ['None', 'Level 1', 'Level 2', 'Level 3'] },
    securityClearanceLevel: String,
    complianceAttachments: [{
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // H. Key Contacts
    keyContacts: [{
        role: String, // 'Authorized Signatory', 'Contracts Manager', etc.
        name: String,
        title: String,
        email: String,
        phone: String
    }],

    // I. Subcontracting & Teaming
    primeSubPreference: { type: String, enum: ['Prime', 'Subcontractor', 'Both'] },
    hasSubcontractingPlan: { type: Boolean, default: false },
    mentorProtege: {
        status: { type: String, enum: ['None', 'Mentor', 'Protégé'] },
        programName: String
    },
    teamingAgreements: [{
        partner: String,
        status: { type: String, enum: ['Active', 'Archived'] },
        description: String,
        attachmentUrl: String
    }],

    // Metadata
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

// Update lastUpdated on save - REMOVED to fix next() error
// companyProfileSchema.pre('save', function (next) {
//     this.lastUpdated = new Date();
//     next();
// });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
