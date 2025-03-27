const router = require("express").Router()
const Rule = require("../models/ruleModel")
const Badge = require("../models/badgeModel")
const UserBadge = require("../models/userBadgeModel")

// @desc    Get all rules with pagination and filtering
// @route   GET /api/rules
router.get("/getRules", async (req, res, next) => {
    try {
        const page = Number.parseInt(req.query.page, 10) || 1
        const limit = Number.parseInt(req.query.limit, 10) || 10
        const skip = (page - 1) * limit

        // Build query based on filters
        const query = {}

        // Filter by status if provided
        if (req.query.status && ["active", "inactive"].includes(req.query.status)) {
            query.status = req.query.status
        }

        // Filter by trigger if provided
        if (req.query.trigger) {
            query.trigger = req.query.trigger
        }

        // Filter by action if provided
        if (req.query.action) {
            query.action = req.query.action
        }

        // Search by name or description
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i")
            query.$or = [{ name: searchRegex }, { description: searchRegex }]
        }

        // Execute query with pagination
        const rules = await Rule.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        // Get total count for pagination
        const total = await Rule.countDocuments(query)

        res.status(200).json({
            success: true,
            count: rules.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
            data: rules,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Get a single rule
// @route   GET /api/rules/:id
router.get("/getRule/:id", async (req, res, next) => {
    try {
        const rule = await Rule.findById(req.params.id)

        if (!rule) {
            return res.status(404).json({
                success: false,
                error: "Rule not found",
            })
        }

        res.status(200).json({
            success: true,
            data: rule,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Create a new rule
// @route   POST /api/rules
router.post("/createRule", async (req, res, next) => {
    try {
        // If rule is for awarding a badge, verify the badge exists
        console.log(req.body)

        // if (req.body.action === "award_badge") {
        //     const badge = await Badge.findOne({ name: req.body.actionValue })
        //     if (!badge) {
        //         return res.status(404).json({
        //             success: false,
        //             error: "Badge not found",
        //         })
        //     }
        // }

        // Create the rule
        const rule = await Rule.create({
            ...req.body,
        })

        res.status(201).json({
            success: true,
            data: rule,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Update a rule
// @route   PUT /api/rules/:id
router.put("/updateRule/:id", async (req, res, next) => {
    try {
        // Find rule to update
        let rule = await Rule.findById(req.params.id)

        if (!rule) {
            return res.status(404).json({
                success: false,
                error: "Rule not found",
            })
        }

        // // If updating action to award_badge, verify the badge exists
        // if (req.body.action === "award_badge") {
        //     const badge = await Badge.findOne({ name: req.body.actionValue })
        //     if (!badge) {
        //         return res.status(404).json({
        //             success: false,
        //             error: "Badge not found",
        //         })
        //     }
        // }

        // Update rule
        rule = await Rule.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })

        res.status(200).json({
            success: true,
            data: rule,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Delete a rule
// @route   DELETE /api/rules/:id
router.delete("/deleteRule/:id", async (req, res, next) => {
    try {
        const rule = await Rule.findById(req.params.id)

        if (!rule) {
            return res.status(404).json({
                success: false,
                error: "Rule not found",
            })
        }

        await rule.remove()

        res.status(200).json({
            success: true,
            data: {},
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Toggle rule status (active/inactive)
// @route   PATCH /api/rules/:id/toggle-status
router.patch("/toggleRuleStatus/:id", async (req, res, next) => {
    try {
        const rule = await Rule.findById(req.params.id)

        if (!rule) {
            return res.status(404).json({
                success: false,
                error: "Rule not found",
            })
        }

        // Toggle status
        rule.status = rule.status === "active" ? "inactive" : "active"
        await rule.save()

        res.status(200).json({
            success: true,
            data: rule,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Duplicate a rule
// @route   POST /api/rules/:id/duplicate
router.post("/duplicateRule/:id", async (req, res, next) => {
    try {
        const rule = await Rule.findById(req.params.id)

        if (!rule) {
            return res.status(404).json({
                success: false,
                error: "Rule not found",
            })
        }

        // Create a new rule based on the existing one
        const newRule = await Rule.create({
            name: `${rule.name} (Copy)`,
            description: rule.description,
            trigger: rule.trigger,
            condition: rule.condition,
            action: rule.action,
            actionValue: rule.actionValue,
            status: rule.status,
        })

        res.status(201).json({
            success: true,
            data: newRule,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

// @desc    Process an event against rules
// @route   POST /api/rules/process-event
router.post("/processEvent", async (req, res, next) => {
    try {
        const { eventType, userId, data } = req.body

        // Find all active rules that match this event type
        const rules = await Rule.find({
            trigger: eventType,
            status: "active",
        })

        if (!rules.length) {
            return res.status(200).json({
                success: true,
                message: "No matching rules found",
                actionsTriggered: 0,
            })
        }

        const actionsTriggered = []

        // Process each rule
        for (const rule of rules) {
            // Evaluate the condition
            let conditionMet = false
            try {
                // Create a safe evaluation context with the event data
                const context = { ...data }

                // Simple condition evaluation (in production, use a proper expression evaluator)
                // This is a simplified example - in a real app, use a proper expression parser
                const conditionParts = rule.condition.split(/\s*(==|>=|<=|>|<|!=)\s*/)
                if (conditionParts.length === 3) {
                    const [left, operator, right] = conditionParts
                    const leftValue = context[left] || Number.parseFloat(left)
                    const rightValue = context[right] || Number.parseFloat(right)

                    switch (operator) {
                        case "==":
                            conditionMet = leftValue == rightValue
                            break
                        case ">=":
                            conditionMet = leftValue >= rightValue
                            break
                        case "<=":
                            conditionMet = leftValue <= rightValue
                            break
                        case ">":
                            conditionMet = leftValue > rightValue
                            break
                        case "<":
                            conditionMet = leftValue < rightValue
                            break
                        case "!=":
                            conditionMet = leftValue != rightValue
                            break
                    }
                }
            } catch (error) {
                console.error(`Error evaluating condition for rule ${rule._id}:`, error)
                continue
            }

            if (!conditionMet) continue

            // Execute the action
            let actionResult = null

            switch (rule.action) {
                case "award_badge":
                    // Find the badge
                    const badge = await Badge.findOne({ name: rule.actionValue })
                    if (!badge) continue

                    // Check if user already has this badge
                    const existingBadge = await UserBadge.findOne({
                        userId,
                        badgeId: badge._id,
                    })

                    if (!existingBadge) {
                        // Award the badge
                        const userBadge = await UserBadge.create({
                            userId,
                            badgeId: badge._id,
                            awardedBy: "system",
                            awardReason: `Automatically awarded by rule: ${rule.name}`,
                        })
                        actionResult = { badgeAwarded: badge.name }
                    }
                    break

                case "add_points":
                    // Implementation would depend on your points system
                    actionResult = { pointsAdded: Number.parseInt(rule.actionValue, 10) }
                    break

                case "send_notification":
                    // Implementation would depend on your notification system
                    actionResult = { notificationSent: rule.actionValue }
                    break

                case "unlock_content":
                    // Implementation would depend on your content system
                    actionResult = { contentUnlocked: rule.actionValue }
                    break
            }

            if (actionResult) {
                actionsTriggered.push({
                    ruleId: rule._id,
                    ruleName: rule.name,
                    action: rule.action,
                    result: actionResult,
                })
            }
        }

        res.status(200).json({
            success: true,
            actionsTriggered: actionsTriggered.length,
            actions: actionsTriggered,
        })
    } catch (error) {
        console.error(error)
        res.status(400).json({ success: false, error })
    }
})

module.exports = router