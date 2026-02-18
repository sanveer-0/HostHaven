'use client';

import { useState } from 'react';
import { bookingsAPI } from '@/lib/api';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [reportType, setReportType] = useState<'thisYear' | 'allTime' | 'custom'>('thisYear');
    const [loading, setLoading] = useState(false);

    // Set date range based on report type
    const setQuickRange = (type: 'thisYear' | 'allTime') => {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        let startDate = '';

        switch (type) {
            case 'thisYear':
                // Start from January 1st of current year
                const yearStart = new Date(today.getFullYear(), 0, 1);
                startDate = yearStart.toISOString().split('T')[0];
                break;
            case 'allTime':
                // Start from a very early date (e.g., 2020-01-01)
                startDate = '2020-01-01';
                break;
        }

        setDateRange({ startDate, endDate });
        setReportType(type);
    };

    const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
        if (!dateRange.startDate || !dateRange.endDate) {
            alert('Please select both start and end dates');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/reports/bookings?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&format=${format}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) {
                // Try to get error message from response
                const contentType = response.headers.get('content-type');
                let errorMessage = `Failed to generate report (Status: ${response.status})`;

                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('Server error:', errorData);
                } else {
                    const errorText = await response.text();
                    console.error('Server error text:', errorText);
                    if (errorText) errorMessage += `: ${errorText.substring(0, 100)}`;
                }

                throw new Error(errorMessage);
            }

            // Get the blob from response
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings_report_${dateRange.startDate}_to_${dateRange.endDate}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Report downloaded successfully!');
        } catch (error: any) {
            console.error('Export error:', error);
            alert(`Failed to export report: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <header className="px-8 py-6 border-b border-white/5 bg-transparent">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100 mb-1 drop-shadow-lg">Reports & Export</h2>
                        <p className="text-slate-300">Generate and download booking reports 📊</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Quick Date Range Buttons */}
                    <div className="glass-card-dark rounded-2xl p-6 border border-white/5">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Quick Date Ranges</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setQuickRange('thisYear')}
                                className={`p-4 rounded-xl font-semibold transition-all border ${reportType === 'thisYear'
                                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg border-transparent'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                                    }`}
                            >
                                <i className="fa-solid fa-calendar-days text-2xl mb-2 block"></i>
                                This Year ({new Date().getFullYear()})
                            </button>
                            <button
                                onClick={() => setQuickRange('allTime')}
                                className={`p-4 rounded-xl font-semibold transition-all border ${reportType === 'allTime'
                                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg border-transparent'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                                    }`}
                            >
                                <i className="fa-solid fa-infinity text-2xl mb-2 block"></i>
                                All Time
                            </button>
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="glass-card-dark rounded-2xl p-6 border border-white/5">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Custom Date Range</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => {
                                        setDateRange({ ...dateRange, startDate: e.target.value });
                                        setReportType('custom');
                                    }}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-400 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => {
                                        setDateRange({ ...dateRange, endDate: e.target.value });
                                        setReportType('custom');
                                    }}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="glass-card-dark rounded-2xl p-6 border border-white/5">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Export Report</h3>

                        {dateRange.startDate && dateRange.endDate && (
                            <div className="mb-4 p-4 bg-cyan-900/20 border-l-4 border-cyan-500 rounded">
                                <p className="text-sm text-cyan-200">
                                    <i className="fa-solid fa-info-circle mr-2"></i>
                                    Selected Range: <strong>{new Date(dateRange.startDate).toLocaleDateString('en-IN')}</strong> to <strong>{new Date(dateRange.endDate).toLocaleDateString('en-IN')}</strong>
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleExport('excel')}
                                disabled={loading || !dateRange.startDate || !dateRange.endDate}
                                className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-800 text-white rounded-xl font-bold transition-all shadow-lg flex flex-col items-center gap-3 disabled:text-slate-500 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-file-excel text-4xl"></i>
                                <span className="text-lg">Export as Excel</span>
                                <span className="text-xs opacity-90 font-medium">Download formatted spreadsheet with all booking details</span>
                            </button>
                        </div>

                        {loading && (
                            <div className="mt-6 text-center">
                                <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-500 mb-2"></i>
                                <p className="text-slate-400">Generating report...</p>
                            </div>
                        )}
                    </div>

                    {/* Report Details Info */}
                    <div className="glass-card-dark rounded-2xl p-6 border border-white/5">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">
                            <i className="fa-solid fa-circle-info text-cyan-500 mr-2"></i>
                            Report Includes
                        </h3>
                        <ul className="space-y-2 text-slate-400">
                            <li className="flex items-start gap-2">
                                <i className="fa-solid fa-check text-emerald-500 mt-1"></i>
                                <span>All booking details (ID, dates, status, amounts)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <i className="fa-solid fa-check text-emerald-500 mt-1"></i>
                                <span>Primary and secondary guest information</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <i className="fa-solid fa-check text-emerald-500 mt-1"></i>
                                <span>Room details and pricing</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <i className="fa-solid fa-check text-emerald-500 mt-1"></i>
                                <span>Payment status and transaction details</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <i className="fa-solid fa-check text-emerald-500 mt-1"></i>
                                <span>Contact information (email, phone, address)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <i className="fa-solid fa-check text-emerald-500 mt-1"></i>
                                <span>ID proof details for verification</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
