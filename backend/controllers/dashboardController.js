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
            orderStatusData,
            lowStockProducts,
            outOfStockProducts
        ] = await Promise.all([


            /* ========================================
               TOTAL PRODUCTS
            ======================================== */

            Product.countDocuments(),


            /* ========================================
               TOTAL USERS
            ======================================== */

            User.countDocuments(),


            /* ========================================
               TOTAL ORDERS
            ======================================== */

            Order.countDocuments(),


            /* ========================================
               TOTAL CONTACT MESSAGES
            ======================================== */

            Contact.countDocuments(),


            /* ========================================
               UNREAD MESSAGES
            ======================================== */

            Contact.countDocuments({
                status: "unread"
            }),


            /* ========================================
               DELIVERED ORDERS FOR REVENUE
            ======================================== */

            Order.find({
                orderStatus: "delivered"
            })
                .select(
                    "totalAmount"
                ),


            /* ========================================
               RECENT PRODUCTS
            ======================================== */

            Product.find()
                .sort({
                    createdAt: -1
                })
                .limit(5)
                .select(
                    [
                        "name",
                        "category",
                        "price",
                        "retailPrice",
                        "wholesalePrice",
                        "stock",
                        "image",
                        "createdAt"
                    ].join(" ")
                ),


            /* ========================================
               RECENT ORDERS
            ======================================== */

            Order.find()
                .populate(
                    "user",
                    "name email"
                )
                .sort({
                    createdAt: -1
                })
                .limit(5),


            /* ========================================
               RECENT MESSAGES
            ======================================== */

            Contact.find()
                .sort({
                    createdAt: -1
                })
                .limit(5)
                .select(
                    [
                        "name",
                        "email",
                        "subject",
                        "status",
                        "createdAt"
                    ].join(" ")
                ),


            /* ========================================
               MONTHLY ORDERS + REVENUE
            ======================================== */

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


            /* ========================================
               ORDER STATUS COUNTS
            ======================================== */

            Order.aggregate([
                {
                    $group: {
                        _id:
                            "$orderStatus",

                        count: {
                            $sum: 1
                        }
                    }
                }
            ]),


            /* ========================================
               LOW STOCK PRODUCTS
               Stock 1 - 10
            ======================================== */

            Product.find({
                stock: {
                    $gte: 1,
                    $lte: 10
                }
            })
                .sort({
                    stock: 1,
                    createdAt: -1
                })
                .select(
                    [
                        "name",
                        "category",
                        "stock",
                        "image",
                        "price",
                        "retailPrice",
                        "wholesalePrice",
                        "netContent",
                        "createdAt"
                    ].join(" ")
                ),


            /* ========================================
               OUT OF STOCK PRODUCTS
               Stock = 0
            ======================================== */

            Product.find({
                stock: 0
            })
                .sort({
                    createdAt: -1
                })
                .select(
                    [
                        "name",
                        "category",
                        "stock",
                        "image",
                        "price",
                        "retailPrice",
                        "wholesalePrice",
                        "netContent",
                        "createdAt"
                    ].join(" ")
                )
        ]);


        /* ========================================
           TOTAL REVENUE
           Delivered orders only
        ======================================== */

        const totalRevenue =
            deliveredOrders.reduce(
                (total, order) => {

                    return (
                        total +
                        Number(
                            order.totalAmount ||
                            0
                        )
                    );
                },
                0
            );


        /* ========================================
           ORDER STATUS COUNTS
        ======================================== */

        const pendingOrders =
            await Order.countDocuments({
                orderStatus:
                    "pending"
            });


        const processingOrders =
            await Order.countDocuments({
                orderStatus:
                    "processing"
            });


        const deliveredOrderCount =
            await Order.countDocuments({
                orderStatus:
                    "delivered"
            });


        /* ========================================
           MONTHLY CHART DATA
        ======================================== */

        const monthlyLabels = [];

        const monthlyRevenue = [];

        const monthlyOrderCount = [];


        for (
            let index = 5;
            index >= 0;
            index -= 1
        ) {

            const monthDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth() - index,
                    1
                );


            const year =
                monthDate.getFullYear();


            const month =
                monthDate.getMonth() + 1;


            const matchingMonth =
                monthlyOrders.find(
                    (item) => {

                        return (
                            item._id.year ===
                                year &&

                            item._id.month ===
                                month
                        );
                    }
                );


            monthlyLabels.push(
                monthDate.toLocaleDateString(
                    "en-US",
                    {
                        month:
                            "short",

                        year:
                            "numeric"
                    }
                )
            );


            monthlyRevenue.push(
                Number(
                    matchingMonth
                        ?.revenue ||
                    0
                )
            );


            monthlyOrderCount.push(
                Number(
                    matchingMonth
                        ?.orderCount ||
                    0
                )
            );
        }


        /* ========================================
           ORDER STATUS CHART
        ======================================== */

        const statusLabels = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ];


        const statusCounts =
            statusLabels.map(
                (status) => {

                    const matchingStatus =
                        orderStatusData.find(
                            (item) => {

                                return (
                                    item._id ===
                                    status
                                );
                            }
                        );


                    return Number(
                        matchingStatus
                            ?.count ||
                        0
                    );
                }
            );


        /* ========================================
           RESPONSE
        ======================================== */

        return res
            .status(200)
            .json({

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

                    unreadMessages,


                    /* =========================
                       INVENTORY COUNTS
                    ========================= */

                    lowStockCount:
                        lowStockProducts.length,

                    outOfStockCount:
                        outOfStockProducts.length
                },


                charts: {

                    monthlyLabels,

                    monthlyRevenue,

                    monthlyOrderCount,

                    statusLabels,

                    statusCounts
                },


                recent: {

                    products:
                        recentProducts,

                    orders:
                        recentOrders,

                    messages:
                        recentMessages
                },


                /* ========================================
                   INVENTORY
                ======================================== */

                inventory: {

                    lowStockProducts,

                    outOfStockProducts
                }
            });


    } catch (error) {

        console.error(
            "Dashboard data error:",
            error
        );


        return res
            .status(500)
            .json({

                success: false,

                message:
                    "Unable to load dashboard information",

                error:
                    error.message
            });
    }
};


module.exports = {
    getDashboardData
};