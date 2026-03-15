// components/dashboards/sales/SalesReportsTab.tsx
"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Target, ShoppingCart, TrendingUp, BarChart3, Activity, PieChart, Percent, CheckCircle2, Clock } from "lucide-react"
import { type Customer, type Order } from "@/lib/sales"

interface SalesReportsTabProps {
    customers: Customer[]
    orders: Order[]
    totalLeads: number
    hotLeads: number
    warmLeads: number
    convertedLeads: number
    totalOrders: number
    completedOrders: number
    pendingOrders: number
}

// --- Helper Component for Visual Progress Bars ---
const StatBar = ({ label, count, total, colorClass, bgClass }: { label: string, count: number, total: number, colorClass: string, bgClass: string }) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    
    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between items-end mb-1.5">
                <span className={`text-sm font-semibold ${colorClass}`}>{label}</span>
                <div className="text-right">
                    <span className="font-bold text-gray-900">{count}</span>
                    <span className="text-xs text-gray-400 font-medium ml-1.5 w-8 inline-block">({percentage}%)</span>
                </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${bgClass}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export const SalesReportsTab: React.FC<SalesReportsTabProps> = ({
    customers,
    totalLeads,
    hotLeads,
    warmLeads,
    convertedLeads,
    totalOrders,
    completedOrders,
    pendingOrders,
}) => {
    
    // Calculate cold and lost leads dynamically
    const coldLeads = useMemo(() => customers.filter(c => c.status === 'cold').length, [customers]);
    const lostLeads = useMemo(() => customers.filter(c => c.status === 'lost').length, [customers]);

    // Derived Metrics
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0.0';
    const recentGrowth = Math.floor(totalLeads * 0.1); // Mocked for demonstration

    return (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm bg-gray-50/30">
            <CardHeader className="pb-6 border-b px-4 sm:px-6 mb-6 bg-white rounded-t-xl">
                <div>
                    <CardTitle className="flex items-center text-2xl">
                        <BarChart3 className="h-6 w-6 mr-3 text-indigo-600" />
                        Sales Performance Overview
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-gray-500">
                        High-level metrics and visual breakdowns of your leads and order pipeline.
                    </CardDescription>
                </div>
            </CardHeader>
            
            <CardContent className="px-4 sm:px-6 space-y-6">
                
                {/* --- TOP ROW: KPI GLANCE CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* KPI 1: Total Leads */}
                    <Card className="shadow-sm border-blue-100">
                        <CardContent className="p-5 flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Target className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Leads</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-0.5">{totalLeads}</h3>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 2: Conversion Rate */}
                    <Card className="shadow-sm border-green-100">
                        <CardContent className="p-5 flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Percent className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Conversion Rate</p>
                                <div className="flex items-end gap-2 mt-0.5">
                                    <h3 className="text-3xl font-bold text-gray-900">{conversionRate}%</h3>
                                    <span className="text-xs font-medium text-green-600 mb-1.5 flex items-center">
                                        <TrendingUp className="h-3 w-3 mr-0.5" /> +{recentGrowth} recent
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 3: Total Orders */}
                    <Card className="shadow-sm border-purple-100">
                        <CardContent className="p-5 flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <ShoppingCart className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Orders</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-0.5">{totalOrders}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- BOTTOM ROW: DETAILED BREAKDOWNS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Lead Pipeline Visualizer */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2 border-b">
                            <CardTitle className="text-lg flex items-center">
                                <PieChart className="h-5 w-5 mr-2 text-orange-500" /> Lead Pipeline
                            </CardTitle>
                            <CardDescription>Visual distribution of leads across all stages.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-1">
                                <StatBar label="Converted (Won)" count={convertedLeads} total={totalLeads} colorClass="text-green-700" bgClass="bg-green-500" />
                                <StatBar label="Hot Leads" count={hotLeads} total={totalLeads} colorClass="text-red-700" bgClass="bg-red-500" />
                                <StatBar label="Warm Leads" count={warmLeads} total={totalLeads} colorClass="text-orange-700" bgClass="bg-orange-400" />
                                <StatBar label="Cold Leads" count={coldLeads} total={totalLeads} colorClass="text-blue-700" bgClass="bg-blue-400" />
                                <StatBar label="Lost / Dead" count={lostLeads} total={totalLeads} colorClass="text-gray-600" bgClass="bg-gray-400" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Status Visualizer */}
                    <div className="flex flex-col gap-6">
                        <Card className="shadow-sm flex-1">
                            <CardHeader className="pb-2 border-b">
                                <CardTitle className="text-lg flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-indigo-500" /> Order Progress
                                </CardTitle>
                                <CardDescription>Fulfillment status of generated orders.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    {/* Completed Orders Ring/Bar */}
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <div className="mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-1">
                                                <p className="font-semibold text-emerald-900">Completed Orders</p>
                                                <p className="font-bold text-emerald-700 text-lg">{completedOrders} <span className="text-xs font-normal text-emerald-600">({completionRate}%)</span></p>
                                            </div>
                                            <div className="w-full bg-emerald-200/50 rounded-full h-2">
                                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pending Orders Ring/Bar */}
                                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                                        <div className="mt-1"><Clock className="h-6 w-6 text-amber-600" /></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-1">
                                                <p className="font-semibold text-amber-900">Pending Orders</p>
                                                <p className="font-bold text-amber-700 text-lg">{pendingOrders}</p>
                                            </div>
                                            <p className="text-xs text-amber-600/80">Orders currently awaiting fulfillment or payment.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}