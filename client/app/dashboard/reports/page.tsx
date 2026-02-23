'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [reportType, setReportType] = useState<'thisYear' | 'allTime' | 'custom'>('thisYear');
    const [loading, setLoading] = useState(false);

    const setQuickRange = (type: 'thisYear' | 'allTime') => {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        let startDate = '';
        if (type === 'thisYear') {
            startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        } else {
            startDate = '2020-01-01';
        }
        setDateRange({ startDate, endDate });
        setReportType(type);
    };

    const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
        if (!dateRange.startDate || !dateRange.endDate) { alert('Please select both start and end dates'); return; }
        setLoading(true);
        try {
            const response = await fetch(
                `${API_URL}/reports/bookings?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&format=${format}`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
            );
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = `Failed to generate report (Status: ${response.status})`;
                if (contentType?.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } else {
                    const errorText = await response.text();
                    if (errorText) errorMessage += `: ${errorText.substring(0, 100)}`;
                }
                throw new Error(errorMessage);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings_report_${dateRange.startDate}_to_${dateRange.endDate}.${format === 'excel' ? 'xlsx' : format}`;
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

    const nmCard: React.CSSProperties = {
        background: 'var(--nm-bg)',
        boxShadow: '8px 8px 18px var(--nm-sd), -8px -8px 18px var(--nm-sl)',
        borderRadius: '20px',
    };
    const nmInset: React.CSSProperties = {
        background: 'var(--nm-bg)',
        boxShadow: 'inset 4px 4px 9px var(--nm-sd), inset -4px -4px 9px var(--nm-sl)',
        borderRadius: '12px',
        border: 'none',
        color: 'var(--nm-text)',
        outline: 'none',
    };

    return (
        <>
            <header className="px-8 py-6 bg-transparent" style={{ borderBottom: '1px solid var(--nm-border)' }}>
                <div>
                    <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--nm-text)' }}>Reports & Export</h2>
                    <p style={{ color: 'var(--nm-text-2)' }}>Generate and download booking reports 📊</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Quick Date Ranges */}
                    <div style={nmCard} className="p-6">
                        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--nm-text)' }}>Quick Date Ranges</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(['thisYear', 'allTime'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setQuickRange(type)}
                                    className="p-4 rounded-xl font-semibold transition-all text-sm"
                                    style={reportType === type
                                        ? { background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)', color: 'white', boxShadow: 'inset 4px 4px 9px rgba(0,0,0,0.15), inset -4px -4px 9px var(--nm-surface)' }
                                        : { ...nmCard, borderRadius: '12px', color: 'var(--nm-text-2)' }
                                    }
                                >
                                    <i className={`fa-solid ${type === 'thisYear' ? 'fa-calendar-days' : 'fa-infinity'} text-2xl mb-2 block`}></i>
                                    {type === 'thisYear' ? `This Year (${new Date().getFullYear()})` : 'All Time'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div style={nmCard} className="p-6">
                        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--nm-text)' }}>Custom Date Range</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>Start Date</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => { setDateRange({ ...dateRange, startDate: e.target.value }); setReportType('custom'); }}
                                    className="w-full px-4 py-3"
                                    style={nmInset}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--nm-text-2)' }}>End Date</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => { setDateRange({ ...dateRange, endDate: e.target.value }); setReportType('custom'); }}
                                    className="w-full px-4 py-3"
                                    style={nmInset}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Export */}
                    <div style={nmCard} className="p-6">
                        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--nm-text)' }}>Export Report</h3>

                        {dateRange.startDate && dateRange.endDate && (
                            <div className="mb-4 p-4 bg-teal-50 border-l-4 border-teal-400 rounded-r-xl">
                                <p className="text-sm text-teal-700">
                                    <i className="fa-solid fa-info-circle mr-2"></i>
                                    Selected Range: <strong>{new Date(dateRange.startDate).toLocaleDateString('en-IN')}</strong> to <strong>{new Date(dateRange.endDate).toLocaleDateString('en-IN')}</strong>
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => handleExport('excel')}
                            disabled={loading || !dateRange.startDate || !dateRange.endDate}
                            className="w-full p-6 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl font-bold transition-all flex flex-col items-center gap-3 disabled:cursor-not-allowed"
                            style={{ boxShadow: '5px 5px 14px var(--nm-sd), -5px -5px 14px var(--nm-sl)' }}
                        >
                            <i className="fa-solid fa-file-excel text-4xl"></i>
                            <span className="text-lg">Export as Excel</span>
                            <span className="text-xs opacity-90 font-medium">Download formatted spreadsheet with all booking details</span>
                        </button>

                        {loading && (
                            <div className="mt-6 text-center">
                                <i className="fa-solid fa-spinner fa-spin text-3xl text-teal-400 mb-2"></i>
                                <p style={{ color: 'var(--nm-text-2)' }}>Generating report...</p>
                            </div>
                        )}
                    </div>

                    {/* Report Info */}
                    <div style={nmCard} className="p-6">
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--nm-text)' }}>
                            <i className="fa-solid fa-circle-info text-teal-500 mr-2"></i>
                            Report Includes
                        </h3>
                        <ul className="space-y-2">
                            {[
                                'All booking details (ID, dates, status, amounts)',
                                'Primary and secondary guest information',
                                'Room details and pricing',
                                'Payment status and transaction details',
                                'Contact information (email, phone, address)',
                                'ID proof details for verification',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--nm-text-2)' }}>
                                    <i className="fa-solid fa-check text-emerald-500 mt-0.5 flex-shrink-0"></i>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
