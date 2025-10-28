'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'

interface BlogContentContextProps {
    onContentSelect?: (content: string) => void
}

interface BlogContentItem {
    slug: string
    title: string
    content: string
}

export function BlogContentContext({ onContentSelect }: BlogContentContextProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [blogContents, setBlogContents] = useState<BlogContentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

    useEffect(() => {
        // Parse the blog content from the Altiora project
        const fetchBlogContent = async () => {
            try {
                // Since we can't directly import from the other project, we'll simulate the content
                // In a real implementation, you might fetch this from an API or shared service
                const mockBlogContents: BlogContentItem[] = [
                    {
                        slug: 'gemini-nano-banana',
                        title: 'Gemini Nano Banana - AI Image Generation',
                        content: `<p class="lead">Every so often, a playful idea breaks through the noise and reveals what a new technology can do. "Nano Banana" is that moment for Gemini's image model—a quirky name paired with a genuinely powerful update to visual generation and editing using natural language.</p>`
                    },
                    {
                        slug: 'mobile-app-trends-2025',
                        title: 'Top Mobile App Development Trends to Watch in 2025',
                        content: `<h1>Top Mobile App Development Trends to Watch in 2025</h1><p>Mobile is maturing fast, powered by AI, private on-device compute, and instant, lightweight experiences. Here are the trends shaping 2025 roadmaps.</p>`
                    },
                    {
                        slug: 'ai-ml-2030-everyday-things',
                        title: '5 Everyday Things You\'re Doing Now That AI Will Do Better by 2030',
                        content: `<h1>5 Everyday Things You're Doing Now That AI Will Do Better by 2030</h1><h2>1) Your Morning Briefing</h2><p>Personalized digests synthesize news, calendar, and priorities—then suggest actions, not just info.</p>`
                    },
                    {
                        slug: 'future-of-digital-success-website-that-works',
                        title: 'The Future of Digital Success: Build a Website That Works for You',
                        content: `<h1>The Future of Digital Success: Build a Website That Works for You</h1><h2>Start with Strategy</h2><p>Define ICP, jobs-to-be-done, offers, and the conversion model before pixels.</p>`
                    },
                    {
                        slug: 'hyperautomation-ai-ml',
                        title: 'Hyperautomation with AI & ML: The Future of Business Efficiency',
                        content: `<h1>Hyperautomation with AI & ML: The Future of Business Efficiency</h1><h2>What Is Hyperautomation?</h2><p>An end-to-end approach that combines RPA, AI/ML, process mining, and low-code to automate across systems and teams.</p>`
                    },
                    {
                        slug: 'ux-ui-for-ai-apps',
                        title: 'Designing UX/UI for AI-Centric Applications',
                        content: `<h1>Designing UX/UI for AI-Centric Applications</h1><h2>Why It's Different</h2><p>AI is probabilistic, adaptive, and context-aware—your UI must communicate uncertainty and offer control.</p>`
                    },
                    {
                        slug: 'ai-workflows-small-enterprises',
                        title: 'How AI-Powered Workflows Automation Can Automate Business Processes for Small Enterprises',
                        content: `<h1>How AI-Powered Workflows Automation Can Automate Business Processes for Small Enterprises</h1><p><em>28 Jun 2025</em></p><h2>Introduction</h2><p>The day-to-day running of business affairs may often be overwhelming for small enterprises.</p>`
                    },
                    {
                        slug: 'best-ai-ml-agency-chandigarh',
                        title: 'Why Altiora Infotech Is the Best AI/ML Agency in Chandigarh',
                        content: `<h1>Why Altiora Infotech Is the Best AI/ML Agency in Chandigarh</h1><p><em>10 May 2024</em></p><p>There is much more to digital growth than ads or social pushes—it's about forging connections, amplifying visibility, and compounding measurable results.</p>`
                    }
                ]

                setBlogContents(mockBlogContents)
            } catch (error) {
                console.error('Failed to load blog content:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBlogContent()
    }, [])

    const handleCopyContent = async (content: string, slug: string) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedSlug(slug)
            setTimeout(() => setCopiedSlug(null), 2000)
        } catch (error) {
            console.error('Failed to copy content:', error)
        }
    }

    const handleUseContent = (content: string) => {
        if (onContentSelect) {
            onContentSelect(content)
        }
    }

    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').trim()
    }

    const truncateText = (text: string, maxLength: number = 150) => {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength) + '...'
    }

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h3 className="text-lg font-semibold text-white">Blog Content Library</h3>
                    <p className="text-sm text-gray-400">
                        Reference content from Altiora blog posts ({blogContents.length} items)
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    icon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                />
            </div>

            {isExpanded && (
                <div className="border-t border-gray-700 p-4">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-400 mt-2">Loading blog content...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {blogContents.map((item) => (
                                <div key={item.slug} className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-white text-sm">{item.title}</h4>
                                        <div className="flex space-x-1 ml-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyContent(item.content, item.slug)}
                                                icon={copiedSlug === item.slug ? <Check size={12} /> : <Copy size={12} />}
                                                className="text-xs"
                                            >
                                                {copiedSlug === item.slug ? 'Copied' : 'Copy'}
                                            </Button>
                                            {onContentSelect && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleUseContent(item.content)}
                                                    className="text-xs"
                                                >
                                                    Use
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mb-2">Slug: {item.slug}</p>

                                    <div className="text-sm text-gray-300">
                                        {truncateText(stripHtml(item.content))}
                                    </div>

                                    <details className="mt-2">
                                        <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                                            View HTML content
                                        </summary>
                                        <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded overflow-x-auto">
                                            {item.content}
                                        </pre>
                                    </details>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-blue-300">
                            <strong>Source:</strong> /Users/dragoax/yash/altiora/Altiora/src/data/blogContent.ts
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            This content is sourced from the Altiora project&apos;s blog content file. Use it as reference or copy sections for your new blog posts.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}