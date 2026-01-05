import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

/**
 * Capture a screenshot of a DOM element and return as base64 image
 */
const captureScreenshot = async (elementId) => {
    try {
        const element = document.getElementById(elementId);
        if (!element) return null;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
        });
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error(`Failed to capture screenshot of ${elementId}:`, error);
        return null;
    }
};

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

        // Capture screenshots of visible dashboard components
        const screenshots = {
            graph: await captureScreenshot('graph-visualization'),
            riskScore: await captureScreenshot('risk-score-display'),
            members: await captureScreenshot('members-table'),
            simulation: await captureScreenshot('simulation-results'),
        };

        // Create PDF with proper formatting
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Helper function to add new page if needed
        const checkPageBreak = (requiredHeight) => {
            if (yPosition + requiredHeight > pageHeight - margin - 15) {
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
            checkPageBreak(lines.length * fontSize * 0.4);
            pdf.text(lines, margin, yPosition);
            yPosition += lines.length * fontSize * 0.4;
        };

        // Helper function for section headers
        const addSection = (number, title) => {
            checkPageBreak(15);
            pdf.setFillColor(0, 64, 133);
            pdf.rect(margin, yPosition - 4, contentWidth, 8, 'F');
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${number}. ${title}`, margin + 2, yPosition + 1);
            yPosition += 10;
        };

        // Helper function to add a screenshot image
        const addScreenshot = (imageData, maxHeight = 80) => {
            if (!imageData) return false;

            try {
                // Get image dimensions
                const img = new Image();
                img.src = imageData;

                // Calculate dimensions to fit content width
                const imgWidth = contentWidth;
                const aspectRatio = img.height / img.width;
                let imgHeight = imgWidth * aspectRatio;

                // Limit max height
                if (imgHeight > maxHeight) {
                    imgHeight = maxHeight;
                }

                checkPageBreak(imgHeight + 10);

                // Add border
                pdf.setDrawColor(222, 226, 230);
                pdf.setLineWidth(0.5);
                pdf.roundedRect(margin, yPosition - 2, imgWidth, imgHeight + 4, 2, 2, 'S');

                // Add image
                pdf.addImage(imageData, 'PNG', margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 8;

                return true;
            } catch (error) {
                console.error('Failed to add screenshot to PDF:', error);
                return false;
            }
        };

        // Helper function for drawing the graph
        const drawGraph = (nodes, edges) => {
            const graphHeight = 70;
            const graphWidth = contentWidth;
            const centerX = margin + graphWidth / 2;
            const centerY = yPosition + graphHeight / 2;
            const radius = 28;

            checkPageBreak(graphHeight + 20);

            // Draw background
            pdf.setFillColor(250, 250, 250);
            pdf.roundedRect(margin, yPosition - 5, graphWidth, graphHeight + 10, 3, 3, 'F');
            pdf.setDrawColor(222, 226, 230);
            pdf.roundedRect(margin, yPosition - 5, graphWidth, graphHeight + 10, 3, 3, 'S');

            // Draw edges first
            nodes.forEach((node, idx) => {
                const angle = (2 * Math.PI * idx) / nodes.length - Math.PI / 2;
                const nodeX = centerX + radius * Math.cos(angle);
                const nodeY = centerY + radius * Math.sin(angle);

                edges.filter(e => e.source === node.id).forEach(edge => {
                    const targetIdx = nodes.findIndex(n => n.id === edge.target);
                    if (targetIdx !== -1) {
                        const targetAngle = (2 * Math.PI * targetIdx) / nodes.length - Math.PI / 2;
                        const targetX = centerX + radius * Math.cos(targetAngle);
                        const targetY = centerY + radius * Math.sin(targetAngle);

                        const strength = edge.strength || 0.5;
                        if (strength > 0.7) pdf.setDrawColor(16, 185, 129);
                        else if (strength > 0.4) pdf.setDrawColor(99, 102, 241);
                        else pdf.setDrawColor(245, 158, 11);

                        pdf.setLineWidth(0.3 + strength * 0.3);
                        pdf.line(nodeX, nodeY, targetX, targetY);
                    }
                });
            });

            // Draw nodes
            nodes.forEach((node, idx) => {
                const angle = (2 * Math.PI * idx) / nodes.length - Math.PI / 2;
                const nodeX = centerX + radius * Math.cos(angle);
                const nodeY = centerY + radius * Math.sin(angle);
                const nodeRadius = node.is_applicant ? 7 : node.is_critical ? 6 : 5;

                // Node fill
                if (node.role === 'earner') pdf.setFillColor(16, 185, 129);
                else pdf.setFillColor(245, 158, 11);
                pdf.circle(nodeX, nodeY, nodeRadius, 'F');

                // Node border
                if (node.is_applicant) {
                    pdf.setDrawColor(0, 64, 133);
                    pdf.setLineWidth(0.8);
                } else if (node.is_critical) {
                    pdf.setDrawColor(220, 38, 38);
                    pdf.setLineWidth(0.6);
                } else {
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.3);
                }
                pdf.circle(nodeX, nodeY, nodeRadius, 'S');

                // Node label
                pdf.setFontSize(6);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(60, 60, 60);
                const labelY = nodeY + nodeRadius + 4;
                pdf.text(node.label || node.id, nodeX, labelY, { align: 'center' });
            });

            // Legend
            const legendY = yPosition + graphHeight + 2;
            pdf.setFontSize(6);
            pdf.setTextColor(100, 100, 100);

            pdf.setFillColor(16, 185, 129);
            pdf.circle(margin + 5, legendY, 2, 'F');
            pdf.text('Earner', margin + 9, legendY + 1);

            pdf.setFillColor(245, 158, 11);
            pdf.circle(margin + 30, legendY, 2, 'F');
            pdf.text('Dependent', margin + 34, legendY + 1);

            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(0, 64, 133);
            pdf.setLineWidth(0.5);
            pdf.circle(margin + 60, legendY, 2, 'S');
            pdf.text('Applicant', margin + 64, legendY + 1);

            pdf.setDrawColor(220, 38, 38);
            pdf.circle(margin + 88, legendY, 2, 'S');
            pdf.text('Critical', margin + 92, legendY + 1);

            yPosition += graphHeight + 12;
        };

        // ==================== HEADER ====================
        pdf.setFillColor(0, 64, 133);
        pdf.rect(0, 0, pageWidth, 28, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AnchorRisk - Household Risk Assessment', pageWidth / 2, 12, { align: 'center' });
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const reportInfo = `Household: ${householdId}${applicantId ? ` | Applicant: ${applicantId}` : ''} | ${new Date().toLocaleDateString()}`;
        pdf.text(reportInfo, pageWidth / 2, 20, { align: 'center' });

        yPosition = 35;

        // ==================== EXECUTIVE SUMMARY ====================
        addSection('1', 'EXECUTIVE SUMMARY');

        if (analysisData) {
            const score = analysisData.score ?? analysisData.fragility_score ?? 'N/A';
            const riskBand = analysisData.risk_band || analysisData.riskBand || 'UNKNOWN';
            const riskColor = riskBand === 'HIGH' ? [220, 38, 38] : riskBand === 'LOW' ? [16, 185, 129] : [245, 158, 11];

            // Risk score box
            pdf.setFillColor(248, 249, 250);
            pdf.roundedRect(margin, yPosition - 2, contentWidth, 14, 2, 2, 'F');

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(33, 37, 41);
            pdf.text(`Fragility Score: ${typeof score === 'number' ? score.toFixed(3) : score}`, margin + 3, yPosition + 4);

            pdf.setTextColor(...riskColor);
            pdf.text(`Risk Level: ${riskBand}`, margin + 90, yPosition + 4);

            yPosition += 16;
        }
        yPosition += 3;

        // ==================== HOUSEHOLD GRAPH ====================
        if (graphData?.nodes?.length > 0) {
            addSection('2', 'HOUSEHOLD DEPENDENCY NETWORK');

            // Quick stats inline
            const earners = graphData.composition?.earners || 0;
            const dependents = graphData.composition?.dependents || 0;
            const total = graphData.nodes.length;

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text(`Members: ${total} (${earners} earners, ${dependents} dependents) | Connections: ${graphData.edges?.length || 0}`, margin, yPosition);
            yPosition += 6;

            // Try to use screenshot first, fallback to drawing
            if (screenshots.graph) {
                addScreenshot(screenshots.graph, 90);
            } else {
                drawGraph(graphData.nodes, graphData.edges || []);
            }
        }

        // ==================== CRITICAL MEMBERS (Brief) ====================
        if (criticalMembers) {
            const members = criticalMembers.critical_members || criticalMembers.weak_links || criticalMembers.members || [];
            addSection('3', 'CRITICAL MEMBERS');

            if (members.length > 0) {
                members.slice(0, 5).forEach(member => {
                    const id = typeof member === 'string' ? member : (member.id || member.name);
                    const role = typeof member === 'object' ? (member.role || '-') : '-';
                    const impact = typeof member === 'object' ? (member.impact || 'High') : 'High';
                    pdf.setFontSize(9);
                    pdf.setTextColor(33, 37, 41);
                    pdf.text(`• ${id} (${role}) - Impact: ${impact}`, margin + 2, yPosition);
                    yPosition += 4;
                });
                if (members.length > 5) {
                    pdf.setFontSize(8);
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(`... and ${members.length - 5} more`, margin + 2, yPosition);
                    yPosition += 4;
                }
            } else {
                pdf.setFontSize(9);
                pdf.setTextColor(16, 185, 129);
                pdf.text('✓ No critical members detected', margin + 2, yPosition);
                yPosition += 4;
            }
            yPosition += 3;
        }

        // ==================== BANK LOAN DETAILS (Enhanced) ====================
        if (loanEvaluation || applicantId) {
            addSection('4', 'BANK LOAN ASSESSMENT');

            // Create a detailed loan assessment table
            const tableStartY = yPosition;
            const colWidth = contentWidth / 2;
            const rowHeight = 8;

            // Table header
            pdf.setFillColor(0, 64, 133);
            pdf.rect(margin, tableStartY, contentWidth, rowHeight, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text('Parameter', margin + 3, tableStartY + 5);
            pdf.text('Assessment', margin + colWidth + 3, tableStartY + 5);

            yPosition = tableStartY + rowHeight;

            // Table rows
            const loanDetails = [
                ['Applicant ID', applicantId || 'N/A'],
                ['Risk Classification', loanEvaluation?.applicant_risk || (analysisData?.risk_band || 'PENDING')],
                ['Loan Eligibility', loanEvaluation?.eligible !== false ? 'ELIGIBLE' : 'NOT ELIGIBLE'],
                ['Recommended Loan Amount', loanEvaluation?.recommended_amount ? `₹${loanEvaluation.recommended_amount.toLocaleString()}` : 'Subject to Review'],
                ['Max Tenure', loanEvaluation?.max_tenure || '36 months'],
                ['Interest Rate Band', loanEvaluation?.interest_rate || (analysisData?.risk_band === 'HIGH' ? '14-18%' : analysisData?.risk_band === 'LOW' ? '8-10%' : '10-14%')],
                ['Estimated EMI (₹1L/12mo)', loanEvaluation?.emi_estimate || 'Calculate on approval'],
                ['Loan-to-Income Ratio', loanEvaluation?.lti_ratio || (graphData?.composition?.earners > 1 ? 'Favorable' : 'Moderate')],
                ['Collateral Required', loanEvaluation?.collateral_required !== false ? 'Yes' : 'No'],
                ['Processing Priority', analysisData?.risk_band === 'LOW' ? 'Fast Track' : 'Standard'],
            ];

            loanDetails.forEach((row, idx) => {
                checkPageBreak(rowHeight);
                pdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 249 : 255, idx % 2 === 0 ? 250 : 255);
                pdf.rect(margin, yPosition, contentWidth, rowHeight, 'F');
                pdf.setDrawColor(222, 226, 230);
                pdf.rect(margin, yPosition, contentWidth, rowHeight, 'S');

                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(60, 60, 60);
                pdf.text(row[0], margin + 3, yPosition + 5);

                // Color code certain values
                if (row[0] === 'Risk Classification') {
                    const val = row[1];
                    if (val === 'HIGH') pdf.setTextColor(220, 38, 38);
                    else if (val === 'LOW') pdf.setTextColor(16, 185, 129);
                    else pdf.setTextColor(245, 158, 11);
                } else if (row[0] === 'Loan Eligibility') {
                    if (row[1] === 'ELIGIBLE') pdf.setTextColor(16, 185, 129);
                    else pdf.setTextColor(220, 38, 38);
                } else {
                    pdf.setTextColor(33, 37, 41);
                }
                pdf.setFont('helvetica', 'bold');
                pdf.text(row[1], margin + colWidth + 3, yPosition + 5);

                yPosition += rowHeight;
            });

            yPosition += 5;

            // Safeguards (if any)
            if (loanEvaluation?.safeguards?.length > 0) {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 64, 133);
                pdf.text('Required Safeguards:', margin, yPosition);
                yPosition += 5;

                loanEvaluation.safeguards.slice(0, 4).forEach(sg => {
                    pdf.setFontSize(8);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(60, 60, 60);
                    const lines = pdf.splitTextToSize(`• ${sg}`, contentWidth - 5);
                    lines.forEach(line => {
                        pdf.text(line, margin + 2, yPosition);
                        yPosition += 3.5;
                    });
                });
                yPosition += 3;
            }

            // Bank recommendation
            if (loanEvaluation?.recommendation) {
                checkPageBreak(20);
                pdf.setFillColor(232, 245, 233);
                pdf.setDrawColor(76, 175, 80);
                const recLines = pdf.splitTextToSize(loanEvaluation.recommendation, contentWidth - 10);
                const recHeight = recLines.length * 4 + 6;
                pdf.roundedRect(margin, yPosition, contentWidth, recHeight, 2, 2, 'FD');

                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(27, 94, 32);
                pdf.text('Bank Recommendation:', margin + 3, yPosition + 5);
                pdf.setFont('helvetica', 'normal');
                recLines.forEach((line, i) => {
                    pdf.text(line, margin + 3, yPosition + 9 + i * 4);
                });
                yPosition += recHeight + 5;
            }
        }

        // ==================== KEY RECOMMENDATIONS (Brief) ====================
        if (recommendations?.recommendations?.length > 0) {
            addSection('5', 'KEY RECOMMENDATIONS');

            recommendations.recommendations.slice(0, 3).forEach((rec, idx) => {
                const recText = rec.recommendation || rec;
                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(33, 37, 41);
                const lines = pdf.splitTextToSize(`${idx + 1}. ${recText}`, contentWidth - 5);
                lines.forEach(line => {
                    checkPageBreak(4);
                    pdf.text(line, margin + 2, yPosition);
                    yPosition += 3.5;
                });
                yPosition += 2;
            });
        }

        // ==================== FOOTER ====================
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // Footer line
            pdf.setDrawColor(0, 64, 133);
            pdf.setLineWidth(0.5);
            pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

            // Footer text
            pdf.setFontSize(7);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Page ${i}/${totalPages}`, margin, pageHeight - 7);
            pdf.text('CONFIDENTIAL - For Authorized Bank Personnel Only', pageWidth / 2, pageHeight - 7, { align: 'center' });
            pdf.text(`AnchorRisk © ${new Date().getFullYear()}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
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
