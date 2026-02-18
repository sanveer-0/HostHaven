'use client';

import { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceModalProps {
    invoice: any;
    onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);



    const handleExportPDF = async () => {
        if (!invoiceRef.current || exporting) return;

        setExporting(true);

        try {
            console.log('Starting PDF export...');

            // Create a temporary clone for capturing
            const originalElement = invoiceRef.current;
            const clone = originalElement.cloneNode(true) as HTMLElement;

            // Container to hold the clone off-screen but rendered
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '-10000px';
            container.style.left = '-10000px';
            container.style.width = '210mm'; // A4 width
            container.style.zIndex = '-1000';
            container.appendChild(clone);
            document.body.appendChild(container);

            // Recursive function to apply styles and handle inheritance manually
            const applyStylesRecursively = (element: HTMLElement, inheritedTextColor: string) => {
                const setStyle = (el: HTMLElement, prop: string, val: string) => el.style.setProperty(prop, val, 'important');
                const classList = element.className && typeof element.className === 'string' ? element.className : '';

                let currentTextColor = inheritedTextColor;
                let hasContrastBackground = false;

                // 2. Handle Background Colors FIRST to determine contrast
                if (classList.includes('bg-blue-600')) {
                    setStyle(element, 'background-color', '#2563eb');
                    currentTextColor = '#ffffff'; // Force white text on blue
                    hasContrastBackground = true;
                }
                else if (classList.includes('bg-slate-800')) {
                    setStyle(element, 'background-color', '#1e293b');
                    currentTextColor = '#ffffff'; // Force white text on dark slate
                    hasContrastBackground = true;
                }
                else if (classList.includes('bg-slate-200')) setStyle(element, 'background-color', '#e2e8f0');
                else if (classList.includes('bg-slate-900')) {
                    setStyle(element, 'background-color', '#0f172a');
                    currentTextColor = '#ffffff';
                    hasContrastBackground = true;
                }
                else if (classList.includes('bg-slate-50')) setStyle(element, 'background-color', '#f8fafc');
                else if (classList.includes('bg-yellow-50')) setStyle(element, 'background-color', '#fefce8');
                else if (classList.includes('bg-white')) setStyle(element, 'background-color', '#ffffff');
                else setStyle(element, 'background-color', 'transparent'); // Default safe background

                // 1. Determine Text Color (if not forced by background)
                if (!hasContrastBackground) {
                    if (classList.includes('text-white')) currentTextColor = '#ffffff';
                    else if (classList.includes('text-blue')) currentTextColor = '#2563eb';
                    else if (classList.includes('text-yellow')) currentTextColor = '#854d0e';
                    else if (classList.includes('text-slate-900')) currentTextColor = '#0f172a';
                    else if (classList.includes('text-slate-800')) currentTextColor = '#1e293b';
                    else if (classList.includes('text-slate-700')) currentTextColor = '#334155';
                    else if (classList.includes('text-slate-600')) currentTextColor = '#475569';
                    else if (classList.includes('text-slate-500')) currentTextColor = '#64748b';
                    else if (classList.includes('text-slate-400')) currentTextColor = '#94a3b8';
                }

                // FORCE the determined color
                setStyle(element, 'color', currentTextColor);

                // 3. Handle Border Colors
                if (classList.includes('border-blue')) setStyle(element, 'border-color', '#2563eb');
                else if (classList.includes('border-yellow')) setStyle(element, 'border-color', '#eab308');
                else if (classList.includes('border-slate-200')) setStyle(element, 'border-color', '#e2e8f0');
                else if (classList.includes('border-slate')) setStyle(element, 'border-color', '#e2e8f0');
                else setStyle(element, 'border-color', 'transparent');

                // 4. Ensure visibility
                element.style.overflow = 'visible';

                // Recurse to children
                const children = element.children;
                for (let i = 0; i < children.length; i++) {
                    applyStylesRecursively(children[i] as HTMLElement, currentTextColor);
                }
            };

            // Start recursion with default dark text
            applyStylesRecursively(clone, '#0f172a');

            // Wait for images/fonts in clone
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('Capturing element with html2canvas...');

            const canvas = await html2canvas(clone, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
                foreignObjectRendering: false,
                windowWidth: container.scrollWidth,
                windowHeight: container.scrollHeight
            });

            // Cleanup clone
            document.body.removeChild(container);

            console.log('Canvas created, converting to image...');
            const imgData = canvas.toDataURL('image/png');

            console.log('Creating PDF...');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            console.log('Adding image to PDF...');

            // First page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Additional pages if needed
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
            console.log('Saving PDF as:', filename);
            pdf.save(filename);

            console.log('PDF export completed successfully!');
            alert('Invoice downloaded successfully!');
        } catch (error: any) {
            console.error('PDF Export Error:', error);
            alert(`Failed to generate PDF: ${error.message || 'Unknown error'}. Please check the browser console for details.`);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card-dark rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] animate-scale-in border border-white/10 flex flex-col overflow-hidden">
                {/* Invoice Content - Keeps white background for document look */}
                <div className="flex-1 overflow-y-auto p-1 bg-slate-200">
                    <div ref={invoiceRef} id="invoice-content" data-invoice className="p-8 bg-white text-slate-900 shadow-sm">
                        {/* Header */}
                        <div className="border-b-4 border-blue-600 pb-6 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-4xl font-bold text-slate-900 mb-2">INVOICE</h1>
                                    <p className="text-slate-700">HostHaven Guesthouse</p>
                                    <p className="text-sm text-slate-500">Premium Accommodation Services</p>
                                </div>
                                <div className="text-right">
                                    <div className="mb-2">
                                        <p className="text-sm font-bold text-slate-500 uppercase">Invoice Number</p>
                                        <p className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</p>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Guest & Stay Information */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* Bill To */}
                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Bill To</h3>
                                <p className="text-lg font-bold text-slate-800">{invoice.guest.name}</p>
                                <p className="text-sm text-slate-600">{invoice.guest.email}</p>
                                <p className="text-sm text-slate-600">{invoice.guest.phone}</p>
                            </div>

                            {/* Stay Details */}
                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Stay Details</h3>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold">Room:</span> {invoice.room.roomNumber} ({invoice.room.type})
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold">Check-In:</span> {new Date(invoice.booking.checkInDate).toLocaleDateString()}
                                        {invoice.booking.checkInTime && <span className="ml-2 text-blue-600 font-semibold">@ {invoice.booking.checkInTime}</span>}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold">Check-Out:</span> {new Date(invoice.booking.checkOutDate).toLocaleDateString()}
                                        {invoice.booking.checkOutTime && <span className="ml-2 text-blue-600 font-semibold">@ {invoice.booking.checkOutTime}</span>}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold">Duration:</span> {invoice.booking.nights} night(s)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Charges Table */}
                        <div className="mb-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-800 text-white">
                                        <th className="text-left py-3 px-4 font-semibold text-white">Description</th>
                                        <th className="text-right py-3 px-4 font-semibold w-32 text-white">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {/* Room Charges */}
                                    <tr className="bg-white">
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-slate-800">Room Charges</p>
                                            <p className="text-sm text-slate-600">{invoice.charges.roomCharges.description}</p>
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                                            ₹{invoice.charges.roomCharges.amount.toFixed(2)}
                                        </td>
                                    </tr>

                                    {/* Service Charges */}
                                    {invoice.charges.serviceCharges && invoice.charges.serviceCharges.length > 0 && (
                                        <>
                                            <tr className="bg-slate-50">
                                                <td colSpan={2} className="py-2 px-4">
                                                    <p className="font-semibold text-slate-700">Service Charges</p>
                                                </td>
                                            </tr>
                                            {invoice.charges.serviceCharges.map((service: any, index: number) => (
                                                <tr key={index} className="bg-white">
                                                    <td className="py-2 px-4 pl-8">
                                                        <p className="text-sm text-slate-700">{service.description}</p>
                                                        {service.items && service.items.length > 0 && (
                                                            <div className="mt-1 ml-3 space-y-0.5">
                                                                {service.items.map((item: any, idx: number) => (
                                                                    <p key={idx} className="text-xs text-slate-500">
                                                                        • {item.name} x{item.quantity} @ ₹{item.price}
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {new Date(service.date).toLocaleDateString()}
                                                        </p>
                                                    </td>
                                                    <td className="py-2 px-4 text-right text-sm text-slate-700">
                                                        ₹{service.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50">
                                                <td className="py-2 px-4 pl-8 font-semibold text-slate-700">
                                                    Total Service Charges
                                                </td>
                                                <td className="py-2 px-4 text-right font-semibold text-slate-700">
                                                    ₹{invoice.charges.totalServiceCharges.toFixed(2)}
                                                </td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-blue-600 text-white">
                                        <td className="py-4 px-4 text-lg font-bold text-white">TOTAL AMOUNT</td>
                                        <td className="py-4 px-4 text-right text-2xl font-bold text-white">
                                            ₹{invoice.totalAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Payment Status */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                            <p className="text-sm font-semibold text-yellow-800">
                                <i className="fa-solid fa-clock mr-2"></i>
                                Payment Status: PENDING
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                                Please proceed to the Payments section to complete this payment.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-200 pt-4 mt-6">
                            <p className="text-xs text-slate-500 text-center">
                                Thank you for choosing HostHaven Guesthouse. We hope you enjoyed your stay!
                            </p>
                            <p className="text-xs text-slate-400 text-center mt-1">
                                For any queries, please contact us at info@hosthaven.com
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 p-6 border-t border-white/10 print:hidden shrink-0 bg-slate-900/80 backdrop-blur-md z-10">
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        {exporting ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-file-pdf"></i>
                                Export as PDF
                            </>
                        )}
                    </button>

                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition-all border border-white/5"
                    >
                        Close
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    ${invoiceRef.current ? `
                        #invoice-content,
                        #invoice-content * {
                            visibility: visible;
                        }
                        #invoice-content {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                    ` : ''}
                }
            `}</style>
        </div>
    );
}
