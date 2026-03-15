"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// --- API Client Imports for Financial Reports ---
import {
    getAllDailySalesReports,
    deleteDailySalesReport,
    DailySalesReport,
} from "@/lib/accounts";

// --- Icons ---
import {
    Trash2,
    Calendar,
    ChevronDown,
    Info,
    Filter,
    X,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Wallet,
    Clock
} from "lucide-react";

// =============================================================
// CONFIGURATION
// =============================================================

const EXPENSE_CATEGORIES =[
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' }
];

// =============================================================
// TYPES & HELPERS
// =============================================================

type AccountDetails = {[key: string]: number; }
type DailyReportEntry = {
    id: number;
    date: string;
    totalSaleOrder: number;
    totalSaleOrderAmount: number;
    saleOrderCollection: number;
    saleOrderBalAmount: number;
    totalDayCollection: number;
    totalCash: number;
    totalAC: number;
    expense: number;
    category: string;
    acDetails: AccountDetails;
};

const formatRupee = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount || 0);
};

const getCategoryLabel = (val: string | null) => {
    if (!val) return 'N/A';
    const found = EXPENSE_CATEGORIES.find(c => c.value === val);
    return found ? found.label : val;
}

const mapApiToComponent = (apiReport: DailySalesReport): DailyReportEntry => {
    const displayDate = apiReport.date
        ? new Date(apiReport.date + 'T00:00:00').toLocaleDateString('en-GB').replace(/\//g, '-')
        : 'N/A';

    return {
        id: apiReport.id,
        date: displayDate,
        totalSaleOrder: apiReport.total_sales_order ?? 0,
        totalSaleOrderAmount: apiReport.total_sale_order_amount ?? 0,
        saleOrderCollection: apiReport.sale_order_collection ?? 0,
        saleOrderBalAmount: apiReport.sale_order_balance_amount ?? 0,
        totalDayCollection: apiReport.total_day_collection ?? 0,
        totalCash: apiReport.total_amount_on_cash ?? 0,
        totalAC: apiReport.total_amount_on_ac ?? 0,
        expense: apiReport.expense ?? 0,
        category: apiReport.category ?? '',
        acDetails: {
            'IBO 420': apiReport.ibo_420 ?? 0,
            'Decor UJ': apiReport.decor_uj ?? 0,
            'Anil Fed': apiReport.anil_fed ?? 0,
            'Remya Fed': apiReport.remya_fed ?? 0,
            'KDB 186': apiReport.kdb_186 ?? 0,
            'KGB 070': apiReport.kgb_070 ?? 0,
            'Kiran UJ': apiReport.kiran_uj ?? 0,
            'Cheque': apiReport.cheque ?? 0,
        },
    };
};

// =============================================================
// CHILD COMPONENT: DailyReportRegister
// =============================================================
interface DailyReportRegisterProps {
    reports: DailySalesReport[];
    isLoading: boolean;
    onDelete: (id: number) => void;
}

const DailyReportRegister = ({ reports, isLoading, onDelete }: DailyReportRegisterProps) => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [showOnboarding, setShowOnboarding] = useState(true);

    const filteredReports = useMemo(() => {
        let data =[...reports];
        
        // Filter by Date Range
        if (fromDate) {
            data = data.filter(r => r.date && r.date >= fromDate);
        }
        if (toDate) {
            data = data.filter(r => r.date && r.date <= toDate);
        }
        
        // Filter by Category
        if (categoryFilter) {
            data = data.filter(r => r.category === categoryFilter);
        }
        
        return data.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA; // Sort descending (newest first)
        });
    }, [reports, fromDate, toDate, categoryFilter]);

    // Calculate summary statistics for the filtered view
    const summaryStats = useMemo(() => {
        return filteredReports.reduce((acc, curr) => ({
            collections: acc.collections + (curr.total_day_collection || 0),
            expenses: acc.expenses + (curr.expense || 0),
            orders: acc.orders + (curr.total_sales_order || 0),
            totalOrderValue: acc.totalOrderValue + (curr.total_sale_order_amount || 0),
            pendingBalance: acc.pendingBalance + (curr.sale_order_balance_amount || 0)
        }), { collections: 0, expenses: 0, orders: 0, totalOrderValue: 0, pendingBalance: 0 });
    }, [filteredReports]);

    const clearFilters = () => {
        setFromDate("");
        setToDate("");
        setCategoryFilter("");
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="py-2 px-4">
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <div className="px-4 py-2 border-t">
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            
            {/* 1. Welcoming Onboarding Banner */}
            {showOnboarding && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative text-sm text-blue-800 shadow-sm">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-6 w-6 text-blue-500 hover:bg-blue-100" 
                        onClick={() => setShowOnboarding(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex items-start gap-3 pr-6">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold mb-1">Welcome to the Financial Dashboard</h4>
                            <p className="text-blue-700/80">
                                Here you can view your end-of-day financial submissions. Use the filters below to narrow down by date or category. Click <strong>"View Details"</strong> on any record to see a full breakdown of cash vs. digital transactions and balances.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Quick Statistics (Summary of Filtered Data) - Split into two rows for better readability */}
            <div className="flex flex-col gap-3">
                {/* Row 1: Collection, Order Value, Orders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-full text-blue-600 shrink-0">
                                <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Total Orders</p>
                                <h4 className="text-xl font-bold text-blue-700">
                                    {summaryStats.orders} <span className="text-sm font-medium">No's</span>
                                </h4>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50/50 border-purple-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-full text-purple-600 shrink-0">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Total Order Value</p>
                                <h4 className="text-xl font-bold text-purple-700">
                                    {formatRupee(summaryStats.totalOrderValue)}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50/50 border-green-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full text-green-600 shrink-0">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Amount Collected</p>
                                <h4 className="text-xl font-bold text-green-700">
                                    {formatRupee(summaryStats.collections)}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Row 2: Expenses and Pending Balance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card className="bg-amber-50/50 border-amber-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-full text-amber-600 shrink-0">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Pending Balance</p>
                                <h4 className="text-xl font-bold text-amber-700">
                                    {formatRupee(summaryStats.pendingBalance)}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-red-50/50 border-red-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Total Expenses</p>
                                <h4 className="text-xl font-bold text-red-700">
                                    {formatRupee(summaryStats.expenses)}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 3. Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 p-3 bg-white rounded-md border shadow-sm items-start lg:items-center">
                <div className="flex items-center gap-2 shrink-0">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Filter Reports:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full flex-1">
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-xs font-medium text-gray-500 w-10 sm:w-auto">From</span>
                        <Input 
                            type="date" 
                            value={fromDate} 
                            onChange={(e) => setFromDate(e.target.value)} 
                            className="h-9 text-sm w-full sm:w-36 bg-gray-50 cursor-pointer" 
                        />
                    </div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-xs font-medium text-gray-500 w-10 sm:w-auto">To</span>
                        <Input 
                            type="date" 
                            value={toDate} 
                            onChange={(e) => setToDate(e.target.value)} 
                            className="h-9 text-sm w-full sm:w-36 bg-gray-50 cursor-pointer" 
                        />
                    </div>
                    <select 
                        value={categoryFilter} 
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-9 text-sm w-full sm:w-48 rounded-md border border-input bg-gray-50 px-3 py-1 focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                    >
                        <option value="">All Categories</option>
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                {(fromDate || toDate || categoryFilter) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-sm px-3 hover:bg-red-50 text-red-600 shrink-0">
                        <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                )}
            </div>

            {/* 4. List of Reports */}
            <div className="space-y-3 mt-4">
                {filteredReports.map((report) => {
                    const displayReport = mapApiToComponent(report);
                    const categoryLabel = getCategoryLabel(displayReport.category);

                    return (
                        <Card key={report.id} className="shadow-sm hover:border-gray-300 transition-colors">
                            <CardHeader className="py-3 px-4 bg-white">
                                <Collapsible className="group/collapsible"> 
                                    <div className="flex justify-between items-center gap-2">
                                        
                                        {/* Left: Date & Category */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                            <div className="flex items-center bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                                                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                                <span className="text-sm font-bold text-gray-800">{displayReport.date}</span>
                                            </div>
                                            {displayReport.category && (
                                                <Badge variant="secondary" className="text-[11px] font-medium bg-gray-100 text-gray-700">
                                                    {categoryLabel}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Right: Actions & Toggle */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="hidden sm:flex flex-col items-end mr-4">
                                                <span className="text-[10px] text-gray-500 uppercase font-semibold">Day Collection</span>
                                                <span className="text-sm font-bold text-green-700">{formatRupee(displayReport.totalDayCollection)}</span>
                                            </div>
                                            
                                            <CollapsibleTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 text-xs gap-1 hover:bg-gray-50 text-gray-700 [&[data-state=open]>svg]:rotate-180">
                                                    <span className="hidden sm:inline">View Details</span>
                                                    <span className="sm:hidden">Details</span>
                                                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                                </Button>
                                            </CollapsibleTrigger>

                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(report.id)} title="Delete Report">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <CollapsibleContent className="mt-4 pt-4 border-t border-gray-100">
                                        
                                        {/* --- Section 1: Sale Order Summary --- */}
                                        <div className="mb-5">
                                            <h4 className="font-semibold text-sm mb-1 text-gray-800">Sale Order Summary</h4>
                                            <p className="text-[11px] text-gray-500 mb-2">Overview of total products ordered and pending balances.</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border">
                                                <div><span className="text-gray-500 block text-xs mb-0.5">Total Orders</span> <span className="font-semibold text-sm">{displayReport.totalSaleOrder} NO'S</span></div>
                                                <div><span className="text-gray-500 block text-xs mb-0.5">Total Order Value</span> <span className="font-semibold text-sm">{formatRupee(displayReport.totalSaleOrderAmount)}</span></div>
                                                <div><span className="text-gray-500 block text-xs mb-0.5">Amount Collected</span> <span className="font-semibold text-sm text-green-700">{formatRupee(displayReport.saleOrderCollection)}</span></div>
                                                <div><span className="text-gray-500 block text-xs mb-0.5">Pending Balance</span> <span className="font-semibold text-sm text-amber-600">{formatRupee(displayReport.saleOrderBalAmount)}</span></div>
                                            </div>
                                        </div>
                                        
                                        {/* --- Section 2: Cash Book Breakdown --- */}
                                        <div className="mb-5">
                                            <h4 className="font-semibold text-sm mb-1 text-gray-800">Cash Book Breakdown</h4>
                                            <p className="text-[11px] text-gray-500 mb-2">Split of funds collected via physical cash versus digital/bank transfers, minus expenses.</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 rounded-lg border border-gray-200">
                                                <div className="md:border-r border-gray-200 pr-2"><span className="text-gray-500 block text-xs mb-0.5">Physical Cash</span> <span className="font-semibold text-sm">{formatRupee(displayReport.totalCash)}</span></div>
                                                <div className="md:border-r border-gray-200 pr-2"><span className="text-gray-500 block text-xs mb-0.5">Digital / Bank (A/C)</span> <span className="font-semibold text-sm">{formatRupee(displayReport.totalAC)}</span></div>
                                                <div className="col-span-2 md:col-span-1 bg-red-50 -my-3 -mx-3 md:-mx-0 md:-mr-3 p-3 rounded-b-lg md:rounded-bl-none md:rounded-r-lg">
                                                    <span className="text-red-400 block text-xs mb-0.5">Day's Expenses</span> 
                                                    <span className="font-semibold text-sm text-red-600">{formatRupee(displayReport.expense)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* --- Section 3: A/C Specifics --- */}
                                        <div>
                                            <h5 className="font-semibold text-xs uppercase text-gray-500 mb-2 flex items-center gap-1">
                                                Bank & Digital Account Specifics <Info className="h-3 w-3" />
                                            </h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs bg-white border border-gray-100 p-3 rounded-lg shadow-inner">
                                                {Object.entries(displayReport.acDetails)
                                                    .filter(([, amount]) => amount > 0)
                                                    .map(([key, amount]) => (
                                                    <div key={key} className="bg-gray-50 px-3 py-2 rounded border border-gray-100">
                                                        <span className="text-gray-500 block truncate text-[10px] uppercase font-bold tracking-wide mb-1" title={key}>{key}</span> 
                                                        <span className="font-semibold text-gray-800 text-sm">{formatRupee(amount)}</span>
                                                    </div>
                                                ))}
                                                {Object.entries(displayReport.acDetails).filter(([, amount]) => amount > 0).length === 0 && (
                                                    <span className="text-gray-400 italic py-2 col-span-full">No digital transactions recorded.</span>
                                                )}
                                            </div>
                                        </div>

                                    </CollapsibleContent>
                                </Collapsible>
                            </CardHeader>
                        </Card>
                    )
                })}

                {/* Empty State */}
                {!isLoading && filteredReports.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                        <div className="bg-gray-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Info className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">No reports found</h3>
                        <p className="text-xs text-gray-500">We couldn't find any financial reports matching your current filters.</p>
                        {(fromDate || toDate || categoryFilter) && (
                            <Button variant="link" onClick={clearFilters} className="mt-2 text-blue-600">
                                Clear all filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================
// MAIN PAGE COMPONENT
// =============================================================
export const AdminFinancialsPage = () => {
    const { toast } = useToast();

    // --- State for Daily Financial Reports ---
    const[reportHistory, setReportHistory] = useState<DailySalesReport[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);

    const fetchReports = async () => {
        setIsLoadingReports(true);
        const response = await getAllDailySalesReports();
        if (response.data) {
            setReportHistory(response.data);
        } else {
            toast({ title: "Error Fetching Reports", description: response.error, variant: "destructive" });
        }
        setIsLoadingReports(false);
    };

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]); // <-- Missing dependency array and closing brackets added here

    // --- Delete Handler ---
    const handleDeleteReport = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this report?")) {
            const response = await deleteDailySalesReport(id);
            if (response.success) {
                toast({ title: "Success", description: "Report deleted successfully." });
                fetchReports(); // Refresh the list after deletion
            } else {
                toast({ title: "Error", description: response.error || "Failed to delete", variant: "destructive" });
            }
        }
    };

    // --- Main Render ---
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Financial Reports</h2>
                <p className="text-sm text-gray-500">View and manage daily sales and expense reports.</p>
            </div>

            <DailyReportRegister
                reports={reportHistory}
                isLoading={isLoadingReports}
                onDelete={handleDeleteReport}
            />

            <Toaster />
        </div>
    );
};