"use client"

import React from 'react';
// Card components not used in this component
import { Button } from "@/components/ui/button";
import { DownloadCloud, FileText } from 'lucide-react';

export function ResourcesSettings() {
    const templates = {
        standard: "/templates/bitbasis_template.csv",
        withExamples: "/templates/bitbasis_template_with_examples.csv",
        comprehensive: "/templates/bitbasis_comprehensive_template.csv",
        comprehensiveWithExamples: "/templates/bitbasis_comprehensive_with_examples.csv"
    };

    return (
        <div className="grid gap-6">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
                <div className="relative z-10 space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">CSV Templates</h3>
                        <p className="text-gray-400 text-sm">
                            Download standardized templates for importing your Bitcoin transaction data.
                        </p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Choose the template that best fits your needs. All templates are optimized for seamless importing into BitBasis.
                    </p>
                    
                    {/* Standard Templates */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white">Standard Templates</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                                <a href={templates.standard} download>
                                    <DownloadCloud className="mr-2 h-4 w-4" />
                                    Basic Template
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                                <a href={templates.withExamples} download>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Basic with Examples
                                </a>
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Includes essential fields: Date, Type, Amounts, Currencies, Fees, From/To, Price, Comment
                        </p>
                    </div>

                    {/* Comprehensive Templates */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-white">Comprehensive Templates</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                                <a href={templates.comprehensive} download>
                                    <DownloadCloud className="mr-2 h-4 w-4" />
                                    Full Template
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="border-gray-600/50 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                                <a href={templates.comprehensiveWithExamples} download>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Full with Examples
                                </a>
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Includes all fields: Addresses, Transaction Hashes, and detailed metadata for advanced users
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 