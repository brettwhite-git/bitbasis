"use client"

import React from 'react';
// Card components not used in this component
import { Button } from "@/components/ui/button";
import { DownloadCloud, ExternalLink, FileText, BookOpen } from 'lucide-react';

export function ResourcesSettings() {
    // TODO: Replace with actual links and content
    const templateLink = "/templates/bitbasis_template.csv"; // Example link
    const formattingGuideLink = "/docs/csv-formatting"; // Example link
    const exchangeGuideLink = "/docs/exchange-guides"; // Example link
    const faqLink = "/docs/faq"; // Example link
    const tutorialLink = "/docs/tutorials"; // Example link

    return (
        <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
                <div className="relative z-10 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">CSV Templates</h3>
                        <p className="text-gray-400 text-sm">
                            Download standardized templates for importing your transaction data.
                        </p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Our templates ensure your data is correctly formatted for seamless importing into BitBasis.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                            <a href={templateLink} download>
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                Standard Template (.csv)
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                            <a href={templateLink.replace(".csv", "_with_examples.csv")} download>
                                <FileText className="mr-2 h-4 w-4" />
                                Template with Examples (.csv)
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
                <div className="relative z-10 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Import Guides</h3>
                        <p className="text-gray-400 text-sm">
                            Documentation for preparing and importing your transaction data.
                        </p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Learn how to format your data correctly and import from various exchanges.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                            <a href={formattingGuideLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                CSV Formatting Guide
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                            <a href={exchangeGuideLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Exchange-Specific Guides
                            </a>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
                <div className="relative z-10 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Help & Support</h3>
                        <p className="text-gray-400 text-sm">
                            Additional resources to help you get the most out of BitBasis.
                        </p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Find answers to common questions and learn how to use BitBasis effectively.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                            <a href={faqLink} target="_blank" rel="noopener noreferrer">
                                <BookOpen className="mr-2 h-4 w-4" />
                                FAQ & Knowledge Base
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                            <a href={tutorialLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Video Tutorials
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 