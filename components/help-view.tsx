'use client'

import { useState } from 'react'
import {
  Search,
  Workflow,
  HelpCircle,
  FolderOpen,
  Key,
  Server,
  Zap,
  Lock,
  Mail,
  Users,
  Copy,
  Check,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

const msc_engineFloatMain =
  'rounded-2xl border border-border/60 bg-card/70 p-6 shadow-[0_18px_48px_-16px_rgba(0,0,0,0.42)] backdrop-blur-md dark:border-white/[0.07] dark:bg-zinc-950/50 dark:shadow-black/55'

const msc_engineFloatAside =
  'rounded-2xl border border-border/60 bg-card/70 p-4 shadow-[0_18px_48px_-16px_rgba(0,0,0,0.42)] backdrop-blur-md dark:border-white/[0.07] dark:bg-zinc-950/45 dark:shadow-black/50'

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
    answer:
      'Click the "+ Add Project" button in the sidebar or on the dashboard. Follow the 4-step wizard to set up your project: Identity (name & thumbnail), Connectivity (local path & URL), Credentials (vault entries), and Status (local vs live).',
    category: 'getting-started',
  },
  {
    id: 'faq-2',
    question: 'Where are my credentials stored?',
    answer:
      'All credentials are stored locally in your browser using encrypted localStorage. Your data never leaves your machine. The master password encrypts access to the vault.',
    category: 'security',
  },
  {
    id: 'faq-3',
    question: 'How do I open a project folder?',
    answer:
      'Click on a project card and hover over it to reveal quick actions. Click "Explorer" to open the project folder through the native desktop bridge.',
    category: 'workflow',
  },
  {
    id: 'faq-4',
    question: 'Can I change my master password?',
    answer:
      'Yes! Go to Settings > Profile and use the "Change Master Password" section. You will need to enter your current password to confirm the change.',
    category: 'security',
  },
  {
    id: 'faq-5',
    question: 'What is the difference between Local and Live status?',
    answer:
      'Local status indicates a project is in development on your machine. Live status means the project has been deployed and has a public URL. This helps you track deployment status.',
    category: 'workflow',
  },
  {
    id: 'faq-6',
    question: 'How do I configure Spacemail SMTP for email notifications?',
    answer:
      'Go to Settings > Spacemail SMTP Configuration. For incoming mail (IMAP), use mail.spacemail.com on port 993 with SSL/TLS. For outgoing mail (SMTP), use mail.spacemail.com on port 465 with SSL/TLS. Enter your Spacemail username and password.',
    category: 'settings',
  },
  {
    id: 'faq-7',
    question: 'Can I export my project data?',
    answer:
      'Project records and Code Vault snippets live in Payload/SQLite and are scoped to vault projects. Open a project on the Dashboard, use Task Pulse, and choose the Code Vault segment to add or publish snippets. Legacy browser-only snippets from the old Code Manager screen can be imported from there when this browser still has them. Other helper UI (such as project-card credential popovers) may still use small user-scoped localStorage keys.',
    category: 'data',
  },
  {
    id: 'faq-8',
    question: 'What happens if I forget my master password?',
    answer:
      'Use the "Forgot Password?" link on the login page to receive a password recovery link via email. This requires Spacemail SMTP to be configured. If SMTP is not set up, you will need to clear localStorage and start fresh.',
    category: 'security',
  },
  {
    id: 'faq-9',
    question: 'How do I upload a profile avatar?',
    answer:
      'Go to My Profile and click "Choose File" below your current avatar. The image uploads to Payload media, then Save Profile stores that media ID on your user record.',
    category: 'settings',
  },
  {
    id: 'faq-10',
    question: 'How can I add new users to MSC-Projectz?',
    answer:
      'New user creation requires Admin Approval. Contact your system administrator to request a new account. The admin will create the account and provide login credentials via secure channel.',
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
    id: 'guide-8',
    title: 'Code Vault (project snippets)',
    description: 'Store reusable code and notes in the server-backed Code Vault for each project.',
    category: 'workflow',
    steps: [
      'From the Dashboard, select the project you want',
      'Open Task Pulse on the right',
      'Switch to the Code Vault segment',
      'Add drafts, then project owners can publish snippets to the shared library',
      'If you previously used the old browser-only Code Manager, use Import when offered to move snippets into this project',
    ],
  },
  {
    id: 'guide-7',
    title: 'Editing Project Details',
    description: 'Update project information, thumbnails, and connectivity settings.',
    category: 'workflow',
    steps: [
      'Locate the project card you want to edit',
      'Click the visible Settings icon (gear) in the project card header',
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
]

export function HelpView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'instructionz'>('instructionz')
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)

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
      case 'getting-started':
        return <Zap className="w-3.5 h-3.5" />
      case 'workflow':
        return <Workflow className="w-3.5 h-3.5" />
      case 'security':
        return <Key className="w-3.5 h-3.5" />
      case 'settings':
        return <Server className="w-3.5 h-3.5" />
      case 'admin':
        return <Users className="w-3.5 h-3.5" />
      case 'data':
        return <FolderOpen className="w-3.5 h-3.5" />
      default:
        return <HelpCircle className="w-3.5 h-3.5" />
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
          security: 'SSL/TLS',
        },
        outgoing: {
          host: 'mail.spacemail.com',
          port: '465',
          security: 'SSL/TLS',
        },
      },
      content: ['Click "Send Test Email" in Settings to verify your configuration.'],
    },
    {
      id: 'inst-3',
      title: 'Adding New Users (Admin Approval)',
      icon: <Users className="w-5 h-5" />,
      description: 'Process for requesting and approving new user accounts',
      adminNote: {
        title: 'Admin Strategy Note',
        content:
          'Admin Tip: New signups are locked by default. To grant access, navigate to Settings > User Management and toggle the status from "Pending" to "Active". Use the Spacemail SMTP test button to ensure your notification system is online before inviting external users.',
      },
      content: [
        'For New Users:',
        '1. Open /auth/register (Create account from the login screen) and submit name, email, and password',
        '2. Passwords must be at least 8 characters and include an uppercase letter, a number, and a special character',
        '3. The server creates a real Payload user; an admin may still need to grant project access in Settings',
        '4. After approval, sign in from the lock screen with the same email and password',
        '',
        'For Administrators:',
        '1. Check Settings > User Management for new server users',
        '2. Verify user identity before granting roles or project access',
        '3. Use the Spacemail SMTP test if email notifications are part of your workflow',
      ],
    },
  ]

  return (
    <div className="min-h-[calc(100vh-8rem)] min-w-0 px-5 py-4 pb-12 sm:px-8 md:px-12 lg:pl-14 lg:pr-12">
      <div className="mx-auto w-full max-w-3xl xl:max-w-[50rem] 2xl:max-w-[52rem]">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">MSC Engine</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Engine Instructionz</h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            Complete documentation for the MSC Media Pro engine, setup guides, and troubleshooting.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_12.5rem] xl:items-start xl:gap-10">
          <main className="min-w-0 space-y-6">
            <section className={msc_engineFloatMain}>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-foreground">
                  {activeTab === 'instructionz'
                    ? 'Setup Workflow'
                    : activeTab === 'faq'
                      ? 'Developer FAQ'
                      : 'Workflow Guides'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activeTab === 'instructionz'
                    ? 'Follow these steps to get your studio site fully operational.'
                    : 'Search and filter the current documentation set.'}
                </p>
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
              <div className="sr-only" aria-live="polite">
                Active section: {activeTab}
              </div>

              {/* Category Filters (for FAQ and Guides) */}
              {(activeTab === 'faq' || activeTab === 'guides') && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        activeCategory === cat.id
                          ? 'border-msc-ui-accent/35 bg-msc-ui-accent/15 text-msc-ui-accent shadow-sm'
                          : 'border-transparent bg-muted/25 text-muted-foreground hover:border-border/50 hover:bg-muted/40 hover:text-foreground',
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Instructionz Tab */}
              {activeTab === 'instructionz' && (
                <div className="space-y-4">
                  <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections}>
                    {instructionzItems.map((item) => (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm transition-all data-[state=open]:shadow-md dark:border-white/[0.07] dark:bg-white/[0.04] dark:data-[state=open]:bg-white/[0.06]"
                      >
                        <AccordionTrigger className="px-4 py-4 text-foreground no-underline hover:bg-muted/20 hover:no-underline data-[state=open]:bg-muted/15 dark:hover:bg-white/[0.04] dark:data-[state=open]:bg-white/[0.04]">
                          <div className="flex min-w-0 items-center gap-3 text-left">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-msc-ui-accent/15 text-msc-ui-accent">
                              {item.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-foreground">{item.title}</h3>
                              <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="border-t border-border/50 bg-muted/10 p-4 transition-all dark:border-white/[0.06] dark:bg-black/15">
                          {/* SMTP Fields with Copy Buttons */}
                          {item.smtpFields && (
                            <div className="space-y-4 mb-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2 text-foreground">Incoming Mail (IMAP)</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2 rounded bg-card">
                                    <span className="text-sm text-muted-foreground">
                                      Host: <span className="text-foreground">{item.smtpFields.incoming.host}</span>
                                    </span>
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
                                    <span className="text-sm text-muted-foreground">
                                      Port: <span className="text-foreground">{item.smtpFields.incoming.port}</span>
                                    </span>
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
                                    <span className="text-sm text-muted-foreground">
                                      Security:{' '}
                                      <span className="text-foreground">{item.smtpFields.incoming.security}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2 text-foreground">Outgoing Mail (SMTP)</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2 rounded bg-card">
                                    <span className="text-sm text-muted-foreground">
                                      Host: <span className="text-foreground">{item.smtpFields.outgoing.host}</span>
                                    </span>
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
                                    <span className="text-sm text-muted-foreground">
                                      Port: <span className="text-foreground">{item.smtpFields.outgoing.port}</span>
                                    </span>
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
                                    <span className="text-sm text-muted-foreground">
                                      Security:{' '}
                                      <span className="text-foreground">{item.smtpFields.outgoing.security}</span>
                                    </span>
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
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
                          className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.04]"
                        >
                          <AccordionTrigger className="px-4 py-3 text-foreground transition-colors hover:bg-muted/20 data-[state=open]:bg-muted/15 dark:hover:bg-white/[0.04] dark:data-[state=open]:bg-white/[0.04]">
                            <div className="flex items-center gap-3 text-left">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-msc-ui-accent/15 text-msc-ui-accent">
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
                    <Accordion type="single" collapsible>
                      {filteredGuides.map((guide) => (
                        <AccordionItem
                          key={guide.id}
                          value={guide.id}
                          className="overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-sm transition-all dark:border-white/[0.07] dark:bg-white/[0.04]"
                        >
                          <AccordionTrigger className="px-4 py-4 text-foreground no-underline hover:bg-muted/20 hover:no-underline data-[state=open]:bg-muted/15 dark:hover:bg-white/[0.04] dark:data-[state=open]:bg-white/[0.04]">
                            <div className="flex min-w-0 items-start gap-3 text-left">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-msc-ui-accent/15 text-msc-ui-accent">
                                {getCategoryIcon(guide.category)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-foreground">{guide.title}</h3>
                                <p className="text-sm text-muted-foreground">{guide.description}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="border-t border-border/50 bg-muted/10 p-4 transition-all dark:border-white/[0.06] dark:bg-black/15">
                            <ol className="space-y-2">
                              {guide.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-msc-ui-accent/90 text-xs font-medium text-white shadow-sm">
                                    {index + 1}
                                  </span>
                                  <span className="pt-0.5 text-muted-foreground">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              )}
            </section>
          </main>

          <aside className={cn(msc_engineFloatAside, 'h-fit xl:sticky xl:top-24')}>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Quick Navigation</h3>
            <div className="mt-4 space-y-1">
              {[
                { id: 'instructionz' as const, label: 'Setup Workflow' },
                { id: 'faq' as const, label: 'How it Works' },
                { id: 'guides' as const, label: 'Troubleshooting' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'block w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors',
                    activeTab === item.id
                      ? 'border-msc-ui-accent/30 bg-msc-ui-accent/15 font-medium text-msc-ui-accent'
                      : 'text-muted-foreground hover:border-border/40 hover:bg-muted/25 hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
