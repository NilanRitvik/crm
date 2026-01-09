const express = require('express');
const router = express.Router();
const Portal = require('../models/Portal');

// INITIAL DATA
const INITIAL_STATE = [
    { name: "Alabama", url: "https://purchasing.alabama.gov/", category: "State" },
    { name: "Alaska", url: "http://doa.alaska.gov/oppm/", category: "State" },
    { name: "Arizona", url: "https://spo.az.gov/", category: "State" },
    { name: "Arkansas", url: "https://transform.ar.gov/procurement/", category: "State" },
    { name: "California", url: "https://www.dgs.ca.gov/PD", category: "State" },
    { name: "Colorado", url: "https://osc.colorado.gov/spco", category: "State" },
    { name: "Connecticut", url: "https://portal.ct.gov/DAS/Services/For-Agencies-and-Municipalities/Procurement", category: "State" },
    { name: "Delaware", url: "https://gss.omb.delaware.gov/", category: "State" },
    { name: "District of Columbia", url: "https://ocp.dc.gov/", category: "State" },
    { name: "Florida", url: "https://www.dms.myflorida.com/business_operations/state_purchasing", category: "State" },
    { name: "Georgia", url: "https://doas.ga.gov/state-purchasing", category: "State" },
    { name: "Hawaii", url: "https://spo.hawaii.gov/", category: "State" },
    { name: "Idaho", url: "https://purchasing.idaho.gov/", category: "State" },
    { name: "Illinois", url: "https://www2.illinois.gov/cms/business/procurement/Pages/default.aspx", category: "State" },
    { name: "Indiana", url: "https://www.in.gov/idoa/procurement/", category: "State" },
    { name: "Iowa", url: "https://das.iowa.gov/procurement", category: "State" },
    { name: "Kansas", url: "https://admin.ks.gov/offices/procurement-and-contracts", category: "State" },
    { name: "Kentucky", url: "https://finance.ky.gov/office-of-the-controller/office-of-procurement-services/Pages/default.aspx", category: "State" },
    { name: "Louisiana", url: "https://www.doa.la.gov/doa/osp/", category: "State" },
    { name: "Maine", url: "https://www.maine.gov/dafs/bbm/procurementservices/home", category: "State" },
    { name: "Maryland", url: "https://procurement.maryland.gov/", category: "State" },
    { name: "Massachusetts", url: "https://www.mass.gov/orgs/operational-services-division", category: "State" },
    { name: "Michigan", url: "https://www.michigan.gov/dtmb/0,5552,7-358-82550_85746---,00.html", category: "State" },
    { name: "Minnesota", url: "http://www.mmd.admin.state.mn.us/", category: "State" },
    { name: "Mississippi", url: "https://www.dfa.ms.gov/procurement-contracts", category: "State" },
    { name: "Ohio", url: "https://procure.ohio.gov/", category: "State" },
    { name: "Oklahoma", url: "https://oklahoma.gov/omes/services/purchasing.html", category: "State" },
    { name: "Oregon", url: "https://www.oregon.gov/DAS/Procurement/Pages/Index.aspx", category: "State" },
    { name: "Pennsylvania", url: "https://www.dgs.pa.gov/Materials-Services-Procurement/Pages/default.aspx", category: "State" },
    { name: "Rhode Island", url: "https://www.ridop.ri.gov/", category: "State" },
    { name: "South Carolina", url: "https://procurement.sc.gov/", category: "State" },
    { name: "South Dakota", url: "https://www.sd.gov/bhra?id=cs_kb_article_view&sysparm_article=KB0044779&spa=1", category: "State" },
    { name: "Tennessee", url: "https://www.tn.gov/generalservices/procurement.html", category: "State" },
    { name: "Texas", url: "https://comptroller.texas.gov/purchasing/", category: "State" },
    { name: "Utah", url: "https://purchasing.utah.gov/", category: "State" },
    { name: "Vermont", url: "https://bgs.vermont.gov/purchasing", category: "State" },
    { name: "Virginia", url: "https://dgs.virginia.gov/procurement", category: "State" },
    { name: "Washington", url: "https://des.wa.gov/", category: "State" },
    { name: "West Virginia", url: "https://www.state.wv.us/admin/purchase/", category: "State" },
    { name: "Wisconsin", url: "https://doa.wi.gov/Pages/StateEmployees/Procurement.aspx", category: "State" },
    { name: "Wyoming", url: "https://ai.wyo.gov/divisions/general-services/purchasing", category: "State" }
];

const INITIAL_FEDERAL = [
    { name: "SAM.gov – Contract Opportunities", url: "https://sam.gov/content/opportunities", category: "Federal" },
    { name: "SAM.gov – Home / Vendor Registration", url: "https://sam.gov/", category: "Federal" },
    { name: "NASA Vendor Database", url: "https://nvdb.nasa.gov/", category: "Federal" },
    { name: "FedConnect (EPA Procurement)", url: "https://www.fedconnect.net/", category: "Federal" },
    { name: "Acquisition.gov", url: "https://www.acquisition.gov/", category: "Federal" },
    { name: "GSA eLibrary", url: "https://www.gsaelibrary.gsa.gov/", category: "Federal" },
    { name: "GSA eBuy", url: "https://www.ebuy.gsa.gov/", category: "Federal" },
    { name: "DIBBS – Defense Logistics Agency", url: "https://www.dibbs.bsm.dla.mil/", category: "Federal" },
    { name: "USAspending.gov", url: "https://www.usaspending.gov/", category: "Federal" }
];

const INITIAL_PAID = [
    { name: "BidNet Direct", url: "https://www.bidnetdirect.com/vendors", category: "Paid" },
    { name: "Deltek GovWin IQ", url: "https://www.deltek.com/en/government-contracting/govwin-iq", category: "Paid" },
    { name: "GovTribe", url: "https://www.govtribe.com", category: "Paid" },
    { name: "Bidwin", url: "https://bidwin.io", category: "Paid" },
    { name: "BidHits", url: "https://www.bidhits.com/home.php", category: "Paid" },
    { name: "Bloomberg Government", url: "https://about.bgov.com", category: "Paid" },
    { name: "DemandStar / Onvia", url: "https://www.demandstar.com", category: "Paid" }
];

const INITIAL_OTHERS = [
    { name: "Federal Procurement Data System – FPDS-NG", url: "https://www.fpds.gov/", category: "Others" },
    { name: "USAspending.gov", url: "https://www.usaspending.gov/", category: "Others" },
    { name: "NASPO ValuePoint", url: "https://www.naspo.org/", category: "Others" },
    { name: "Acquisition.gov", url: "https://www.acquisition.gov/", category: "Others" },
    { name: "HigherGov", url: "https://www.highergov.com/", category: "Others" },
    { name: "OrangeSlices AI", url: "https://www.orangeslice.ai/", category: "Others" }
];

// GET ALL PORTALS (with auto-seed)
router.get('/', async (req, res) => {
    try {
        const count = await Portal.countDocuments();

        // 1. Initial Seed (if empty)
        if (count === 0) {
            console.log("Seeding Initial Portals...");
            await Portal.insertMany([...INITIAL_STATE, ...INITIAL_FEDERAL, ...INITIAL_PAID, ...INITIAL_OTHERS]);
        }
        // 2. Update Seed (if categories missing)
        else {
            const paidCount = await Portal.countDocuments({ category: 'Paid' });
            if (paidCount === 0) {
                console.log("Seeding Missing Paid Portals...");
                await Portal.insertMany(INITIAL_PAID);
            }

            const othersCount = await Portal.countDocuments({ category: 'Others' });
            if (othersCount === 0) {
                console.log("Seeding Missing Others Portals...");
                await Portal.insertMany(INITIAL_OTHERS);
            }
        }

        const portals = await Portal.find().sort({ category: 1, name: 1 });
        res.json(portals);
    } catch (err) {
        res.status(500).json({ message: "Error fetching portals" });
    }
});

// ADD POrtal
router.post('/', async (req, res) => {
    try {
        const newPortal = await Portal.create(req.body);
        res.json(newPortal);
    } catch (err) {
        res.status(400).json({ message: "Failed to add portal" });
    }
});

// UPDATE POrtal
router.put('/:id', async (req, res) => {
    try {
        const updated = await Portal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: "Failed to update portal" });
    }
});

// DELETE POrtal
router.delete('/:id', async (req, res) => {
    try {
        await Portal.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(400).json({ message: "Failed to delete" });
    }
});

module.exports = router;
