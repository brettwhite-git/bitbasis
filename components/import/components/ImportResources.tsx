"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadCloud, ExternalLink } from 'lucide-react';

export function ImportResources() {
    // TODO: Replace with actual links and content
    const templateLink = "/templates/bitbasis_template.csv"; // Example link
    const formattingGuideLink = "/docs/csv-formatting"; // Example link
    const exchangeGuideLink = "/docs/exchange-guides"; // Example link

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Download Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Download our standard CSV template to ensure correct formatting for your transaction uploads.
                    </p>
                    <Button asChild variant="outline">
                        <a href={templateLink} download>
                            <DownloadCloud className="mr-2 h-4 w-4" />
                            Download Standard Template (.csv)
                        </a>
                    </Button>
                    {/* Add links for specific exchange templates if available */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Formatting & Guides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Refer to our guides for details on required columns, date formats, and handling different transaction types.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild variant="secondary">
                            <a href={formattingGuideLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                CSV Formatting Guide
                            </a>
                        </Button>
                        <Button asChild variant="secondary">
                             <a href={exchangeGuideLink} target="_blank" rel="noopener noreferrer">
                                 <ExternalLink className="mr-2 h-4 w-4" />
                                 Exchange-Specific Guides
                             </a>
                         </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 