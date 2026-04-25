'use client'

import { useState } from 'react'
import { 
  Search, 
  BookOpen, 
  Code, 
  Workflow, 
  HelpCircle, 
  FolderOpen,
  Key,
  Globe,
  Server,
  Zap,
  Monitor,
  Lock,
  Mail,
  Users,
  Shield,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { useAppStore } from '@/lib/store'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

interface GuideItem {
  id: string
  title: string
  description: string
  steps: string[]
  category: string
}

const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I add a new project?',
    answer: 'Click the "+ Add Project" button in the sidebar or on the dashboard. Follow the 4-step wizard to set up your project: Identity (name & thumbnail), Connectivity (local path & URL), Credentials (vault entries), and Status (local vs live).',
    category: 'getting-started',
  },
  {
    id: 'faq-2',
    question: 'Where are my credentials stored?',
    answer: 'All credentials are stored locally in your browser using encrypted localStorage. Your data never leaves your machine. The master password encrypts access to the vault.',
    category: 'security',
  },
  {
    id: 'faq-3',
    question: 'How do I open a project in VS Code / Cursor?',
    answer: 'Click on a project card and hover over it to reveal quick actions. Click "Cursor" to open the project in your default code editor. This uses the vscode:// protocol.',
    category: 'workflow',
  },
  {
    id: 'faq-4',
    question: 'Can I change my master password?',
    answer: 'Yes! Go to Settings > Profile and use the "Change Master Password" section. You will need to enter your current password to confirm the change.',
    category: 'security',
  },
  {
    id: 'faq-5',
    question: 'What is the difference between Local and Live status?',
    answer: 'Local status indicates a project is in development on your machine. Live status means the project has been deployed and has a public URL. This helps you track deployment status.',
    category: 'workflow',
  },
  {
    id: 'faq-6',
    question: 'How do I configure Spacemail SMTP for email notifications?',
    answer: 'Go to Settings > Spacemail SMTP Configuration. For incoming mail (IMAP), use mail.spacemail.com on port 993 with SSL/TLS. For outgoing mail (SMTP), use mail.spacemail.com on port 465 with SSL/TLS. Enter your Spacemail username and password.',
    category: 'settings',
  },
  {
    id: 'faq-7',
    question: 'Can I export my project data?',
    answer: 'Project data is stored in localStorage under the key "msc-projectz-storage". You can export this data by copying the localStorage value from your browser developer tools.',
    category: 'data',
  },
  {
    id: 'faq-8',
    question: 'What happens if I forget my master password?',
    answer: 'Use the "Forgot Password?" link on the login page to receive a password recovery link via email. This requires Spacemail SMTP to be configured. If SMTP is not set up, you will need to clear localStorage and start fresh.',
    category: 'security',
  },
  {
    id: 'faq-9',
    question: 'How do I upload a profile avatar?',
    answer: 'Go to Settings > Profile section. Click the "Choose File" button below your current avatar to select an image from your local machine. The avatar is stored locally and displayed in the sidebar and dashboard header.',
    category: 'settings',
  },
  {
    id: 'faq-10',
    question: 'How can I add new users to MSC-Projectz?',
    answer: 'New user creation requires Admin Approval. Contact your system administrator to request a new account. The admin will create the account and provide login credentials via secure channel.',
    category: 'admin',
  },
]

const workflowGuides: GuideItem[] = [
  {
    id: 'guide-1',
    title: 'Setting Up Your First Project',
    description: 'Complete walkthrough for creating and configuring a new project in MSC-Projectz.',
    category: 'getting-started',
    steps: [
      'Click "+ Add Project" in the sidebar',
      'Enter a project name and optionally upload a thumbnail',
      'Set the local file path where your project lives',
      'Add any credentials needed (WP-Admin, FTP, etc.)',
      'Set the project status to Local or Live',
      'Click "Create Project" to finish setup',
    ],
  },
  {
    id: 'guide-2',
    title: 'Master Password Recovery',
    description: 'How to recover your master password if you forget it.',
    category: 'security',
    steps: [
      'On the login page, click "Forgot Password?"',
      'Enter the email address associated with your account',
      'Click "Send Recovery Link" to receive an email',
      'Check your inbox for the recovery email (powered by Spacemail)',
      'Click the recovery link in the email',
      'Set a new master password and confirm it',
      'Log in with your new password',
    ],
  },
  {
    id: 'guide-3',
    title: 'Spacemail SMTP Setup',
    description: 'Configure Spacemail for email notifications and password recovery.',
    category: 'settings',
    steps: [
      'Navigate to Settings from the sidebar',
      'Scroll to "Spacemail SMTP Configuration" section',
      'For Incoming Mail (IMAP): Set host to mail.spacemail.com and port to 993',
      'For Outgoing Mail (SMTP): Set host to mail.spacemail.com and port to 465',
      'Enter your Spacemail username (your full email address)',
      'Enter your Spacemail password',
      'Ensure SSL/TLS is enabled (default)',
      'Click "Send Test Email" to verify the configuration',
      'Click "Save Settings" to store your configuration',
    ],
  },
  {
    id: 'guide-4',
    title: 'Adding New Users (Admin Approval)',
    description: 'Process for adding new users to the MSC-Projectz system.',
    category: 'admin',
    steps: [
      'New user submits a request to the system administrator',
      'Admin verifies the user identity and need for access',
      'Admin creates a new account with username and temporary password',
      'User receives credentials via secure channel (encrypted email)',
      'User logs in with temporary password',
      'System prompts user to set a new master password',
      'User completes profile setup (avatar, email, preferences)',
      'User gains full access to MSC-Projectz features',
    ],
  },
  {
    id: 'guide-5',
    title: 'Managing Project Credentials',
    description: 'Learn how to securely store and organize login credentials for each project.',
    category: 'security',
    steps: [
      'Open the Project Vault by clicking "Open Vault" on any project card',
      'Click "+ Add Credential" to add a new entry',
      'Enter a label (e.g., "WP-Admin"), username, and password',
      'Use the eye icon to show/hide passwords',
      'Click the copy icon to copy credentials to clipboard',
      'Delete credentials using the trash icon',
    ],
  },
  {
    id: 'guide-6',
    title: 'Using the Task Pulse Feature',
    description: 'Track progress and manage to-do items for each project.',
    category: 'workflow',
    steps: [
      'Click on a project card to select it',
      'The Task Pulse panel appears on the right side',
      'Type a new task and press Enter to add it',
      'Click the checkbox to mark tasks as complete',
      'View completion progress at the top of the panel',
      'Tasks are saved automatically per project',
    ],
  },
  {
    id: 'guide-7',
    title: 'Editing Project Details',
    description: 'Update project information, thumbnails, and connectivity settings.',
    category: 'workflow',
    steps: [
      'Locate the project card you want to edit',
      'Click the Settings icon (gear) in the top-left of the thumbnail',
      'Or use the dropdown menu and select "Edit Project"',
      'Update the project name, thumbnail, paths, or status',
      'Click "Save Changes" to apply your updates',
    ],
  },
]

const categories = [
  { id: 'all', label: 'All Topics' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'security', label: 'Security' },
  { id: 'settings', label: 'Settings' },
  { id: 'admin', label: 'Admin' },
  { id: 'data', label: 'Data' },
]

export function HelpView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'instructionz'>('instructionz')
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const filteredFAQs = faqItems.filter((item) => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const filteredGuides = workflowGuides.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started': return <Zap className="w-3.5 h-3.5" />
      case 'workflow': return <Workflow className="w-3.5 h-3.5" />
      case 'security': return <Key className="w-3.5 h-3.5" />
      case 'settings': return <Server className="w-3.5 h-3.5" />
      case 'admin': return <Users className="w-3.5 h-3.5" />
      case 'data': return <FolderOpen className="w-3.5 h-3.5" />
      default: return <HelpCircle className="w-3.5 h-3.5" />
    }
  }

  // Key documentation items for Instructionz view
  const instructionzItems = [
    {
      id: 'inst-1',
      title: 'Master Password Recovery',
      icon: <Lock className="w-5 h-5" />,
      description: 'How to recover access if you forget your master password',
      content: [
        '1. Click "Forgot Password?" on the login screen',
        '2. Enter your registered email address',
        '3. A recovery link will be sent via Spacemail SMTP',
        '4. Click the link to reset your password',
        '5. Set a new master password (minimum 6 characters)',
        '',
        'Note: This requires Spacemail SMTP to be configured in Settings.',
        'If SMTP is not configured, contact your system administrator.',
      ],
    },
    {
      id: 'inst-2',
      title: 'SMTP Setup (Spacemail)',
      icon: <Mail className="w-5 h-5" />,
      description: 'Configure email for notifications and password recovery',
      smtpFields: {
        incoming: {
          host: 'mail.spacemail.com',
          port: '993',
          security: 'SSL/TLS'
        },
        outgoing: {
          host: 'mail.spacemail.com',
          port: '465',
          security: 'SSL/TLS'
        }
      },
      content: [
        'Click "Send Test Email" in Settings to verify your configuration.',
      ],
    },
    {
      id: 'inst-3',
      title: 'Adding New Users (Admin Approval)',
      icon: <Users className="w-5 h-5" />,
      description: 'Process for requesting and approving new user accounts',
      adminNote: {
        title: 'Admin Strategy Note',
        content: 'Admin Tip: New signups are locked by default. To grant access, navigate to Settings > User Management and toggle the status from "Pending" to "Active". Use the Spacemail SMTP test button to ensure your notification system is online before inviting external users.'
      },
      content: [
        'For New Users:',
        '1. Go to the signup page and fill out the form',
        '2. Username must be alphanumeric (no spaces)',
        '3. Master password must be at least 12 characters',
        '4. Optional: Enter an Invite Code for instant access',
        '5. Without invite code, account is set to "Pending"',
        '6. Wait for admin approval via Spacemail notification',
        '',
        'For Administrators:',
        '1. Check Settings > User Management for pending users',
        '2. Verify user identity before activation',
        '3. Toggle user status from "Pending" to "Active"',
        '4. User will receive activation email via Spacemail',
        '',
        'Invite Code Bypass:',
        'Share your admin invite code (VADER-2026) for instant access.',
        'This skips the approval process for trusted partners.',
      ],
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Help & Documentation</h1>
            <p className="text-sm text-muted-foreground">
              Developer FAQ and workflow guides for MSC-Projectz
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documentation..."
          className="w-full pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card border border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg p-1 bg-card border border-border">
          <button
            onClick={() => setActiveTab('instructionz')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: activeTab === 'instructionz' ? '#4ADE80' : 'transparent',
              color: activeTab === 'instructionz' ? '#121212' : undefined
            }}
          >
            <Shield className="w-4 h-4" />
            Instructionz
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'faq' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Code className="w-4 h-4" />
            Developer FAQ
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'guides' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Workflow className="w-4 h-4" />
            Workflow Guides
          </button>
        </div>
      </div>

      {/* Category Filters (for FAQ and Guides) */}
      {(activeTab === 'faq' || activeTab === 'guides') && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ 
                backgroundColor: activeCategory === cat.id ? '#4ADE80' : undefined,
                color: activeCategory === cat.id ? '#121212' : undefined
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Instructionz Tab */}
      {activeTab === 'instructionz' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
            <p className="text-sm text-primary">
              Essential documentation for Master Password Recovery, SMTP Setup, and Adding New Users.
            </p>
          </div>
          
          {instructionzItems.map((item) => {
            const isExpanded = expandedSections.includes(item.id)
            return (
              <div 
                key={item.id}
                className="rounded-xl overflow-hidden transition-all bg-card border"
                style={{ 
                  borderColor: isExpanded ? '#4ADE80' : undefined,
                  boxShadow: isExpanded ? '0 0 12px rgba(74, 222, 128, 0.15)' : 'none'
                }}
              >
                <button 
                  onClick={() => toggleSection(item.id)}
                  className="flex items-center gap-3 p-4 w-full text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20 text-primary">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm truncate text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronDown 
                    className="w-5 h-5 flex-shrink-0 transition-transform duration-200 text-muted-foreground"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                
                {isExpanded && (
                  <div className="p-4 bg-secondary/50 border-t border-border">
                    {/* SMTP Fields with Copy Buttons */}
                    {item.smtpFields && (
                      <div className="space-y-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-foreground">Incoming Mail (IMAP)</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded bg-card">
                              <span className="text-sm text-muted-foreground">Host: <span className="text-foreground">{item.smtpFields.incoming.host}</span></span>
                              <button 
                                onClick={() => copyToClipboard(item.smtpFields!.incoming.host, 'imap-host')}
                                className="p-1 rounded hover:bg-secondary transition-colors"
                              >
                                {copiedField === 'imap-host' ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-card">
                              <span className="text-sm text-muted-foreground">Port: <span className="text-foreground">{item.smtpFields.incoming.port}</span></span>
                              <button 
                                onClick={() => copyToClipboard(item.smtpFields!.incoming.port, 'imap-port')}
                                className="p-1 rounded hover:bg-secondary transition-colors"
                              >
                                {copiedField === 'imap-port' ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-card">
                              <span className="text-sm text-muted-foreground">Security: <span className="text-foreground">{item.smtpFields.incoming.security}</span></span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2 text-foreground">Outgoing Mail (SMTP)</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 rounded bg-card">
                              <span className="text-sm text-muted-foreground">Host: <span className="text-foreground">{item.smtpFields.outgoing.host}</span></span>
                              <button 
                                onClick={() => copyToClipboard(item.smtpFields!.outgoing.host, 'smtp-host')}
                                className="p-1 rounded hover:bg-secondary transition-colors"
                              >
                                {copiedField === 'smtp-host' ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-card">
                              <span className="text-sm text-muted-foreground">Port: <span className="text-foreground">{item.smtpFields.outgoing.port}</span></span>
                              <button 
                                onClick={() => copyToClipboard(item.smtpFields!.outgoing.port, 'smtp-port')}
                                className="p-1 rounded hover:bg-secondary transition-colors"
                              >
                                {copiedField === 'smtp-port' ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-card">
                              <span className="text-sm text-muted-foreground">Security: <span className="text-foreground">{item.smtpFields.outgoing.security}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Admin Note */}
                    {item.adminNote && (
                      <div className="p-3 rounded-lg mb-4 bg-primary/10 border border-primary/30">
                        <h4 className="text-sm font-medium mb-1 text-primary">{item.adminNote.title}</h4>
                        <p className="text-xs text-foreground">{item.adminNote.content}</p>
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-1.5">
                      {item.content.map((line, index) => (
                        <p 
                          key={index} 
                          className={`text-sm ${line === '' ? 'h-2' : line.startsWith('Note:') || line.startsWith('Invite Code') ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground">No results found</p>
              <p className="text-sm text-muted-foreground">Try a different search term or category</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {filteredFAQs.map((faq) => (
                <AccordionItem 
                  key={faq.id} 
                  value={faq.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-secondary/50 transition-colors [&[data-state=open]]:bg-secondary/50 text-foreground">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20 text-primary">
                        {getCategoryIcon(faq.category)}
                      </div>
                      <span className="font-medium text-sm">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pl-11">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      )}

      {/* Guides Tab */}
      {activeTab === 'guides' && (
        <div className="space-y-4">
          {filteredGuides.length === 0 ? (
            <div className="text-center py-12">
              <Workflow className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground">No guides found</p>
              <p className="text-sm text-muted-foreground">Try a different search term or category</p>
            </div>
          ) : (
            filteredGuides.map((guide) => (
              <div 
                key={guide.id}
                className="rounded-xl overflow-hidden bg-card border border-border"
              >
                <div className="p-4 border-b border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/20 text-primary">
                      {getCategoryIcon(guide.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{guide.title}</h3>
                      <p className="text-sm text-muted-foreground">{guide.description}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-secondary/30">
                  <ol className="space-y-2">
                    {guide.steps.map((step, index) => (
                      <li 
                        key={index}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium bg-primary text-primary-foreground">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 rounded-xl p-4 bg-card border border-border">
        <h3 className="font-semibold mb-4 text-foreground">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2 p-3 rounded-lg transition-colors bg-secondary hover:bg-secondary/80 text-foreground"
          >
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button 
            onClick={() => {}}
            className="flex items-center gap-2 p-3 rounded-lg transition-colors bg-secondary hover:bg-secondary/80 text-foreground"
          >
            <Key className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Credentials</span>
          </button>
          <button 
            onClick={() => setCurrentView('settings')}
            className="flex items-center gap-2 p-3 rounded-lg transition-colors bg-secondary hover:bg-secondary/80 text-foreground"
          >
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">SMTP Setup</span>
          </button>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2 p-3 rounded-lg transition-colors bg-secondary hover:bg-secondary/80 text-foreground"
          >
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Live Projects</span>
          </button>
        </div>
      </div>
    </div>
  )
}
