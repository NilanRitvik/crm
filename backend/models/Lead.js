const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    type: String,
    note: String,
    dueDate: Date,
    status: { type: String, default: "Pending" },
    remindersSent: {
      fiveHour: { type: Boolean, default: false },
      oneHour: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true }, // Deal Name
    pipeline: { type: String, default: "Sales Pipeline" },
    stage: {
      type: String,
      enum: [
        "opp sourced",
        "opp Nurturing",
        "opp qualified",
        "opp in-progress",
        "Win",
        "lost"
      ],
      default: "opp sourced"
    },

    opportunityUrl: String,
    opportunityId: String,
    state: String,
    agency: String,
    incumbent: String,
    dealType: String,
    source: String,
    sourcedBy: String,
    department: String,
    description: String,

    priority: { type: Number, default: 1 },
    value: { type: Number, default: 0 }, // Was amount
    winProbability: { type: Number, default: 0 }, // Percentage for Forecast/Partnership
    forecastStage: {
      type: String,
      enum: ["Source", "High Priority", "Low Priority"],
      default: "Source"
    }, // For Forecast Kanban


    estimatedRfpDate: Date,
    awardDate: Date,
    closeDate: Date,

    captureActivities: String,
    keyContacts: String,
    actionItems: String,
    notes: String,

    sector: { type: String, enum: ["State", "Federal", "Others"], default: "State" }, // Oppr
    responseMethod: { type: String, enum: ["Electronic", "Manual"] },
    opportunityStatus: { type: String, enum: ["Open", "Closed", "TBD"], default: "Open" },

    attachments: [{
      name: String,
      url: String, // Path to file
      uploadedAt: { type: Date, default: Date.now }
    }],

    // AI Scoring Persistence
    aiScore: { type: Number, default: 0 },
    aiRecommendation: { type: String, default: "" },
    // Team / Partner Scoring
    teamScore: { type: Number, default: 0 },
    suggestedPartners: [{
      partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
      name: String,
      score: Number,
      probability: Number, // Match probability 0-100
      reason: String
    }],

    // Legacy/Extra fields
    company: String,
    email: String,
    mobile: String,
    location: String,

    contacts: [{
      name: String,
      surname: String,
      role: String,
      email: String,
      phone: String,
      notes: String,
      state: String,
      county: String,
      agency: String,
      department: String,
      stateUrl: String,
      linkedinUrl: String
    }],
    assignedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    activities: [activitySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
