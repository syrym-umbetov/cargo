"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
// Get analytics data
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Build date filter
        const dateFilter = startDate && endDate
            ? {
                arrivalDate: {
                    gte: String(startDate),
                    lte: String(endDate)
                }
            }
            : {};
        // Use Prisma aggregation for summary stats - much faster!
        const [summaryStats, uniqueClientsCount, topClientsData, monthlyStats] = await Promise.all([
            // Summary aggregation
            index_1.prisma.item.aggregate({
                where: dateFilter,
                _sum: {
                    amountKzt: true,
                    costPrice: true,
                    weight: true,
                    margin: true
                },
                _avg: {
                    margin: true
                },
                _count: true
            }),
            // Unique clients count
            index_1.prisma.item.findMany({
                where: dateFilter,
                select: { clientId: true },
                distinct: ['clientId']
            }),
            // Top 5 clients by revenue
            index_1.prisma.item.groupBy({
                by: ['clientId'],
                where: dateFilter,
                _sum: {
                    amountKzt: true
                },
                _count: true,
                orderBy: {
                    _sum: {
                        amountKzt: 'desc'
                    }
                },
                take: 5
            }),
            // Get items for monthly data (we still need this for grouping by month)
            index_1.prisma.item.findMany({
                where: dateFilter,
                select: {
                    arrivalDate: true,
                    amountKzt: true,
                    costPrice: true
                }
            })
        ]);
        // Get client details for top clients
        const topClientIds = topClientsData.map(c => c.clientId);
        const clients = await index_1.prisma.client.findMany({
            where: { id: { in: topClientIds } },
            select: { id: true, name: true, clientCode: true }
        });
        const clientMap = new Map(clients.map(c => [c.id, c]));
        const topClients = topClientsData.map(item => {
            const client = clientMap.get(item.clientId);
            return {
                clientId: item.clientId,
                clientName: client?.name || 'Unknown',
                clientCode: client?.clientCode || 'Unknown',
                revenue: item._sum.amountKzt || 0,
                itemsCount: item._count
            };
        });
        // Calculate monthly data
        const revenueByMonth = monthlyStats.reduce((acc, item) => {
            const date = new Date(item.arrivalDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: monthKey,
                    revenue: 0,
                    profit: 0,
                    itemsCount: 0
                };
            }
            acc[monthKey].revenue += item.amountKzt || 0;
            acc[monthKey].profit += (item.amountKzt || 0) - (item.costPrice || 0);
            acc[monthKey].itemsCount += 1;
            return acc;
        }, {});
        const monthlyData = Object.values(revenueByMonth)
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);
        const totalRevenue = summaryStats._sum.amountKzt || 0;
        const totalCost = summaryStats._sum.costPrice || 0;
        const totalProfit = totalRevenue - totalCost;
        res.json({
            summary: {
                totalRevenue,
                totalCost,
                totalProfit,
                averageMargin: summaryStats._avg.margin || 0,
                totalItems: summaryStats._count,
                totalWeight: summaryStats._sum.weight || 0,
                uniqueClients: uniqueClientsCount.length
            },
            topClients,
            monthlyData
        });
    }
    catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map