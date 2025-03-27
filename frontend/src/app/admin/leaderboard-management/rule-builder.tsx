"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import axios from "axios"
import { ArrowRight, Edit, MoreHorizontal, Pause, Play, Plus, Search, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { z } from "zod"

// Define TypeScript interfaces
interface Rule {
    _id: string
    name: string
    description: string
    trigger: TriggerType
    condition: string
    action: ActionType
    actionValue: string
    status: RuleStatus
    createdBy?: string
    createdAt?: string
    updatedAt?: string
}

interface RuleFormData {
    name: string
    description: string
    trigger: TriggerType
    condition: string
    action: ActionType
    actionValue: string
    status: RuleStatus
}

interface ApiResponse<T> {
    success: boolean
    data: T
    error?: string
    count?: number
    pagination?: {
        total: number
        page: number
        pages: number
        limit: number
    }
}

type TriggerType = "quiz_completion" | "leaderboard_update" | "streak_update" | "score_threshold" | "time_threshold"
type ActionType = "award_badge" | "add_points" | "send_notification" | "unlock_content"
type RuleStatus = "active" | "inactive"

interface TriggerOption {
    value: TriggerType
    label: string
}

interface ActionOption {
    value: ActionType
    label: string
}

interface BadgeOption {
    value: string
    label: string
}

interface FormErrors {
    [key: string]: string
}

// Trigger options
const triggerOptions: TriggerOption[] = [
    { value: "quiz_completion", label: "Quiz Completion" },
    { value: "leaderboard_update", label: "Leaderboard Update" },
    { value: "streak_update", label: "Streak Update" },
    { value: "score_threshold", label: "Score Threshold" },
    { value: "time_threshold", label: "Time Threshold" },
]

// Action options
const actionOptions: ActionOption[] = [
    { value: "award_badge", label: "Award Badge" },
    { value: "add_points", label: "Add Points" },
    { value: "send_notification", label: "Send Notification" },
    { value: "unlock_content", label: "Unlock Content" },
]

// Badge options (for action values)
const badgeOptions: BadgeOption[] = [
    { value: "First Quiz", label: "First Quiz" },
    { value: "Perfect Score", label: "Perfect Score" },
    { value: "Weekly Champion", label: "Weekly Champion" },
    { value: "Quiz Master", label: "Quiz Master" },
    { value: "Speed Demon", label: "Speed Demon" },
    { value: "Consistency King", label: "Consistency King" },
    { value: "Medical Expert", label: "Medical Expert" },
    { value: "Rising Star", label: "Rising Star" },
]

// Define validation schema for rule
const ruleSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    description: z
        .string()
        .min(5, "Description must be at least 5 characters")
        .max(200, "Description cannot exceed 200 characters"),
    trigger: z.enum(["quiz_completion", "leaderboard_update", "streak_update", "score_threshold", "time_threshold"]),
    condition: z.string().min(1, "Condition is required"),
    action: z.enum(["award_badge", "add_points", "send_notification", "unlock_content"]),
    actionValue: z.string().min(1, "Action value is required"),
    status: z.enum(["active", "inactive"]),
})

// Set up axios with base URL
const API_BASE_URL = "https://medical-backend-loj4.onrender.com/api"
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

export function RuleBuilder() {
    const [rules, setRules] = useState<Rule[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [activeTab, setActiveTab] = useState<RuleStatus | "all">("active")
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false)
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [newRule, setNewRule] = useState<RuleFormData>({
        name: "",
        description: "",
        trigger: "quiz_completion",
        condition: "",
        action: "award_badge",
        actionValue: "First Quiz",
        status: "active",
    })


    // Fetch rules based on active tab and filters
    const fetchRules = useCallback(
        async (additionalFilters: Record<string, string | number> = {}) => {
            setIsLoading(true)
            try {
                const filters: Record<string, string | number> = { ...additionalFilters }
                if (activeTab !== "all") {
                    filters.status = activeTab
                }

                const params = new URLSearchParams()
                Object.entries(filters).forEach(([key, value]) => {
                    params.append(key, String(value))
                })

                const response = await api.get<ApiResponse<Rule[]>>(
                    `/rules/getRules?${params.toString()}`
                )
                setRules(response.data.data || [])
            } catch (error) {
                console.error("Error fetching rules:", error)
                toast.error("Failed to fetch rules. Please try again.")
            } finally {
                setIsLoading(false)
            }
        },
        [activeTab] // dependency because activeTab is used inside fetchRules
    )

    // Fetch rules on component mount and when activeTab changes
    useEffect(() => {
        fetchRules()
    }, [activeTab, fetchRules])

    // Fetch rules with search term when it changes (with debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                fetchRules({ search: searchTerm })
            }
        }, 2500)

        return () => clearTimeout(timer)
    }, [searchTerm, fetchRules])

    // Validate rule data
    const validateRule = (rule: RuleFormData): boolean => {
        try {
            ruleSchema.parse(rule)
            setFormErrors({})
            return true
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: FormErrors = {}
                error.errors.forEach((err) => {
                    const field = err.path[0]
                    errors[field as string] = err.message
                })
                setFormErrors(errors)
            }
            return false
        }
    }

    // Handle creating a new rule
    const handleCreateRule = async () => {
        if (!validateRule(newRule)) {
            toast.error("Please fix the validation errors in the form.")
            return
        }

        try {
            const response = await api.post<ApiResponse<Rule>>("/rules/createRule", newRule)
            console.log(response.data)
            setIsCreateDialogOpen(false)
            resetForm()
            fetchRules()
            toast.success("Rule created successfully")
        } catch (error) {
            console.error("Error creating rule:", error)
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || "Failed to create rule")
            } else {
                toast.error("Failed to create rule")
            }
        }
    }

    // Handle updating a rule
    const handleUpdateRule = async () => {
        if (!selectedRule) return

        if (!validateRule(selectedRule)) {
            toast.error("Please fix the validation errors in the form.")
            return
        }

        try {
            const response = await api.put<ApiResponse<Rule>>(`/rules/updateRule/${selectedRule._id}`, selectedRule)
            console.log(response.data)
            setIsEditDialogOpen(false)
            fetchRules()
            toast.success("Rule updated successfully")
        } catch (error) {
            console.error("Error updating rule:", error)
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || "Failed to create rule")
            } else {
                toast.error("Failed to update rule")
            }
        }
    }

    // Handle deleting a rule
    const handleDeleteRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) {
            return
        }

        try {
            await api.delete<ApiResponse<unknown>>(`/rules/deleteRule/${id}`)
            fetchRules()
            toast.success("Rule deleted successfully")
        } catch (error) {
            console.error("Error deleting rule:", error)
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || "Failed to create rule")
            } else {
                toast.error("Failed to delete rule")
            }
        }
    }

    // Handle toggling rule status
    const handleToggleStatus = async (id: string) => {
        try {
            await api.patch<ApiResponse<Rule>>(`/rules/toggleRuleStatus/${id}`)
            fetchRules()
            toast.success("Rule status updated")
        } catch (error) {
            console.error("Error toggling rule status:", error)
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || "Failed to update rule status")
            } else {
                toast.error("Failed to update rule status")
            }
        }
    }

    // Handle duplicating a rule
    // const handleDuplicateRule = async (id: string) => {
    //     try {
    //         await api.post<ApiResponse<Rule>>(`/rules/duplicateRule/${id}`)
    //         fetchRules()
    //         toast.success("Rule duplicated successfully")
    //     } catch (error: any) {
    //         console.error("Error duplicating rule:", error)
    //         toast.error(error.response?.data?.error || "Failed to duplicate rule")
    //     }
    // }

    // Reset form state
    const resetForm = () => {
        setNewRule({
            name: "",
            description: "",
            trigger: "quiz_completion",
            condition: "",
            action: "award_badge",
            actionValue: "First Quiz",
            status: "active",
        })
        setFormErrors({})
    }

    // Open edit dialog with rule data
    const openEditDialog = async (rule: Rule) => {
        try {
            // Fetch the latest rule data
            const response = await api.get<ApiResponse<Rule>>(`/rules/getRule/${rule._id}`)
            setSelectedRule(response.data.data)
            setFormErrors({})
            setIsEditDialogOpen(true)
        } catch (error) {
            console.error("Error fetching rule details:", error)
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || "Failed to fetch rule details")
            } else {
                toast.error("Failed to fetch rule details")
            }
        }
    }

    // Validate condition syntax
    const validateConditionSyntax = (condition: string): boolean => {
        // Simple validation for common condition patterns
        const validPatterns = [
            /^[a-zA-Z0-9_]+ *[=><]+ *[a-zA-Z0-9_'".]+$/, // var == value
            /^[a-zA-Z0-9_]+ *[=><]+ *[a-zA-Z0-9_'".]+( *&& *[a-zA-Z0-9_]+ *[=><]+ *[a-zA-Z0-9_'".])+$/, // var == value && var2 == value2
            /^[a-zA-Z0-9_]+ *[=><]+ *[a-zA-Z0-9_'".]+( *\|\| *[a-zA-Z0-9_]+ *[=><]+ *[a-zA-Z0-9_'".])+$/, // var == value || var2 == value2
        ]

        return validPatterns.some((pattern) => pattern.test(condition))
    }

    // Handle condition input change with validation
    const handleConditionChange = (value: string, isNewRule = true) => {
        if (isNewRule) {
            setNewRule({ ...newRule, condition: value })
        } else if (selectedRule) {
            setSelectedRule({ ...selectedRule, condition: value })
        }

        // Validate condition syntax
        if (value && !validateConditionSyntax(value)) {
            setFormErrors((prev) => ({
                ...prev,
                condition: "Invalid condition syntax. Use format like 'variable == value' or 'variable >= number'",
            }))
        } else {
            setFormErrors((prev) => {
                const { condition, ...rest } = prev
                console.log(condition)
                return rest
            })
        }
    }

    // Handle action value change with validation
    const handleActionValueChange = (value: string, isNewRule = true) => {
        if (isNewRule) {
            setNewRule({ ...newRule, actionValue: value })
        } else if (selectedRule) {
            setSelectedRule({ ...selectedRule, actionValue: value })
        }

        // Validate action value based on action type
        const action = isNewRule ? newRule.action : selectedRule?.action

        if (action === "add_points") {
            const pointsValue = Number.parseInt(value)
            if (isNaN(pointsValue) || pointsValue <= 0) {
                setFormErrors((prev) => ({
                    ...prev,
                    actionValue: "Points must be a positive number",
                }))
                return
            }
        }

        if (!value) {
            setFormErrors((prev) => ({
                ...prev,
                actionValue: "Action value is required",
            }))
            return
        }

        setFormErrors((prev) => {
            const { actionValue, ...rest } = prev
            console.log(actionValue)
            return rest
        })
    }

    return (
        <div className="space-y-6">
            {/* React Hot Toast container */}
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rule Builder</h1>
                    <p className="text-muted-foreground">Create and manage automated rules for badge assignments.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search rules..."
                            className="pl-8 w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Dialog
                        open={isCreateDialogOpen}
                        onOpenChange={(open) => {
                            setIsCreateDialogOpen(open)
                            if (!open) resetForm()
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Rule
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Create New Rule</DialogTitle>
                                <DialogDescription>Define an automated rule for awarding badges or other actions.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-name">Rule Name</Label>
                                        <Input
                                            id="rule-name"
                                            placeholder="e.g., First Quiz Completion"
                                            value={newRule.name}
                                            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                            className={formErrors.name ? "border-red-500" : ""}
                                        />
                                        {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-status">Status</Label>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="rule-status"
                                                checked={newRule.status === "active"}
                                                onCheckedChange={(checked) =>
                                                    setNewRule({ ...newRule, status: checked ? "active" : "inactive" })
                                                }
                                            />
                                            <Label htmlFor="rule-status">{newRule.status === "active" ? "Active" : "Inactive"}</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rule-description">Description</Label>
                                    <Input
                                        id="rule-description"
                                        placeholder="Describe what this rule does"
                                        value={newRule.description}
                                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                        className={formErrors.description ? "border-red-500" : ""}
                                    />
                                    {formErrors.description && <p className="text-xs text-red-500">{formErrors.description}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rule-trigger">Trigger</Label>
                                    <Select
                                        value={newRule.trigger}
                                        onValueChange={(value: TriggerType) => setNewRule({ ...newRule, trigger: value })}
                                    >
                                        <SelectTrigger id="rule-trigger" className={formErrors.trigger ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select trigger" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {triggerOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formErrors.trigger && <p className="text-xs text-red-500">{formErrors.trigger}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rule-condition">Condition</Label>
                                    <Input
                                        id="rule-condition"
                                        placeholder="e.g., count == 1 or score >= 90"
                                        value={newRule.condition}
                                        onChange={(e) => handleConditionChange(e.target.value)}
                                        className={formErrors.condition ? "border-red-500" : ""}
                                    />
                                    {formErrors.condition ? (
                                        <p className="text-xs text-red-500">{formErrors.condition}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Use variables like count, score, time, rank based on the trigger type.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rule-action">Action</Label>
                                        <Select
                                            value={newRule.action}
                                            onValueChange={(value: ActionType) => setNewRule({ ...newRule, action: value })}
                                        >
                                            <SelectTrigger id="rule-action" className={formErrors.action ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Select action" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {actionOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {formErrors.action && <p className="text-xs text-red-500">{formErrors.action}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="rule-action-value">Action Value</Label>
                                        {newRule.action === "award_badge" ? (
                                            <Select value={newRule.actionValue} onValueChange={(value) => handleActionValueChange(value)}>
                                                <SelectTrigger
                                                    id="rule-action-value"
                                                    className={formErrors.actionValue ? "border-red-500" : ""}
                                                >
                                                    <SelectValue placeholder="Select badge" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {badgeOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                id="rule-action-value"
                                                placeholder={newRule.action === "add_points" ? "e.g., 100" : "e.g., Congratulations!"}
                                                value={newRule.actionValue}
                                                onChange={(e) => handleActionValueChange(e.target.value)}
                                                type={newRule.action === "add_points" ? "number" : "text"}
                                                min={newRule.action === "add_points" ? "1" : undefined}
                                                className={formErrors.actionValue ? "border-red-500" : ""}
                                            />
                                        )}
                                        {formErrors.actionValue && <p className="text-xs text-red-500">{formErrors.actionValue}</p>}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateRule}>Create Rule</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Rules table */}
            <Card>
                <CardHeader>
                    <CardTitle>Automation Rules</CardTitle>
                    <CardDescription>
                        Rules that automatically award badges or perform other actions based on user activities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs
                        defaultValue="active"
                        value={activeTab}
                        onValueChange={(value) => setActiveTab(value as RuleStatus | "all")}
                    >
                        <TabsList className="mb-4">
                            <TabsTrigger value="active">Active Rules</TabsTrigger>
                            <TabsTrigger value="inactive">Inactive Rules</TabsTrigger>
                            <TabsTrigger value="all">All Rules</TabsTrigger>
                        </TabsList>

                        <TabsContent value="active">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rule</TableHead>
                                        <TableHead>Trigger</TableHead>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                Loading rules...
                                            </TableCell>
                                        </TableRow>
                                    ) : rules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                No active rules found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rules
                                            .filter((rule) => rule.status === "active")
                                            .map((rule) => (
                                                <TableRow key={rule._id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{rule.name}</div>
                                                            <div className="text-xs text-muted-foreground">{rule.description}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {rule.trigger.replace("_", " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                                            {rule.condition}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="capitalize">
                                                                {rule.action.replace("_", " ")}
                                                            </Badge>
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">{rule.actionValue}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => openEditDialog(rule)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(rule._id)}>
                                                                    <Pause className="mr-2 h-4 w-4" />
                                                                    Deactivate
                                                                </DropdownMenuItem>
                                                                {/* <DropdownMenuItem onClick={() => handleDuplicateRule(rule._id)}>
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Duplicate
                                                                </DropdownMenuItem> */}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => handleDeleteRule(rule._id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="inactive">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rule</TableHead>
                                        <TableHead>Trigger</TableHead>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                Loading rules...
                                            </TableCell>
                                        </TableRow>
                                    ) : rules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4">
                                                No inactive rules found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rules
                                            .filter((rule) => rule.status === "inactive")
                                            .map((rule) => (
                                                <TableRow key={rule._id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{rule.name}</div>
                                                            <div className="text-xs text-muted-foreground">{rule.description}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {rule.trigger.replace("_", " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                                            {rule.condition}
                                                        </code>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="capitalize">
                                                                {rule.action.replace("_", " ")}
                                                            </Badge>
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">{rule.actionValue}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => openEditDialog(rule)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleToggleStatus(rule._id)}>
                                                                    <Play className="mr-2 h-4 w-4" />
                                                                    Activate
                                                                </DropdownMenuItem>
                                                                {/* <DropdownMenuItem onClick={() => handleDuplicateRule(rule._id)}>
                                                                    <Copy className="mr-2 h-4 w-4" />
                                                                    Duplicate
                                                                </DropdownMenuItem> */}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => handleDeleteRule(rule._id)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="all">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rule</TableHead>
                                        <TableHead>Trigger</TableHead>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4">
                                                Loading rules...
                                            </TableCell>
                                        </TableRow>
                                    ) : rules.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4">
                                                No rules found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rules.map((rule) => (
                                            <TableRow key={rule._id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{rule.name}</div>
                                                        <div className="text-xs text-muted-foreground">{rule.description}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {rule.trigger.replace("_", " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                                        {rule.condition}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="capitalize">
                                                            {rule.action.replace("_", " ")}
                                                        </Badge>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm">{rule.actionValue}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${rule.status === "active" ? "bg-green-500" : "bg-gray-300"}`}
                                                        ></div>
                                                        <span className="capitalize">{rule.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => openEditDialog(rule)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleStatus(rule._id)}>
                                                                {rule.status === "active" ? (
                                                                    <>
                                                                        <Pause className="mr-2 h-4 w-4" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Play className="mr-2 h-4 w-4" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            {/* <DropdownMenuItem onClick={() => handleDuplicateRule(rule._id)}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Duplicate
                                                            </DropdownMenuItem> */}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteRule(rule._id)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Edit Rule Dialog */}
            <Dialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open)
                    if (!open) setFormErrors({})
                }}
            >
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Rule</DialogTitle>
                        <DialogDescription>Update the rule details.</DialogDescription>
                    </DialogHeader>
                    {selectedRule && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-rule-name">Rule Name</Label>
                                    <Input
                                        id="edit-rule-name"
                                        value={selectedRule.name}
                                        onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                                        className={formErrors.name ? "border-red-500" : ""}
                                    />
                                    {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-rule-status">Status</Label>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="edit-rule-status"
                                            checked={selectedRule.status === "active"}
                                            onCheckedChange={(checked) =>
                                                setSelectedRule({ ...selectedRule, status: checked ? "active" : "inactive" })
                                            }
                                        />
                                        <Label htmlFor="edit-rule-status">{selectedRule.status === "active" ? "Active" : "Inactive"}</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-rule-description">Description</Label>
                                <Input
                                    id="edit-rule-description"
                                    value={selectedRule.description}
                                    onChange={(e) => setSelectedRule({ ...selectedRule, description: e.target.value })}
                                    className={formErrors.description ? "border-red-500" : ""}
                                />
                                {formErrors.description && <p className="text-xs text-red-500">{formErrors.description}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-rule-trigger">Trigger</Label>
                                <Select
                                    value={selectedRule.trigger}
                                    onValueChange={(value: TriggerType) => setSelectedRule({ ...selectedRule, trigger: value })}
                                >
                                    <SelectTrigger id="edit-rule-trigger" className={formErrors.trigger ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Select trigger" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {triggerOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.trigger && <p className="text-xs text-red-500">{formErrors.trigger}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-rule-condition">Condition</Label>
                                <Input
                                    id="edit-rule-condition"
                                    value={selectedRule.condition}
                                    onChange={(e) => handleConditionChange(e.target.value, false)}
                                    className={formErrors.condition ? "border-red-500" : ""}
                                />
                                {formErrors.condition ? (
                                    <p className="text-xs text-red-500">{formErrors.condition}</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Use variables like count, score, time, rank based on the trigger type.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-rule-action">Action</Label>
                                    <Select
                                        value={selectedRule.action}
                                        onValueChange={(value: ActionType) => setSelectedRule({ ...selectedRule, action: value })}
                                    >
                                        <SelectTrigger id="edit-rule-action" className={formErrors.action ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {actionOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formErrors.action && <p className="text-xs text-red-500">{formErrors.action}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-rule-action-value">Action Value</Label>
                                    {selectedRule.action === "award_badge" ? (
                                        <Select
                                            value={selectedRule.actionValue}
                                            onValueChange={(value) => handleActionValueChange(value, false)}
                                        >
                                            <SelectTrigger
                                                id="edit-rule-action-value"
                                                className={formErrors.actionValue ? "border-red-500" : ""}
                                            >
                                                <SelectValue placeholder="Select badge" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {badgeOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="edit-rule-action-value"
                                            placeholder={selectedRule.action === "add_points" ? "e.g., 100" : "e.g., Congratulations!"}
                                            value={selectedRule.actionValue}
                                            onChange={(e) => handleActionValueChange(e.target.value, false)}
                                            type={selectedRule.action === "add_points" ? "number" : "text"}
                                            min={selectedRule.action === "add_points" ? "1" : undefined}
                                            className={formErrors.actionValue ? "border-red-500" : ""}
                                        />
                                    )}
                                    {formErrors.actionValue && <p className="text-xs text-red-500">{formErrors.actionValue}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateRule}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}