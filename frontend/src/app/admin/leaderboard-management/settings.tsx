"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Save, Shield } from "lucide-react"
import { useState } from "react"

export function Settings() {
    const [generalSettings, setGeneralSettings] = useState({
        systemName: "Medical Quiz Gamification",
        adminEmail: "admin@example.com",
        notificationsEnabled: true,
        publicLeaderboards: true,
        badgeNotifications: true,
        rankChangeNotifications: true,
        achievementNotifications: true,
        theme: "system",
        language: "en",
    })

    const handleGeneralSettingsChange = (field: keyof typeof generalSettings, value: string | boolean) => {
        setGeneralSettings({
            ...generalSettings,
            [field]: value,
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your gamification system settings.</p>
            </div>

            <Tabs defaultValue="general">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                {/* General Settings Tab */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure the basic settings for your gamification system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="system-name">System Name</Label>
                                    <Input
                                        id="system-name"
                                        value={generalSettings.systemName}
                                        onChange={(e) => handleGeneralSettingsChange("systemName", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin-email">Admin Email</Label>
                                    <Input
                                        id="admin-email"
                                        type="email"
                                        value={generalSettings.adminEmail}
                                        onChange={(e) => handleGeneralSettingsChange("adminEmail", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select
                                        value={generalSettings.language}
                                        onValueChange={(value) => handleGeneralSettingsChange("language", value)}
                                    >
                                        <SelectTrigger id="language">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                            <SelectItem value="zh">Chinese</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Theme</Label>
                                    <Select
                                        value={generalSettings.theme}
                                        onValueChange={(value) => handleGeneralSettingsChange("theme", value)}
                                    >
                                        <SelectTrigger id="theme">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="public-leaderboards">Public Leaderboards</Label>
                                    <Switch
                                        id="public-leaderboards"
                                        checked={generalSettings.publicLeaderboards}
                                        onCheckedChange={(checked) => handleGeneralSettingsChange("publicLeaderboards", checked)}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Allow users to view leaderboards without logging in.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="notifications-enabled">System Notifications</Label>
                                    <Switch
                                        id="notifications-enabled"
                                        checked={generalSettings.notificationsEnabled}
                                        onCheckedChange={(checked) => handleGeneralSettingsChange("notificationsEnabled", checked)}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Enable or disable all system notifications.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Badge System Settings</CardTitle>
                            <CardDescription>
                                Configure how badges are displayed and awarded.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="show-badges-profile">Show Badges on Profiles</Label>
                                    <Switch id="show-badges-profile" defaultChecked />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Display earned badges on user profiles.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="show-badges-leaderboard">Show Badges on Leaderboards</Label>
                                    <Switch id="show-badges-leaderboard" defaultChecked />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Display user badges next to their names on leaderboards.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="allow-multiple-badges">Allow Multiple Badge Types</Label>
                                    <Switch id="allow-multiple-badges" defaultChecked />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Allow users to earn multiple badges of the same type.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="show-badge-progress">Show Badge Progress</Label>
                                    <Switch id="show-badge-progress" defaultChecked />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Display progress towards earning badges.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme Settings</CardTitle>
                            <CardDescription>
                                Customize the appearance of your gamification system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="primary-color">Primary Color</Label>
                                    <div className="flex gap-2">
                                        <Input id="primary-color" type="color" defaultValue="#0284c7" className="w-16 h-10" />
                                        <Input defaultValue="#0284c7" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="secondary-color">Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <Input id="secondary-color" type="color" defaultValue="#7c3aed" className="w-16 h-10" />
                                        <Input defaultValue="#7c3aed" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="badge-style">Badge Style</Label>
                                    <Select defaultValue="modern">
                                        <SelectTrigger id="badge-style">
                                            <SelectValue placeholder="Select style" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="modern">Modern</SelectItem>
                                            <SelectItem value="classic">Classic</SelectItem>
                                            <SelectItem value="minimal">Minimal</SelectItem>
                                            <SelectItem value="colorful">Colorful</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="animation-style">Animation Style</Label>
                                    <Select defaultValue="subtle">
                                        <SelectTrigger id="animation-style">
                                            <SelectValue placeholder="Select style" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="subtle">Subtle</SelectItem>
                                            <SelectItem value="bounce">Bounce</SelectItem>
                                            <SelectItem value="fade">Fade</SelectItem>
                                            <SelectItem value="slide">Slide</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom-css">Custom CSS</Label>
                                <Textarea
                                    id="custom-css"
                                    placeholder=".badge { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }"
                                    className="font-mono text-sm"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Add custom CSS to further customize the appearance.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Badge Appearance</CardTitle>
                            <CardDescription>
                                Customize how badges look in your system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="badge-size">Badge Size</Label>
                                    <Select defaultValue="medium">
                                        <SelectTrigger id="badge-size">
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="badge-shape">Badge Shape</Label>
                                    <Select defaultValue="circle">
                                        <SelectTrigger id="badge-shape">
                                            <SelectValue placeholder="Select shape" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="circle">Circle</SelectItem>
                                            <SelectItem value="square">Square</SelectItem>
                                            <SelectItem value="rounded">Rounded</SelectItem>
                                            <SelectItem value="hexagon">Hexagon</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="badge-border">Badge Border</Label>
                                <Select defaultValue="thin">
                                    <SelectTrigger id="badge-border">
                                        <SelectValue placeholder="Select border style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="thin">Thin</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="thick">Thick</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="badge-shadow">Badge Shadow</Label>
                                    <Switch id="badge-shadow" defaultChecked />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Add a subtle shadow effect to badges.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="badge-animation">Badge Animation</Label>
                                    <Switch id="badge-animation" defaultChecked />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Add animation effects when badges are earned or displayed.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>
                                Configure how and when notifications are sent to users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="badge-notifications">Badge Earned Notifications</Label>
                                    <Switch
                                        id="badge-notifications"
                                        checked={generalSettings.badgeNotifications}
                                        onCheckedChange={(checked) => handleGeneralSettingsChange("badgeNotifications", checked)}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Notify users when they earn a new badge.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="rank-notifications">Rank Change Notifications</Label>
                                    <Switch
                                        id="rank-notifications"
                                        checked={generalSettings.rankChangeNotifications}
                                        onCheckedChange={(checked) => handleGeneralSettingsChange("rankChangeNotifications", checked)}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Notify users when their rank changes on the leaderboard.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="achievement-notifications">Achievement Notifications</Label>
                                    <Switch
                                        id="achievement-notifications"
                                        checked={generalSettings.achievementNotifications}
                                        onCheckedChange={(checked) => handleGeneralSettingsChange("achievementNotifications", checked)}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Notify users when they reach significant milestones.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notification-frequency">Notification Frequency</Label>
                                <Select defaultValue="immediate">
                                    <SelectTrigger id="notification-frequency">
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="immediate">Immediate</SelectItem>
                                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                                        <SelectItem value="daily">Daily Digest</SelectItem>
                                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notification-channels">Notification Channels</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="channel-inapp" defaultChecked />
                                        <label htmlFor="channel-inapp">In-App</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="channel-email" defaultChecked />
                                        <label htmlFor="channel-email">Email</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="channel-push" />
                                        <label htmlFor="channel-push">Push Notifications</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="channel-sms" />
                                        <label htmlFor="channel-sms">SMS</label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Email Templates</CardTitle>
                            <CardDescription>
                                Customize the email notifications sent to users.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-template">Email Template</Label>
                                <Select defaultValue="badge-earned">
                                    <SelectTrigger id="email-template">
                                        <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="badge-earned">Badge Earned</SelectItem>
                                        <SelectItem value="rank-change">Rank Change</SelectItem>
                                        <SelectItem value="achievement">Achievement</SelectItem>
                                        <SelectItem value="weekly-digest">Weekly Digest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-subject">Email Subject</Label>
                                <Input id="email-subject" defaultValue="Congratulations! You've earned a new badge!" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email-content">Email Content</Label>
                                <Textarea
                                    id="email-content"
                                    className="min-h-[200px]"
                                    defaultValue="Hi {{user.name}},

Congratulations on earning the {{badge.name}} badge! This badge recognizes your achievement in {{badge.description}}.

Keep up the great work!

Best regards,
The {{system.name}} Team"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">Available Variables:</p>
                                {/* <div className="text-sm text-muted-foreground space-y-1">\
                                    <p><code>{{ user.name }}</code> - User's name</p>
                                    <p><code>{{ badge.name }}</code> - Badge name</p>
                                    <p><code>{{ badge.description }}</code> - Badge description</p>
                                    <p><code>{{ system.name }}</code> - System name</p>
                                </div> */}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline">Preview</Button>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Template
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Advanced Settings</CardTitle>
                            <CardDescription>
                                Configure advanced settings for your gamification system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="api-key">API Key</Label>
                                <div className="flex gap-2">
                                    <Input id="api-key" type="password" value="sk_live_51NzQjKLkjOiJKLjkLJKLjkLJKLjkLJKLjkLJKLjk" readOnly />
                                    <Button variant="outline">Regenerate</Button>
                                    <Button variant="outline">Copy</Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Use this API key to integrate with external systems.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="webhook-url">Webhook URL</Label>
                                <Input id="webhook-url" placeholder="https://your-app.com/webhooks/gamification" />
                                <p className="text-sm text-muted-foreground">
                                    Receive real-time notifications about gamification events.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="data-retention">Data Retention Period</Label>
                                <Select defaultValue="1-year">
                                    <SelectTrigger id="data-retention">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30-days">30 Days</SelectItem>
                                        <SelectItem value="90-days">90 Days</SelectItem>
                                        <SelectItem value="6-months">6 Months</SelectItem>
                                        <SelectItem value="1-year">1 Year</SelectItem>
                                        <SelectItem value="forever">Forever</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    How long to keep detailed user activity data.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="debug-mode">Debug Mode</Label>
                                    <Switch id="debug-mode" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Enable detailed logging for troubleshooting.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>System Maintenance</CardTitle>
                            <CardDescription>
                                Perform maintenance tasks on your gamification system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Backup System Data
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Create a backup of all gamification data.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Restore From Backup
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Restore system data from a previous backup.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Recalculate User Statistics
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Recalculate all user statistics and leaderboards.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start text-destructive">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Reset All Gamification Data
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Warning: This will delete all badges, points, and user progress.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

