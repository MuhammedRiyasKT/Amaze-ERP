"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Target, ShoppingCart, Activity, User, Clock, ArrowRight } from "lucide-react"
import { type Customer, type Order, type RealCustomer } from "@/lib/sales"

interface SalesActivitiesTabProps {
    customers: Customer[]
    orders: Order[]
    realCustomers: RealCustomer[]
    getStatusColor: (status: string) => string
    getOrderStatusColor: (status: string) => string
}

// Helper: Format date nicely (e.g., "Oct 12, 2023 at 2:30 PM")
const formatActivityDate = (dateObj: Date) => {
    return dateObj.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export const SalesActivitiesTab: React.FC<SalesActivitiesTabProps> = ({
    customers,
    orders,
    realCustomers,
    getStatusColor,
    getOrderStatusColor
}) => {
    const allKnownCustomers: (Customer | RealCustomer)[] = [...customers, ...realCustomers];

    // --- Data Processing: Combine and Sort Chronologically ---
    const activities = useMemo(() => {
        const combined =[];

        // 1. Process Leads
        customers.forEach(lead => {
            combined.push({
                id: `lead-${lead.id}`,
                type: 'lead',
                title: 'New Lead Added',
                entityName: lead.customer_name,
                subtitle: lead.mobile_number ? `Contact: ${lead.mobile_number}` : 'No phone number provided',
                date: new Date(lead.created_on),
                status: lead.status,
                staff: lead.created_by_staff_name || 'System Auto',
                colorClass: getStatusColor(lead.status)
            });
        });

        // 2. Process Orders
        orders.forEach(order => {
            const customer = allKnownCustomers.find(c => c.id === order.customer_id);
            combined.push({
                id: `order-${order.id}`,
                type: 'order',
                title: `Order #${order.id} Placed`,
                entityName: customer?.customer_name || 'Unknown Customer',
                subtitle: `Amount: ₹${(order.total_amount || order.amount || 0).toLocaleString('en-IN')}`,
                date: new Date(order.created_on),
                status: order.status || 'pending',
                staff: order.created_by_staff_name || 'System Auto',
                colorClass: getOrderStatusColor(order.status || 'pending')
            });
        });

        // 3. Sort by Date Descending (Newest first) and limit to last 15 items
        return combined.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);
    },[customers, orders, allKnownCustomers, getStatusColor, getOrderStatusColor]);

    return (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="pb-6 border-b px-4 sm:px-6 mb-6">
                <CardTitle className="flex items-center text-2xl">
                    <Activity className="h-6 w-6 mr-3 text-purple-600" />
                    Activity Log
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-gray-500">
                    A chronological timeline of recently added leads and newly created orders.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-8">
                
                {activities.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900">No recent activity</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                            Actions like creating a new lead or converting a customer to an order will appear here in a timeline format.
                        </p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-gray-200 ml-4 md:ml-6 space-y-8 pb-4">
                        {activities.map((activity, index) => {
                            const isLead = activity.type === 'lead';
                            const Icon = isLead ? Target : ShoppingCart;
                            const iconBgClass = isLead ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600';

                            return (
                                <div key={activity.id} className="relative pl-8 md:pl-10 group">
                                    
                                    {/* Timeline Node (Icon on the line) */}
                                    <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${iconBgClass}`}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>

                                    {/* Activity Card */}
                                    <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            
                                            {/* Left content: Titles & Meta */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-base">
                                                        {activity.title}
                                                    </h4>
                                                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="font-medium text-gray-700">
                                                        {activity.entityName}
                                                    </span>
                                                </div>
                                                
                                                <p className="text-sm text-gray-500 mb-3">
                                                    {activity.subtitle}
                                                </p>
                                                
                                                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500">
                                                    <span className="flex items-center">
                                                        <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                        {activity.staff}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                                        {formatActivityDate(activity.date)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right content: Status Badge */}
                                            <div className="flex-shrink-0 mt-2 sm:mt-0">
                                                <Badge className={`uppercase tracking-wide text-[10px] font-bold px-2.5 py-1 ${activity.colorClass}`}>
                                                    {activity.status.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            );
                        })}

                        {/* Fading bottom indicator */}
                        <div className="absolute -bottom-4 -left-1.5 h-3 w-3 rounded-full bg-gray-200"></div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}