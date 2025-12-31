import jsPDF from 'jspdf';
import api from '../services/api';

export const generatePDF = async (householdId, applicantId) => {
    try {
        // Fetch all risk analysis data
        const [
            analysisData,
            graphData,
            explanationData,
            criticalMembers,
            recommendations,
            loanEvaluation
        ] = await Promise.all([
            api.getFullAnalysis(householdId).catch(() => null),
            api.getGraphData(householdId).catch(() => null),
            api.getRiskExplanation(householdId).catch(() => null),
            api.getWeakLinks(householdId).catch(() => null),
            api.getRecommendations(householdId).catch(() => null),
            api.getLoanEvaluation(householdId).catch(() => null)
        ]);

        // Create PDF with proper formatting
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Helper function to add new page if needed
        const checkPageBreak = (requiredHeight) => {
            if (yPosition + requiredHeight > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };

        // Helper function to add wrapped text
        const addText = (text, fontSize, isBold = false, color = [33, 37, 41]) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            pdf.setTextColor(...color);
            const lines = pdf.splitTextToSize(text, contentWidth);

            checkPageBreak(lines.length * fontSize * 0.5);

            pdf.text(lines, margin, yPosition);
            yPosition += lines.length * fontSize * 0.5;
        };

        // Header
        pdf.setFillColor(0, 64, 133);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AnchorRisk Financial Analysis System', pageWidth / 2, 15, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text('Household Risk Assessment Report', pageWidth / 2, 25, { align: 'center' });

        yPosition = 45;

        // Report Info
        const generatedDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        pdf.setTextColor(108, 117, 125);
        pdf.setFontSize(10);
        pdf.text(`Household ID: ${householdId}`, margin, yPosition);
        yPosition += 5;
        if (applicantId) {
            pdf.text(`Loan Applicant: ${applicantId}`, margin, yPosition);
            yPosition += 5;
        }
        pdf.text(`Generated: ${generatedDate}`, margin, yPosition);
        yPosition += 15;

        // Separator
        pdf.setDrawColor(222, 226, 230);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // 1. Risk Summary
        if (analysisData) {
            addText('1. RISK ASSESSMENT SUMMARY', 16, true, [0, 64, 133]);
            yPosition += 5;

            const score = analysisData.score ?? analysisData.fragility_score ?? 'N/A';
            const riskBand = analysisData.risk_band || analysisData.riskBand || 'UNKNOWN';

            addText(`Fragility Score: ${typeof score === 'number' ? score.toFixed(3) : score}`, 12, true);
            yPosition += 2;
            addText(`Risk Level: ${riskBand}`, 12, true, riskBand === 'HIGH' ? [220, 38, 38] : riskBand === 'LOW' ? [16, 185, 129] : [245, 158, 11]);
            yPosition += 5;

            if (analysisData.summary) {
                addText(analysisData.summary, 10);
                yPosition += 5;
            }

            yPosition += 5;
        }

        // 2. Household Composition
        if (graphData) {
            checkPageBreak(40);
            addText('2. HOUSEHOLD COMPOSITION', 16, true, [0, 64, 133]);
            yPosition += 5;

            const totalMembers = graphData.nodes?.length || 0;
            const earners = graphData.composition?.earners || 0;
            const dependents = graphData.composition?.dependents || 0;

            addText(`Total Members: ${totalMembers}`, 11);
            addText(`Income Earners: ${earners}`, 11, false, [16, 185, 129]);
            addText(`Dependents: ${dependents}`, 11, false, [245, 158, 11]);
            yPosition += 5;

            // List members
            if (graphData.nodes && graphData.nodes.length > 0) {
                addText('Members:', 11, true);
                yPosition += 2;
                graphData.nodes.forEach(node => {
                    const memberText = `  • ${node.label || node.id} - ${node.role || 'N/A'}${node.is_applicant ? ' [APPLICANT]' : ''}${node.is_critical ? ' [CRITICAL]' : ''}`;
                    addText(memberText, 10);
                });
                yPosition += 5;
            }
        }

        // 3. Risk Explanation
        if (explanationData) {
            checkPageBreak(40);
            addText('3. RISK FACTORS & EXPLANATION', 16, true, [0, 64, 133]);
            yPosition += 5;

            if (explanationData.explanation) {
                addText(explanationData.explanation, 10);
                yPosition += 5;
            }

            if (explanationData.top_factors && explanationData.top_factors.length > 0) {
                addText('Top Risk Factors:', 11, true);
                yPosition += 2;
                explanationData.top_factors.forEach(factor => {
                    const factorName = typeof factor === 'string' ? factor : (factor.feature || factor.factor || 'Unknown');
                    const importance = typeof factor === 'object' && factor.importance ? ` (${(factor.importance * 100).toFixed(1)}%)` : '';
                    addText(`  • ${factorName}${importance}`, 10);
                });
                yPosition += 5;
            }
        }

        // 4. Critical Members
        if (criticalMembers) {
            checkPageBreak(40);
            addText('4. CRITICAL HOUSEHOLD MEMBERS', 16, true, [0, 64, 133]);
            yPosition += 5;

            const members = criticalMembers.critical_members || criticalMembers.weak_links || criticalMembers.members || [];

            if (members.length > 0) {
                addText('Members identified as critical to household stability:', 10);
                yPosition += 3;
                members.forEach(member => {
                    const memberId = typeof member === 'string' ? member : (member.id || member.name);
                    const role = typeof member === 'object' ? (member.role || 'N/A') : 'N/A';
                    const impact = typeof member === 'object' ? (member.impact || 'High') : 'High';
                    addText(`  • ${memberId} - ${role} (Impact: ${impact})`, 10);
                });
                yPosition += 5;
            } else {
                addText('✓ No critical members detected. Household has balanced dependency distribution.', 10, false, [16, 185, 129]);
                yPosition += 5;
            }

            if (criticalMembers.reason) {
                addText(criticalMembers.reason, 10);
                yPosition += 5;
            }
        }

        // 5. Recommendations
        if (recommendations) {
            checkPageBreak(40);
            addText('5. RISK MITIGATION RECOMMENDATIONS', 16, true, [0, 64, 133]);
            yPosition += 5;

            const recs = recommendations.recommendations || [];
            if (recs.length > 0) {
                recs.forEach((rec, index) => {
                    checkPageBreak(20);
                    addText(`${index + 1}. ${rec.recommendation || rec}`, 10, true);
                    yPosition += 2;
                    if (rec.rationale) {
                        addText(`   ${rec.rationale}`, 9);
                        yPosition += 3;
                    }
                });
            } else if (recommendations.message) {
                addText(recommendations.message, 10);
                yPosition += 5;
            }
        }

        // 6. Loan Evaluation
        if (loanEvaluation && applicantId) {
            checkPageBreak(40);
            addText('6. LOAN EVALUATION & SAFEGUARDS', 16, true, [0, 64, 133]);
            yPosition += 5;

            if (loanEvaluation.applicant_risk) {
                addText(`Applicant Risk Level: ${loanEvaluation.applicant_risk}`, 11, true);
                yPosition += 3;
            }

            if (loanEvaluation.recommendation) {
                addText('Recommendation:', 11, true);
                addText(loanEvaluation.recommendation, 10);
                yPosition += 5;
            }

            if (loanEvaluation.safeguards && loanEvaluation.safeguards.length > 0) {
                addText('Recommended Safeguards:', 11, true);
                yPosition += 2;
                loanEvaluation.safeguards.forEach(safeguard => {
                    addText(`  • ${safeguard}`, 10);
                });
                yPosition += 5;
            }

            if (loanEvaluation.explanation) {
                addText('Detailed Explanation:', 11, true);
                addText(loanEvaluation.explanation, 10);
                yPosition += 5;
            }
        }

        // Footer on last page
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(108, 117, 125);
            pdf.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );

            if (i === totalPages) {
                pdf.setDrawColor(222, 226, 230);
                pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
                pdf.setFontSize(9);
                pdf.text(
                    'This document is confidential and intended for authorized personnel only.',
                    pageWidth / 2,
                    pageHeight - 15,
                    { align: 'center' }
                );
                pdf.text(
                    `AnchorRisk © ${new Date().getFullYear()} | Bank-Grade Security | 256-bit Encryption`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        }

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `AnchorRisk_${householdId}_${timestamp}.pdf`;

        // Save PDF
        pdf.save(filename);

        return { success: true, filename };
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error('Failed to generate PDF: ' + error.message);
    }
};
