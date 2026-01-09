const cron = require("node-cron");
const Lead = require("../models/Lead");
const { sendEmail } = require("./emailService");

const startScheduler = () => {
    console.log("⏰ Scheduler started:");
    console.log("   - Daily Agenda: 9:00 AM");
    console.log("   - Reminders: Every 10 minutes");

    // Schedule task to run at 9:00 AM every day
    cron.schedule("0 9 * * *", async () => {
        console.log("Running daily agenda check...");
        await checkAndSendAgenda();
    });

    // Schedule task to run every 10 minutes for reminders
    cron.schedule("*/10 * * * *", async () => {
        console.log("Running reminder check (5h/1h)...");
        await checkAndSendReminders();
    });
};

const checkAndSendAgenda = async () => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const endOfTomorrow = new Date(endOfDay);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

        // Find leads with pending activities OR key dates (RFP, Award, Close) today/tomorrow
        const leads = await Lead.find({
            $or: [
                {
                    "activities": {
                        $elemMatch: {
                            status: { $ne: "Done" },
                            dueDate: { $lte: endOfDay }
                        }
                    }
                },
                { estimatedRfpDate: { $gte: startOfDay, $lte: endOfTomorrow } },
                { awardDate: { $gte: startOfDay, $lte: endOfTomorrow } },
                { closeDate: { $gte: startOfDay, $lte: endOfTomorrow } }
            ]
        }).populate("user", "email name");

        if (leads.length === 0) return;

        const userAgendaMap = {};

        leads.forEach(lead => {
            if (!lead.user || !lead.user.email) return;

            const userEmail = lead.user.email;
            if (!userAgendaMap[userEmail]) {
                userAgendaMap[userEmail] = {
                    user: lead.user,
                    items: []
                };
            }

            // 1. Pending Activities
            const pendingActivities = lead.activities.filter(a =>
                a.status !== "Done" && new Date(a.dueDate) <= endOfDay
            );

            pendingActivities.forEach(act => {
                userAgendaMap[userEmail].items.push({
                    leadName: lead.name,
                    type: `Activity: ${act.type}`,
                    note: act.note,
                    time: new Date(act.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            });

            // 2. Key Date Reminders
            const checkDate = (date, name) => {
                if (!date) return;
                const d = new Date(date);
                if (d >= startOfDay && d <= endOfTomorrow) {
                    userAgendaMap[userEmail].items.push({
                        leadName: lead.name,
                        type: `KEY DATE: ${name}`,
                        note: "Important milestone due today.",
                        time: "All Day"
                    });
                }
            };

            checkDate(lead.estimatedRfpDate, "Est. RFP Date");
            checkDate(lead.awardDate, "Award Date");
            checkDate(lead.closeDate, "Close Date");
        });

        for (const email of Object.keys(userAgendaMap)) {
            const { user, items } = userAgendaMap[email];
            if (items.length === 0) continue;

            const htmlContent = `
            <h3>Hello ${user.name || 'User'},</h3>
            <p>Here is your intelligent agenda for today (${new Date().toLocaleDateString()}):</p>
            <ul>
                ${items.map(item => `
                    <li>
                        <strong>${item.type}</strong> - <strong>${item.leadName}</strong><br/>
                        Note: ${item.note}<br/>
                        Time: ${item.time}
                    </li>
                `).join('')}
            </ul>
            <p>Please check your dashboard for more details.</p>
        `;

            console.log(`Sending intelligent agenda to ${email} with ${items.length} items...`);
            await sendEmail(email, "Your Intelligent Daily Agenda", htmlContent);
        }

    } catch (error) {
        console.error("Error in scheduler (Agenda):", error);
    }
};

const checkAndSendReminders = async () => {
    try {
        const now = new Date();
        // Look ahead 5 hours + buffer to catch anything relevant
        const fiveHoursLater = new Date(now.getTime() + 5 * 60 * 60 * 1000);

        // Find leads with pending activities due soon
        const leads = await Lead.find({
            "activities": {
                $elemMatch: {
                    status: { $ne: "Done" },
                    dueDate: { $gt: now, $lte: fiveHoursLater }
                }
            }
        }).populate("user", "email name");

        for (const lead of leads) {
            if (!lead.user || !lead.user.email) continue;
            let modified = false;

            for (const activity of lead.activities) {
                if (activity.status === "Done") continue;

                const dueDate = new Date(activity.dueDate);
                const diffMs = dueDate - now;
                const hoursLeft = diffMs / (1000 * 60 * 60);

                if (diffMs <= 0) continue; // Overdue already

                // Ensure remindersSent object exists
                if (!activity.remindersSent) {
                    activity.remindersSent = { fiveHour: false, oneHour: false };
                }

                // 1 HOUR REMINDER (0 < hours <= 1)
                if (hoursLeft <= 1 && !activity.remindersSent.oneHour) {
                    console.log(`Sending 1h reminder for ${activity.type} on ${lead.name}`);

                    const htmlContent = `
                        <h3>Urgent Reminder: upcoming activity on ${lead.name}</h3>
                        <p>You have a <strong>${activity.type}</strong> in less than 1 hour.</p>
                        <p><strong>Note:</strong> ${activity.note}</p>
                        <p><strong>Time:</strong> ${dueDate.toLocaleTimeString()}</p>
                    `;

                    await sendEmail(lead.user.email, `URGENT: ${activity.type} starting soon`, htmlContent);

                    activity.remindersSent.oneHour = true;
                    activity.remindersSent.fiveHour = true; // Skip 5h if we missed it
                    modified = true;
                }
                // 5 HOUR REMINDER (1 < hours <= 5)
                else if (hoursLeft <= 5 && !activity.remindersSent.fiveHour) {
                    console.log(`Sending 5h reminder for ${activity.type} on ${lead.name}`);

                    const htmlContent = `
                        <h3>Reminder: upcoming activity on ${lead.name}</h3>
                        <p>You have a <strong>${activity.type}</strong> in about 5 hours.</p>
                        <p><strong>Note:</strong> ${activity.note}</p>
                        <p><strong>Time:</strong> ${dueDate.toLocaleTimeString()}</p>
                    `;

                    await sendEmail(lead.user.email, `Reminder: ${activity.type} later today`, htmlContent);

                    activity.remindersSent.fiveHour = true;
                    modified = true;
                }
            }

            if (modified) {
                await lead.save();
            }
        }

    } catch (error) {
        console.error("Error in scheduler (Reminders):", error);
    }
};

module.exports = { startScheduler, checkAndSendReminders };
