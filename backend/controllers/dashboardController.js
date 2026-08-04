const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/order");
const Contact = require("../models/Contact");

/* ========================================
   GET ADMIN DASHBOARD DATA
   GET /api/dashboard
======================================== */

const getDashboardData = async (req, res) => {
    try {
        const now = new Date();

        const chartStartDate = new Date(
            now.getFullYear(),
            now.getMonth() - 5,
            1
        );

        const [
            totalProducts,
            totalUsers,
            totalOrders,
            totalMessages,
            unreadMessages,
            deliveredOrders,
            recentProducts,
            recentOrders,
            recentMessages,
            monthlyOrders,
            orderStatusData
        ] = await Promise.all([
            Product.countDocuments(),

            User.countDocuments(),

            Order.countDocuments(),

            Contact.countDocuments(),

            Contact.countDocuments({
                status: "unread"
            }),

            Order.find({
                orderStatus: "delivered"
            }).select("totalAmount"),

            Product.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select(
                    "name category price stock image createdAt"
                ),

            Order.find()
                .populate(
                    "user",
                    "name email"
                )
                .sort({ createdAt: -1 })
                .limit(5),

            Contact.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select(
                    "name email subject status createdAt"
                ),

            Order.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: chartStartDate
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: {
                                $year: "$createdAt"
                            },
                            month: {
                                $month: "$createdAt"
                            }
                        },

                        orderCount: {
                            $sum: 1
                        },

                        revenue: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$orderStatus",
                                            "delivered"
                                        ]
                                    },
                                    "$totalAmount",
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1
                    }
                }
            ]),

            Order.aggregate([
                {
                    $group: {
                        _id: "$orderStatus",
                        count: {
                            $sum: 1
                        }
                    }
                }
            ])
        ]);

        const totalRevenue = deliveredOrders.reduce(
            (total, order) => {
                return (
                    total +
                    Number(order.totalAmount || 0)
                );
            },
            0
        );

        const pendingOrders =
            await Order.countDocuments({
                orderStatus: "pending"
            });

        const processingOrders =
            await Order.countDocuments({
                orderStatus: "processing"
            });

        const deliveredOrderCount =
            await Order.countDocuments({
                orderStatus: "delivered"
            });

        const monthlyLabels = [];
        const monthlyRevenue = [];
        const monthlyOrderCount = [];

        for (let index = 5; index >= 0; index -= 1) {
            const monthDate = new Date(
                now.getFullYear(),
                now.getMonth() - index,
                1
            );

            const year = monthDate.getFullYear();
            const month = monthDate.getMonth() + 1;

            const matchingMonth = monthlyOrders.find(
                (item) => {
                    return (
                        item._id.year === year &&
                        item._id.month === month
                    );
                }
            );

            monthlyLabels.push(
                monthDate.toLocaleDateString(
                    "en-US",
                    {
                        month: "short",
                        year: "numeric"
                    }
                )
            );

            monthlyRevenue.push(
                Number(
                    matchingMonth?.revenue || 0
                )
            );

            monthlyOrderCount.push(
                Number(
                    matchingMonth?.orderCount || 0
                )
            );
        }

        const statusLabels = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ];

        const statusCounts = statusLabels.map(
            (status) => {
                const matchingStatus =
                    orderStatusData.find(
                        (item) =>
                            item._id === status
                    );

                return Number(
                    matchingStatus?.count || 0
                );
            }
        );

        return res.status(200).json({
            success: true,

            statistics: {
                totalProducts,
                totalUsers,
                totalOrders,
                pendingOrders,
                processingOrders,
                deliveredOrders:
                    deliveredOrderCount,
                totalRevenue,
                totalMessages,
                unreadMessages
            },

            charts: {
                monthlyLabels,
                monthlyRevenue,
                monthlyOrderCount,

                statusLabels,
                statusCounts
            },

            recent: {
                products: recentProducts,
                orders: recentOrders,
                messages: recentMessages
            }
        });
    } catch (error) {
        console.error(
            "Dashboard data error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load dashboard information",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardData
};