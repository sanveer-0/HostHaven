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

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = async () => {
        if (!invoiceRef.current || exporting) return;

        setExporting(true);

        // Create a style element to override problematic colors
        const styleElement = document.createElement('style');
        styleElement.id = 'pdf-export-override';

        try {
            console.log('Starting PDF export...');

            const element = invoiceRef.current;

            // Inject CSS to override all colors with standard RGB
            styleElement.textContent = `
                [data-invoice] * {
                    color: rgb(0, 0, 0) !important;
                    background-color: rgb(255, 255, 255) !important;
                    background-image: none !important;
                    border-color: rgb(200, 200, 200) !important;
                }
                [data-invoice] .border-blue-600 {
                    border-color: rgb(37, 99, 235) !important;
                }
                [data-invoice] .text-blue-600,
                [data-invoice] .text-blue-700,
                [data-invoice] .text-blue-800 {
                    color: rgb(37, 99, 235) !important;
                }
                [data-invoice] .text-slate-600,
                [data-invoice] .text-slate-700,
                [data-invoice] .text-slate-800 {
                    color: rgb(71, 85, 105) !important;
                }
                [data-invoice] .text-slate-500 {
                    color: rgb(100, 116, 139) !important;
                }
                [data-invoice] .bg-slate-50 {
                    background-color: rgb(248, 250, 252) !important;
                }
                [data-invoice] .bg-yellow-50 {
                    background-color: rgb(254, 252, 232) !important;
                }
                [data-invoice] .text-yellow-800 {
                    color: rgb(133, 77, 14) !important;
                }
                [data-invoice] .border-yellow-500 {
                    border-color: rgb(234, 179, 8) !important;
                }
            `;
            document.head.appendChild(styleElement);

            // Wait for styles to apply
            await new Promise(resolve => setTimeout(resolve, 100));

            console.log('Capturing element with html2canvas...');

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
                foreignObjectRendering: false
            });

            console.log('Canvas created, converting to image...');
            const imgData = canvas.toDataURL('image/png');

            console.log('Creating PDF...');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            console.log('Adding image to PDF...');
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
            console.log('Saving PDF as:', filename);
            pdf.save(filename);

            console.log('PDF export completed successfully!');
            alert('Invoice downloaded successfully!');
        } catch (error: any) {
            console.error('PDF Export Error:', error);
            alert(`Failed to generate PDF: ${error.message || 'Unknown error'}. Please check the browser console for details.`);
        } finally {
            // Remove the style override
            const styleEl = document.getElementById('pdf-export-override');
            if (styleEl) {
                styleEl.remove();
            }
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                {/* Invoice Content */}
                <div ref={invoiceRef} data-invoice className="p-8 bg-white">
                    {/* Header */}
                    <div className="border-b-4 border-blue-600 pb-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-800 mb-2">INVOICE</h1>
                                <p className="text-slate-600">HostHaven Guesthouse</p>
                                <p className="text-sm text-slate-500">Premium Accommodation Services</p>
                            </div>
                            <div className="text-right">
                                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-block mb-2">
                                    <p className="text-xs font-semibold">Invoice Number</p>
                                    <p className="text-lg font-bold">{invoice.invoiceNumber}</p>
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
                        <div className="bg-slate-50 p-5 rounded-lg">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Bill To</h3>
                            <p className="text-lg font-bold text-slate-800">{invoice.guest.name}</p>
                            <p className="text-sm text-slate-600">{invoice.guest.email}</p>
                            <p className="text-sm text-slate-600">{invoice.guest.phone}</p>
                        </div>

                        {/* Stay Details */}
                        <div className="bg-slate-50 p-5 rounded-lg">
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
                                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                                    <th className="text-right py-3 px-4 font-semibold w-32">Amount</th>
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
                                    <td className="py-4 px-4 text-lg font-bold">TOTAL AMOUNT</td>
                                    <td className="py-4 px-4 text-right text-2xl font-bold">
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
                    <div className="border-t pt-4 mt-6">
                        <p className="text-xs text-slate-500 text-center">
                            Thank you for choosing HostHaven Guesthouse. We hope you enjoyed your stay!
                        </p>
                        <p className="text-xs text-slate-400 text-center mt-1">
                            For any queries, please contact us at info@hosthaven.com
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 p-6 bg-slate-50 border-t print:hidden">
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
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
                        onClick={handlePrint}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-print"></i>
                        Print Invoice
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all"
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
