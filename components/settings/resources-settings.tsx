"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            <Card className="rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg">CSV Templates</CardTitle>
                    <CardDescription>
                        Download standardized templates for importing your transaction data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Our templates ensure your data is correctly formatted for seamless importing into BitBasis.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild variant="outline">
                            <a href={templateLink} download>
                                <DownloadCloud className="mr-2 h-4 w-4" />
                                Standard Template (.csv)
                            </a>
                        </Button>
                        <Button asChild variant="outline">
                            <a href={templateLink.replace(".csv", "_with_examples.csv")} download>
                                <FileText className="mr-2 h-4 w-4" />
                                Template with Examples (.csv)
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Import Guides</CardTitle>
                    <CardDescription>
                        Documentation for preparing and importing your transaction data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Learn how to format your data correctly and import from various exchanges.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild variant="outline">
                            <a href={formattingGuideLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                CSV Formatting Guide
                            </a>
                        </Button>
                        <Button asChild variant="outline">
                            <a href={exchangeGuideLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Exchange-Specific Guides
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Help & Support</CardTitle>
                    <CardDescription>
                        Additional resources to help you get the most out of BitBasis.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Find answers to common questions and learn how to use BitBasis effectively.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild variant="outline">
                            <a href={faqLink} target="_blank" rel="noopener noreferrer">
                                <BookOpen className="mr-2 h-4 w-4" />
                                FAQ & Knowledge Base
                            </a>
                        </Button>
                        <Button asChild variant="outline">
                            <a href={tutorialLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Video Tutorials
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 