'use client'

import { useState, useRef } from 'react'
import { 
  User, 
  Mail, 
  Lock, 
  Server, 
  Monitor, 
  Apple, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Upload,
  Send,
  Shield,
  Users
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { UserManagementModal } from './user-management-modal'
import { MSC_Projectz_PayloadUsersPanel } from '@/components/MSC-Projectz-PayloadUsersPanel'
import { useAppStore } from '@/lib/store'

export function SettingsView() {
  const { appSettings, updateAppSettings, changeMasterPassword, user, updateUser } = useAppStore()
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || appSettings.email)
  const [avatar, setAvatar] = useState(user?.avatar || '')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [pathFormat, setPathFormat] = useState(appSettings.pathFormat)
  
  // Spacemail SMTP Settings
  const [smtpIncomingHost, setSmtpIncomingHost] = useState(appSettings.smtp.incomingHost)
  const [smtpIncomingPort, setSmtpIncomingPort] = useState(appSettings.smtp.incomingPort)
  const [smtpOutgoingHost, setSmtpOutgoingHost] = useState(appSettings.smtp.outgoingHost)
  const [smtpOutgoingPort, setSmtpOutgoingPort] = useState(appSettings.smtp.outgoingPort)
  const [smtpUsername, setSmtpUsername] = useState(appSettings.smtp.username)
  const [smtpPassword, setSmtpPassword] = useState(appSettings.smtp.password)
  const [smtpSsl, setSmtpSsl] = useState(appSettings.smtp.ssl)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailMessage, setTestEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setAvatar(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    
    const success = changeMasterPassword(currentPassword, newPassword)
    if (success) {
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      setPasswordMessage({ type: 'error', text: 'Current password is incorrect' })
    }
    
    setTimeout(() => setPasswordMessage(null), 3000)
  }

  const handleSendTestEmail = async () => {
    setTestEmailSending(true)
    setTestEmailMessage(null)
    
    // Simulate sending test email
    await new Promise((r) => setTimeout(r, 1500))
    
    if (smtpUsername && smtpPassword) {
      setTestEmailMessage({ type: 'success', text: 'Test email sent successfully!' })
    } else {
      setTestEmailMessage({ type: 'error', text: 'Please fill in all SMTP credentials' })
    }
    
    setTestEmailSending(false)
    setTimeout(() => setTestEmailMessage(null), 3000)
  }

  const handleSaveSettings = () => {
    updateUser({ username, email, avatar })
    updateAppSettings({
      email,
      pathFormat,
      smtp: {
        incomingHost: smtpIncomingHost,
        incomingPort: smtpIncomingPort,
        outgoingHost: smtpOutgoingHost,
        outgoingPort: smtpOutgoingPort,
        username: smtpUsername,
        password: smtpPassword,
        ssl: smtpSsl,
      },
    })
    setSaveMessage('Settings saved successfully')
    setTimeout(() => setSaveMessage(null), 3000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Manage your account, preferences, and Spacemail SMTP configuration
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={[]}
        className="space-y-4"
      >
        {/* Profile Section */}
        <AccordionItem
          value="profile"
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <AccordionTrigger className="px-6 py-4 text-left text-foreground hover:no-underline [&>svg]:text-primary">
            <div className="min-w-0 pr-2">
              <h2 className="text-lg font-medium flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-primary shrink-0" />
                Profile
              </h2>
              <p className="text-sm mt-1 text-muted-foreground font-normal">
                Manage your profile information and avatar
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 text-foreground">
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-secondary border-2 border-border">
                {avatar ? (
                  <Image 
                    src={avatar} 
                    alt="Avatar" 
                    width={96} 
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="bg-input border-border text-foreground"
                />
              </div>
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Change Master Password</span>
            </div>
            
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-xs text-muted-foreground">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10 bg-input border-border text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs text-muted-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 bg-input border-border text-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>

              {passwordMessage && (
                <div 
                  className="flex items-center gap-2 text-sm"
                  style={{ color: passwordMessage.type === 'success' ? '#4ADE80' : '#EF4444' }}
                >
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {passwordMessage.text}
                </div>
              )}

              <Button 
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </AccordionContent>
        </AccordionItem>

        {/* User Management Section - Admin Only */}
        {user?.role === 'admin' && (
          <AccordionItem
            value="user-management"
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <AccordionTrigger className="px-6 py-4 text-left text-foreground hover:no-underline [&>svg]:text-primary">
              <div className="min-w-0 pr-2">
                <h2 className="text-lg font-medium flex items-center flex-wrap gap-2 text-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary shrink-0" />
                    User Management
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                    Admin
                  </span>
                </h2>
                <p className="text-sm mt-1 text-muted-foreground font-normal">
                  Manage user accounts and permissions
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 text-foreground space-y-6">
              <MSC_Projectz_PayloadUsersPanel />
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Workspace invites (in-app list)</p>
                <Button
                  onClick={() => setUserManagementOpen(true)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Users className="w-4 h-4" />
                  Open invite / pending users
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* App Preferences */}
        <AccordionItem
          value="preferences"
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <AccordionTrigger className="px-6 py-4 text-left text-foreground hover:no-underline [&>svg]:text-primary">
            <div className="min-w-0 pr-2">
              <h2 className="text-lg font-medium flex items-center gap-2 text-foreground">
                <Monitor className="w-5 h-5 text-primary shrink-0" />
                App Preferences
              </h2>
              <p className="text-sm mt-1 text-muted-foreground font-normal">
                Configure application behavior and display settings
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 text-foreground">
        <div className="p-4 rounded-lg bg-secondary border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-card">
                {pathFormat === 'windows' ? (
                  <Monitor className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Apple className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Local Path Format</p>
                <p className="text-xs text-muted-foreground">
                  {pathFormat === 'windows' 
                    ? 'Windows style: C:\\Projects\\my-project' 
                    : 'Mac style: /Users/name/Projects/my-project'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Windows</span>
              <Switch
                checked={pathFormat === 'mac'}
                onCheckedChange={(checked) => setPathFormat(checked ? 'mac' : 'windows')}
              />
              <span className="text-xs text-primary">Mac</span>
            </div>
          </div>
        </div>
          </AccordionContent>
        </AccordionItem>

        {/* Spacemail SMTP Configuration */}
        <AccordionItem
          value="smtp"
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <AccordionTrigger className="px-6 py-4 text-left text-foreground hover:no-underline [&>svg]:text-primary">
            <div className="min-w-0 pr-2">
              <h2 className="text-lg font-medium flex items-center gap-2 text-foreground">
                <Server className="w-5 h-5 text-primary shrink-0" />
                Spacemail SMTP Configuration
              </h2>
              <p className="text-sm mt-1 text-muted-foreground font-normal">
                Configure Spacemail settings for email notifications and password recovery
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 text-foreground">
        <div className="space-y-6">
          {/* Incoming Mail (IMAP) */}
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Incoming Mail (IMAP)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imap-host" className="text-xs text-muted-foreground">
                  Host
                </Label>
                <Input
                  id="imap-host"
                  value={smtpIncomingHost}
                  onChange={(e) => setSmtpIncomingHost(e.target.value)}
                  placeholder="mail.spacemail.com"
                  className="bg-card border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imap-port" className="text-xs text-muted-foreground">
                  Port
                </Label>
                <Input
                  id="imap-port"
                  value={smtpIncomingPort}
                  onChange={(e) => setSmtpIncomingPort(e.target.value)}
                  placeholder="993"
                  className="bg-card border-border text-foreground"
                />
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">SSL/TLS Enabled</p>
          </div>

          {/* Outgoing Mail (SMTP) */}
          <div className="p-4 rounded-lg bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Outgoing Mail (SMTP)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host" className="text-xs text-muted-foreground">
                  Host
                </Label>
                <Input
                  id="smtp-host"
                  value={smtpOutgoingHost}
                  onChange={(e) => setSmtpOutgoingHost(e.target.value)}
                  placeholder="mail.spacemail.com"
                  className="bg-card border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port" className="text-xs text-muted-foreground">
                  Port
                </Label>
                <Input
                  id="smtp-port"
                  value={smtpOutgoingPort}
                  onChange={(e) => setSmtpOutgoingPort(e.target.value)}
                  placeholder="465"
                  className="bg-card border-border text-foreground"
                />
              </div>
            </div>
            <p className="text-xs mt-2 text-muted-foreground">SSL/TLS Enabled</p>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-username" className="text-xs text-muted-foreground">
                Username
              </Label>
              <Input
                id="smtp-username"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="you@spacemail.com"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password" className="text-xs text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="smtp-password"
                  type={showSmtpPassword ? 'text' : 'password'}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="Your Spacemail password"
                  className="pr-10 bg-input border-border text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* SSL Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">SSL/TLS Encryption</p>
              <p className="text-xs text-muted-foreground">Required for secure email transmission</p>
            </div>
            <Switch
              checked={smtpSsl}
              onCheckedChange={setSmtpSsl}
            />
          </div>

          {/* Test Email */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleSendTestEmail}
              disabled={testEmailSending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {testEmailSending ? 'Sending...' : 'Send Test Email'}
            </Button>
            {testEmailMessage && (
              <div 
                className="flex items-center gap-2 text-sm"
                style={{ color: testEmailMessage.type === 'success' ? '#4ADE80' : '#EF4444' }}
              >
                {testEmailMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {testEmailMessage.text}
              </div>
            )}
          </div>
        </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {saveMessage && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle className="w-4 h-4" />
            {saveMessage}
          </div>
        )}
        <div className="flex-1" />
        <Button 
          onClick={handleSaveSettings} 
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>

      {/* User Management Modal */}
      <UserManagementModal 
        isOpen={userManagementOpen} 
        onClose={() => setUserManagementOpen(false)} 
      />
    </div>
  )
}
