"use client"

import React, { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout" 

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- API Client Imports ---
import {
  createDailySalesReport,
  getAllDailySalesReports,
  updateDailySalesReport,
  deleteDailySalesReport,
  DailySalesReport,
  DailySalesReportCreatePayload,
  DailySalesReportUpdatePayload,
} from "@/lib/accounts"

// --- Icons ---
import {
  Landmark, FileUp, ListOrdered, DollarSign, Loader2, Calendar, ChevronDown, Info,
  Calculator, Pencil, Trash2, XCircle, Filter, X, Lightbulb, CheckCircle2, ArrowRight, Plus, Equal
} from "lucide-react"

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

type AccountDetails = { [key: string]: number; }
type DailyReportEntry = {
    id: number;
    date: string;
    rawDate: string; 
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

const formatRupee = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

const getCategoryLabel = (val: string | null) => {
    if (!val) return 'N/A';
    const found = EXPENSE_CATEGORIES.find(c => c.value === val);
    return found ? found.label : val;
}

const mapApiToComponent = (apiReport: DailySalesReport): DailyReportEntry => {
    const rawDate = apiReport.date ? apiReport.date.split('T')[0] : '';
    const displayDate = apiReport.date
        ? new Date(apiReport.date + 'T00:00:00').toLocaleDateString('en-GB').replace(/\//g, '-')
        : 'N/A';

    return {
        id: apiReport.id,
        date: displayDate,
        rawDate: rawDate,
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
// CHILD COMPONENT: DailyReportUpload (Beginner Friendly)
// =============================================================
interface DailyReportUploadProps {
  onReportCreate: (payload: DailySalesReportCreatePayload) => Promise<boolean>;
  onReportUpdate: (id: number, payload: DailySalesReportUpdatePayload) => Promise<boolean>;
  reportToEdit: DailySalesReport | null;
  onCancelEdit: () => void;
}

const DailyReportUpload = ({ onReportCreate, onReportUpdate, reportToEdit, onCancelEdit }: DailyReportUploadProps) => {
    const { toast } = useToast();
    const isEditMode = !!reportToEdit;
    
    const initialFormState = {
        date: new Date().toISOString().split('T')[0], 
        total_sales_order: '', 
        total_sale_order_amount: '', 
        sale_order_collection: '',
        sale_order_balance_amount: '', 
        total_day_collection: '', 
        total_amount_on_cash: '', 
        total_amount_on_ac: '', 
        ibo_420: '', decor_uj: '', anil_fed: '', remya_fed: '', 
        kdb_186: '', kgb_070: '', kiran_uj: '', cheque: '',
        expense: '', category: '' 
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (reportToEdit) {
            setFormData({
                date: reportToEdit.date?.split('T')[0] ?? '',
                total_sales_order: String(reportToEdit.total_sales_order ?? ''),
                total_sale_order_amount: String(reportToEdit.total_sale_order_amount ?? ''),
                sale_order_collection: String(reportToEdit.sale_order_collection ?? ''),
                sale_order_balance_amount: String(reportToEdit.sale_order_balance_amount ?? ''),
                total_day_collection: String(reportToEdit.total_day_collection ?? ''),
                total_amount_on_cash: String(reportToEdit.total_amount_on_cash ?? ''),
                total_amount_on_ac: String(reportToEdit.total_amount_on_ac ?? ''),
                ibo_420: String(reportToEdit.ibo_420 ?? ''), decor_uj: String(reportToEdit.decor_uj ?? ''), 
                anil_fed: String(reportToEdit.anil_fed ?? ''), remya_fed: String(reportToEdit.remya_fed ?? ''), 
                kdb_186: String(reportToEdit.kdb_186 ?? ''), kgb_070: String(reportToEdit.kgb_070 ?? ''), 
                kiran_uj: String(reportToEdit.kiran_uj ?? ''), cheque: String(reportToEdit.cheque ?? ''),
                expense: String(reportToEdit.expense ?? ''), category: reportToEdit.category ?? ''
            });
        } else {
            setFormData(initialFormState);
        }
    }, [reportToEdit]);
    
    // Auto-calculate Totals
    useEffect(() => {
        const saleCollection = parseFloat(formData.sale_order_collection) || 0;
        const saleBalance = parseFloat(formData.sale_order_balance_amount) || 0;
        const newTotalDayCollection = saleCollection + saleBalance;
        
        const ibo = parseFloat(formData.ibo_420) || 0;
        const decor = parseFloat(formData.decor_uj) || 0; 
        const anil = parseFloat(formData.anil_fed) || 0;
        const remya = parseFloat(formData.remya_fed) || 0;
        const kdb = parseFloat(formData.kdb_186) || 0;
        const kgb = parseFloat(formData.kgb_070) || 0;
        const kiran = parseFloat(formData.kiran_uj) || 0; 
        const cheque = parseFloat(formData.cheque) || 0;
        const newTotalAC = ibo + decor + anil + remya + kdb + kgb + kiran + cheque;
        
        setFormData(prev => ({ 
            ...prev, 
            total_day_collection: newTotalDayCollection > 0 ? String(newTotalDayCollection) : '', 
            total_amount_on_ac: newTotalAC > 0 ? String(newTotalAC) : '' 
        }));
    },[
        formData.sale_order_collection, formData.sale_order_balance_amount, 
        formData.ibo_420, formData.decor_uj, formData.anil_fed, formData.remya_fed,
        formData.kdb_186, formData.kgb_070, formData.kiran_uj, formData.cheque
    ]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.date || !formData.category) {
            toast({ title: "Missing Information", description: "Please ensure Date and Category are filled out.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        
        const payload: DailySalesReportCreatePayload = {
            date: formData.date, 
            total_sales_order: formData.total_sales_order ? parseInt(formData.total_sales_order) : null,
            total_sale_order_amount: parseFloat(formData.total_sale_order_amount) || null,
            sale_order_collection: parseFloat(formData.sale_order_collection) || null,
            sale_order_balance_amount: parseFloat(formData.sale_order_balance_amount) || null,
            total_day_collection: parseFloat(formData.total_day_collection) || null,
            total_amount_on_cash: parseFloat(formData.total_amount_on_cash) || null,
            total_amount_on_ac: parseFloat(formData.total_amount_on_ac) || null,
            ibo_420: parseFloat(formData.ibo_420) || null, decor_uj: parseFloat(formData.decor_uj) || null, 
            anil_fed: parseFloat(formData.anil_fed) || null, remya_fed: parseFloat(formData.remya_fed) || null, 
            kdb_186: parseFloat(formData.kdb_186) || null, kgb_070: parseFloat(formData.kgb_070) || null, 
            kiran_uj: parseFloat(formData.kiran_uj) || null, cheque: parseFloat(formData.cheque) || null,
            expense: parseFloat(formData.expense) || null, category: formData.category || null,
        };
        
        let success = false;
        if (isEditMode) {
            success = await onReportUpdate(reportToEdit!.id, payload as DailySalesReportUpdatePayload);
        } else {
            success = await onReportCreate(payload);
        }
        if (success) { setFormData(initialFormState); }
        setIsSubmitting(false);
    };
    
    // Friendly UI Classes
    const labelClass = "text-sm font-medium text-gray-700 block mb-1.5";
    const inputClass = "h-10 text-base rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500";
    const selectClass = "flex h-10 w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-8">
            
            {/* Step 1: Basic Info */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center p-0">1</Badge>
                    <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
                </div>
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="date" className={labelClass}>Report Date <span className="text-red-500">*</span></label>
                            <Input id="date" type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                            <p className="text-xs text-gray-500 mt-1">Select the date this report is for.</p>
                        </div>
                        <div>
                            <label htmlFor="category" className={labelClass}>Business Category <span className="text-red-500">*</span></label>
                            <select id="category" name="category" value={formData.category} onChange={handleChange} required className={selectClass}>
                                <option value="" disabled>Select a category...</option>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Which part of the business does this cover?</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Step 2: Sales & Collections */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center p-0">2</Badge>
                    <h2 className="text-lg font-semibold text-gray-800">Sales & Cash Collections</h2>
                </div>
                <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sales Block */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-600 border-b pb-2 flex items-center"><ListOrdered className="w-4 h-4 mr-2"/> Today's Orders</h3>
                            <div>
                                <label htmlFor="total_sales_order" className={labelClass}>Number of Orders</label>
                                <Input id="total_sales_order" type="number" name="total_sales_order" placeholder="e.g. 15" value={formData.total_sales_order} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="total_sale_order_amount" className={labelClass}>Total Value of Orders (₹)</label>
                                <Input id="total_sale_order_amount" type="number" name="total_sale_order_amount" placeholder="₹ 0.00" value={formData.total_sale_order_amount} onChange={handleChange} className={inputClass} />
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-dashed">
                                <label htmlFor="expense" className={labelClass}>Today's Expenses (₹)</label>
                                <Input id="expense" type="number" name="expense" placeholder="Any cash spent today?" value={formData.expense} onChange={handleChange} className={`${inputClass} border-red-200 focus:border-red-500 focus:ring-red-500`} />
                            </div>
                        </div>

                        {/* Collections Block */}
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="font-medium text-gray-600 border-b border-gray-200 pb-2 flex items-center"><Calculator className="w-4 h-4 mr-2"/> Collection Breakdown</h3>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label htmlFor="sale_order_collection" className={labelClass}>Collected Today (₹)</label>
                                    <Input id="sale_order_collection" type="number" name="sale_order_collection" placeholder="₹ 0.00" value={formData.sale_order_collection} onChange={handleChange} className={inputClass} />
                                </div>
                                <Plus className="w-5 h-5 text-gray-400 mt-6" />
                                <div className="flex-1">
                                    <label htmlFor="sale_order_balance_amount" className={labelClass}>Balance Left (₹)</label>
                                    <Input id="sale_order_balance_amount" type="number" name="sale_order_balance_amount" placeholder="₹ 0.00" value={formData.sale_order_balance_amount} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                            
                            {/* Visual Math for Total Day Collection */}
                            <div className="bg-green-100 border border-green-300 rounded-lg p-3 flex items-center justify-between mt-2">
                                <span className="text-sm font-semibold text-green-800">Total Day Collection:</span>
                                <span className="text-lg font-bold text-green-900">
                                    ₹ {formData.total_day_collection || "0.00"}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 text-center">(Collected Today + Balance Left = Total Day Collection)</p>

                            <div className="pt-4 mt-2 border-t border-gray-200">
                                <label htmlFor="total_amount_on_cash" className={labelClass}>Amount kept as CASH (₹)</label>
                                <Input id="total_amount_on_cash" type="number" name="total_amount_on_cash" placeholder="₹ 0.00" value={formData.total_amount_on_cash} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Step 3: Bank / AC Breakdown */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center p-0">3</Badge>
                    <h2 className="text-lg font-semibold text-gray-800">Bank & Account Breakdown</h2>
                </div>
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-blue-50 p-3 px-5 border-b border-blue-100 text-sm text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>Enter the money deposited or transferred into each specific bank account. The total will calculate automatically.</p>
                    </div>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div><label className={labelClass}>IBO 420</label><Input type="number" name="ibo_420" placeholder="₹" value={formData.ibo_420} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Decor UJ</label><Input type="number" name="decor_uj" placeholder="₹" value={formData.decor_uj} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Anil Fed</label><Input type="number" name="anil_fed" placeholder="₹" value={formData.anil_fed} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Remya Fed</label><Input type="number" name="remya_fed" placeholder="₹" value={formData.remya_fed} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>KDB 186</label><Input type="number" name="kdb_186" placeholder="₹" value={formData.kdb_186} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>KGB 070</label><Input type="number" name="kgb_070" placeholder="₹" value={formData.kgb_070} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Kiran UJ</label><Input type="number" name="kiran_uj" placeholder="₹" value={formData.kiran_uj} onChange={handleChange} className={inputClass} /></div>
                            <div><label className={labelClass}>Cheque</label><Input type="number" name="cheque" placeholder="₹" value={formData.cheque} onChange={handleChange} className={inputClass} /></div>
                        </div>

                        {/* Visual Math for Total AC */}
                        <div className="mt-6 flex flex-col md:flex-row items-center justify-end gap-4 border-t pt-4">
                            <span className="text-sm text-gray-500 hidden md:inline-block">Sum of all accounts above</span>
                            <ArrowRight className="w-4 h-4 text-gray-300 hidden md:block" />
                            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-center gap-4 w-full md:w-auto justify-between shadow-sm">
                                <span className="text-sm font-semibold text-blue-900">Total in Bank (A/C):</span>
                                <span className="text-xl font-bold text-blue-900">
                                    ₹ {formData.total_amount_on_ac || "0.00"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Submission Area */}
            <Card className="bg-gray-900 text-white shadow-xl">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-400" /> Ready to save?</h3>
                        <p className="text-gray-400 text-sm mt-1">Please double-check your numbers before submitting the daily report.</p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        {isEditMode && (
                            <Button type="button" variant="outline" onClick={onCancelEdit} className="h-12 px-6 bg-transparent border-gray-600 text-gray-200 hover:bg-gray-800 w-full md:w-auto text-base">
                                <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white w-full md:w-auto text-base font-semibold shadow-lg transition-all">
                            {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Data...</> : 
                            isEditMode ? <><Pencil className="mr-2 h-5 w-5" /> Update Report</> : 
                                        <><FileUp className="mr-2 h-5 w-5" /> Submit Daily Report</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};

// =============================================================
// CHILD COMPONENT: DailyReportRegister (History)
// =============================================================
interface DailyReportRegisterProps {
  reports: DailySalesReport[];
  isLoading: boolean;
  onEdit: (report: DailySalesReport) => void;
  onDelete: (id: number) => void;
}

const DailyReportRegister = ({ reports, isLoading, onEdit, onDelete }: DailyReportRegisterProps) => {
    const [dateFilter, setDateFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

    const filteredReports = useMemo(() => {
        let data = [...reports];
        if (dateFilter) {
            data = data.filter(r => r.date && r.date.startsWith(dateFilter));
        }
        if (categoryFilter) {
            data = data.filter(r => r.category === categoryFilter);
        }
        return data.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }, [reports, dateFilter, categoryFilter]);

    const clearFilters = () => {
        setDateFilter("");
        setCategoryFilter("");
    };

    if (isLoading) { 
        return <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}><CardHeader className="py-4 px-6"><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-1/4" /></CardHeader></Card>
            ))}
        </div>; 
    }
    
    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <Filter className="w-5 h-5" />
                    <span>Filter Previous Reports</span>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
                    <Input 
                        type="date" 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)} 
                        className="h-10 text-sm w-full sm:w-40" 
                    />
                    <select 
                        value={categoryFilter} 
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-10 text-sm w-full sm:w-48 rounded-md border border-gray-300 bg-white px-3 py-1 focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        <option value="">All Categories</option>
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    {(dateFilter || categoryFilter) && (
                        <Button variant="ghost" onClick={clearFilters} className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <X className="w-4 h-4 mr-2" /> Clear Filters
                        </Button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredReports.map((report) => {
                    const displayReport = mapApiToComponent(report);
                    const categoryLabel = getCategoryLabel(displayReport.category);

                    return (
                        <Card key={report.id} className="shadow-sm border-gray-200 hover:border-blue-300 transition-colors">
                            <CardHeader className="py-3 px-4 md:px-6">
                                <Collapsible className="group/collapsible"> 
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Left: Date & Category */}
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg flex flex-col items-center justify-center min-w-[80px]">
                                                <Calendar className="w-5 h-5 mb-1" />
                                                <span className="text-sm font-bold">{displayReport.date}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800 text-lg">Daily Report</h3>
                                                {displayReport.category && (
                                                    <Badge variant="secondary" className="mt-1 font-medium bg-gray-100 text-gray-600">
                                                        {categoryLabel}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Summary Pills & Actions */}
                                        <div className="flex items-center flex-wrap gap-2 justify-end">
                                            <div className="hidden md:flex flex-col text-right mr-4">
                                                <span className="text-xs text-gray-500 uppercase font-semibold">Total Day Collection</span>
                                                <span className="text-lg font-bold text-green-700">{formatRupee(displayReport.totalDayCollection)}</span>
                                            </div>
                                            
                                            <CollapsibleTrigger asChild>
                                                <Button variant="outline" className="h-10 text-sm gap-2">
                                                    View Details
                                                    <ChevronDown className="h-4 w-4 group-data-[state=open]/collapsible:rotate-180 transition-transform" />
                                                </Button>
                                            </CollapsibleTrigger>

                                            <Button variant="secondary" size="icon" className="h-10 w-10 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => onEdit(report)} title="Edit Report"><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="destructive" size="icon" className="h-10 w-10" onClick={() => onDelete(report.id)} title="Delete Report"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    
                                    <CollapsibleContent className="mt-4 pt-4 border-t border-gray-100 space-y-6">
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column Details */}
                                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                                <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2"><ListOrdered className="w-4 h-4"/> Sales & Collections Summary</h4>
                                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                                    <div><span className="text-gray-500 block text-xs uppercase mb-0.5">Total Orders</span> <span className="font-medium text-gray-900">{displayReport.totalSaleOrder} NO'S</span></div>
                                                    <div><span className="text-gray-500 block text-xs uppercase mb-0.5">Order Amount</span> <span className="font-medium text-gray-900">{formatRupee(displayReport.totalSaleOrderAmount)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs uppercase mb-0.5">Collection</span> <span className="font-medium text-green-600">{formatRupee(displayReport.saleOrderCollection)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs uppercase mb-0.5">Balance Left</span> <span className="font-medium text-orange-600">{formatRupee(displayReport.saleOrderBalAmount)}</span></div>
                                                </div>
                                            </div>

                                            {/* Right Column Details */}
                                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                                <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2"><DollarSign className="w-4 h-4"/> Cash & Bank Totals</h4>
                                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                                    <div><span className="text-gray-500 block text-xs uppercase mb-0.5">Total Cash Saved</span> <span className="font-medium text-gray-900">{formatRupee(displayReport.totalCash)}</span></div>
                                                    <div><span className="text-gray-500 block text-xs uppercase mb-0.5">Total In Banks (A/C)</span> <span className="font-medium text-blue-700">{formatRupee(displayReport.totalAC)}</span></div>
                                                    <div className="col-span-2 pt-2 border-t border-gray-200 mt-1">
                                                        <span className="text-gray-500 block text-xs uppercase mb-0.5">Total Expenses Spent</span> 
                                                        <span className="font-medium text-red-600 text-base">{formatRupee(displayReport.expense)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Accounts Breakdown Table */}
                                        <div>
                                            <h5 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2"><Landmark className="w-4 h-4" /> Bank Account Breakdown</h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                                                {Object.entries(displayReport.acDetails).map(([key, amount]) => (
                                                    <div key={key} className={`p-2 rounded border ${amount > 0 ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'} text-center`}>
                                                        <span className="text-[10px] text-gray-500 block uppercase font-medium truncate" title={key}>{key}</span> 
                                                        <span className={`text-sm font-semibold mt-1 block ${amount > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{amount > 0 ? formatRupee(amount) : '-'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </CollapsibleContent>
                                </Collapsible>
                            </CardHeader>
                        </Card>
                    )
                })}
                {!isLoading && filteredReports.length === 0 && (
                    <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ListOrdered className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No reports found</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto">There are no reports matching your current filters. Try changing dates or clear the filters.</p>
                        <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================
// MAIN PAGE COMPONENT
// =============================================================
export function AccountantDashboard() {
  const { toast } = useToast()
  const [reportHistory, setReportHistory] = useState<DailySalesReport[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const[editingReport, setEditingReport] = useState<DailySalesReport | null>(null);
  const [activeTab, setActiveTab] = useState("upload"); 

  const fetchReports = async () => {
    setIsLoading(true);
    const response = await getAllDailySalesReports();
    if (response.data) { setReportHistory(response.data); } 
    else { toast({ title: "Error Fetching Reports", description: response.error, variant: "destructive" }); }
    setIsLoading(false);
  };

  useEffect(() => { fetchReports(); },[]);

  const handleCreateReport = async (payload: DailySalesReportCreatePayload): Promise<boolean> => {
    const response = await createDailySalesReport(payload);
    if (response.data) {
      toast({ title: "Success!", description: `Report for ${payload.date} saved perfectly.` });
      fetchReports(); 
      setActiveTab("register"); 
      window.scrollTo(0,0);
      return true;
    }
    toast({ title: "Submission Failed", description: response.error, variant: "destructive" });
    return false;
  };

  const handleUpdateReport = async (id: number, payload: DailySalesReportUpdatePayload): Promise<boolean> => {
    const response = await updateDailySalesReport(id, payload);
    if (response.data) {
      toast({ title: "Updated!", description: `Report for ${payload.date} updated securely.` });
      setEditingReport(null);
      fetchReports(); 
      setActiveTab("register");
      window.scrollTo(0,0);
      return true;
    }
    toast({ title: "Update Failed", description: response.error, variant: "destructive" });
    return false;
  };

  const handleDeleteReport = async (id: number) => {
    if (window.confirm("Are you completely sure you want to delete this report? This cannot be undone.")) {
        const response = await deleteDailySalesReport(id);
        if (response.data) {
            toast({ title: "Deleted", description: "Report has been removed." });
            fetchReports();
        } else {
            toast({ title: "Deletion Failed", description: response.error, variant: "destructive" });
        }
    }
  };
  
  const handleEditClick = (report: DailySalesReport) => {
    setEditingReport(report);
    setActiveTab("upload");
    window.scrollTo(0,0);
  };
  
  const handleCancelEdit = () => {
    setEditingReport(null);
  };
  
  return (
    <DashboardLayout title="Accounts Dashboard" role="accountant">
        <main className="flex-1 overflow-y-auto bg-gray-50/50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                
                {/* Friendly Welcome Banner */}
                <Alert className="mb-8 bg-blue-50 border-blue-200">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-semibold text-base">Welcome to your Accounts Dashboard</AlertTitle>
                    <AlertDescription className="text-blue-700 mt-1">
                        Use the <strong>Submit New Report</strong> tab to record your daily sales, cash collections, and expenses. To view or edit past reports, click on the <strong>History & Records</strong> tab. We handle the math for you!
                    </AlertDescription>
                </Alert>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6"> 
                    
                    <div className="flex justify-center">
                      <TabsList className="bg-gray-200/50 p-1 rounded-xl w-full max-w-md h-12">
                        <TabsTrigger value="upload" className="w-1/2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 font-medium transition-all">
                            {editingReport ? <><Pencil className="w-4 h-4 mr-2" /> Edit Report</> : <><FileUp className="w-4 h-4 mr-2" /> Submit New Report</>}
                        </TabsTrigger>
                        <TabsTrigger value="register" className="w-1/2 text-sm rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 font-medium transition-all">
                            <ListOrdered className="w-4 h-4 mr-2" /> History & Records
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="upload" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <DailyReportUpload 
                            onReportCreate={handleCreateReport} 
                            onReportUpdate={handleUpdateReport}
                            reportToEdit={editingReport}
                            onCancelEdit={handleCancelEdit}
                        />
                    </TabsContent>
                    
                    <TabsContent value="register" className="mt-0 focus-visible:outline-none focus-visible:ring-0 max-w-5xl mx-auto">
                        <DailyReportRegister 
                            reports={reportHistory} 
                            isLoading={isLoading} 
                            onEdit={handleEditClick}
                            onDelete={handleDeleteReport}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
        <Toaster />
    </DashboardLayout>
  )
}