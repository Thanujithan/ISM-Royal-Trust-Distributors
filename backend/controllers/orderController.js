const mongoose = require("mongoose");

const Order = require("../models/order");
const Product = require("../models/Product");

const DEFAULT_WHOLESALE_MINIMUM = 20;


/* ========================================
   PRICE HELPERS
======================================== */

function getProductRetailPrice(product) {
    const retailPrice = Number(
        product.retailPrice ??
        product.price ??
        0
    );

    return Number.isNaN(retailPrice)
        ? 0
        : retailPrice;
}


function getProductWholesalePrice(
    product,
    retailPrice
) {
    const wholesalePrice = Number(
        product.wholesalePrice ??
        retailPrice
    );

    return Number.isNaN(wholesalePrice)
        ? retailPrice
        : wholesalePrice;
}


function getWholesaleMinimumQuantity(product) {
    const minimumQuantity = Number(
        product.wholesaleMinimumQuantity ??
        DEFAULT_WHOLESALE_MINIMUM
    );

    return (
        Number.isInteger(minimumQuantity) &&
        minimumQuantity >= 1
    )
        ? minimumQuantity
        : DEFAULT_WHOLESALE_MINIMUM;
}


function calculateProductPricing(
    product,
    quantity
) {
    const retailPrice =
        getProductRetailPrice(product);

    const wholesalePrice =
        getProductWholesalePrice(
            product,
            retailPrice
        );

    const wholesaleMinimumQuantity =
        getWholesaleMinimumQuantity(
            product
        );

    const isWholesale =
        quantity >=
        wholesaleMinimumQuantity;

    const appliedPrice =
        isWholesale
            ? wholesalePrice
            : retailPrice;

    return {
        retailPrice,
        wholesalePrice,
        wholesaleMinimumQuantity,
        appliedPrice,

        priceType:
            isWholesale
                ? "wholesale"
                : "retail"
    };
}


/* ========================================
   CREATE ORDER
   POST /api/orders
======================================== */

const createOrder = async (
    req,
    res
) => {
    try {
        const {
            customer,
            deliveryAddress,
            deliveryNote,
            items,
            paymentMethod
        } = req.body;


        /* -------------------------------
           CUSTOMER VALIDATION
        -------------------------------- */

        if (
            !customer?.name ||
            !customer?.email ||
            !customer?.phone
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Customer details are required"
            });
        }


        /* -------------------------------
           ADDRESS VALIDATION
        -------------------------------- */

        if (
            !deliveryAddress?.streetAddress ||
            !deliveryAddress?.city ||
            !deliveryAddress?.district ||
            !deliveryAddress?.postalCode
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Complete delivery address is required"
            });
        }


        /* -------------------------------
           ITEM VALIDATION
        -------------------------------- */

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Order must contain at least one product"
            });
        }


        /* -------------------------------
           PAYMENT METHOD
        -------------------------------- */

        if (
            ![
                "cash_on_delivery",
                "bank_transfer"
            ].includes(paymentMethod)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });
        }


        const orderItems = [];

        let subtotal = 0;


        /* ========================================
           BUILD ORDER ITEMS
        ======================================== */

        for (const item of items) {

            /* -------------------------------
               PRODUCT ID
            -------------------------------- */

            if (
                !item.product ||
                !mongoose.Types.ObjectId.isValid(
                    item.product
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product ID"
                });
            }


            /* -------------------------------
               QUANTITY
            -------------------------------- */

            const quantity =
                Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid product quantity"
                });
            }


            /* -------------------------------
               LOAD PRODUCT
            -------------------------------- */

            const product =
                await Product.findById(
                    item.product
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message:
                        "A selected product was not found"
                });
            }


            /* -------------------------------
               AVAILABILITY
            -------------------------------- */

            if (
                product.isAvailable === false ||
                product.status === "inactive"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.name} is not available`
                });
            }


            /* -------------------------------
               STOCK
            -------------------------------- */

            if (
                Number(product.stock) <
                quantity
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${product.stock} ${product.name} items are available`
                });
            }


            /* -------------------------------
               RETAIL / WHOLESALE PRICE
            -------------------------------- */

            const pricing =
                calculateProductPricing(
                    product,
                    quantity
                );

            if (
                pricing.retailPrice < 0 ||
                pricing.wholesalePrice < 0 ||
                pricing.appliedPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.name} has invalid pricing`
                });
            }


            /* -------------------------------
               ITEM TOTAL
            -------------------------------- */

            const itemTotal =
                pricing.appliedPrice *
                quantity;

            subtotal +=
                itemTotal;


            /* ========================================
               ORDER ITEM SNAPSHOT

               Important:
               product name, image, net content
               and prices are copied into order.
            ======================================== */

            orderItems.push({
                product:
                    product._id,

                name:
                    product.name,

                image:
                    product.image || "",

                /*
                ========================================
                NET CONTENT SNAPSHOT
                ========================================
                */

                netContent:
                    product.netContent
                        ? String(
                              product.netContent
                          ).trim()
                        : "",

                /*
                Existing admin invoice,
                My Orders and old UI may
                still use price.
                */

                price:
                    pricing.appliedPrice,

                retailPrice:
                    pricing.retailPrice,

                wholesalePrice:
                    pricing.wholesalePrice,

                wholesaleMinimumQuantity:
                    pricing
                        .wholesaleMinimumQuantity,

                appliedPrice:
                    pricing.appliedPrice,

                priceType:
                    pricing.priceType,

                quantity
            });
        }


        /* ========================================
           ORDER TOTALS
        ======================================== */

        const deliveryFee = 0;

        const totalAmount =
            subtotal +
            deliveryFee;


        /* ========================================
           CREATE ORDER
        ======================================== */

        const order =
            await Order.create({
                user:
                    req.user.id,

                customer: {
                    name:
                        String(
                            customer.name
                        ).trim(),

                    email:
                        String(
                            customer.email
                        )
                            .trim()
                            .toLowerCase(),

                    phone:
                        String(
                            customer.phone
                        ).trim()
                },

                deliveryAddress: {
                    streetAddress:
                        String(
                            deliveryAddress
                                .streetAddress
                        ).trim(),

                    city:
                        String(
                            deliveryAddress.city
                        ).trim(),

                    district:
                        String(
                            deliveryAddress
                                .district
                        ).trim(),

                    postalCode:
                        String(
                            deliveryAddress
                                .postalCode
                        ).trim()
                },

                deliveryNote:
                    deliveryNote
                        ? String(
                              deliveryNote
                          ).trim()
                        : "",

                items:
                    orderItems,

                subtotal,

                deliveryFee,

                totalAmount,

                paymentMethod,

                paymentStatus:
                    "pending",

                orderStatus:
                    "pending"
            });


        /* ========================================
           REDUCE PRODUCT STOCK
        ======================================== */

        for (
            const item of orderItems
        ) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        stock:
                            -item.quantity
                    }
                }
            );
        }


        return res.status(201).json({
            success: true,
            message:
                "Order placed successfully",

            data:
                order
        });

    } catch (error) {
        console.error(
            "Create order error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to place order",

            error:
                error.message
        });
    }
};


/* ========================================
   GET LOGGED-IN USER ORDERS
   GET /api/orders/my-orders
======================================== */

const getMyOrders = async (
    req,
    res
) => {
    try {
        const orders =
            await Order.find({
                user:
                    req.user.id
            })
                .populate(
                    "items.product",
                    [
                        "name",
                        "image",
                        "category",
                        "netContent",
                        "price",
                        "retailPrice",
                        "wholesalePrice",
                        "wholesaleMinimumQuantity"
                    ].join(" ")
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({
            success: true,

            count:
                orders.length,

            data:
                orders
        });

    } catch (error) {
        console.error(
            "Get my orders error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to load your orders",

            error:
                error.message
        });
    }
};


/* ========================================
   GET SINGLE ORDER
   GET /api/orders/:id
======================================== */

const getOrderById = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order ID"
            });
        }


        const order =
            await Order.findById(id)
                .populate(
                    "items.product",
                    [
                        "name",
                        "image",
                        "category",
                        "netContent",
                        "price",
                        "retailPrice",
                        "wholesalePrice",
                        "wholesaleMinimumQuantity"
                    ].join(" ")
                )
                .populate(
                    "user",
                    "name email role"
                );


        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }


        const orderUserId =
            order.user?._id ||
            order.user;


        const isOwner =
            String(orderUserId) ===
            String(req.user.id);


        const isAdmin =
            String(
                req.user.role || ""
            ).toLowerCase() ===
            "admin";


        if (
            !isOwner &&
            !isAdmin
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You cannot view this order"
            });
        }


        return res.status(200).json({
            success: true,

            data:
                order
        });

    } catch (error) {
        console.error(
            "Get order error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to load order",

            error:
                error.message
        });
    }
};


/* ========================================
   GET ALL ORDERS - ADMIN
   GET /api/orders
======================================== */

const getAllOrders = async (
    req,
    res
) => {
    try {
        const orders =
            await Order.find()
                .populate(
                    "user",
                    "name email role"
                )
                .populate(
                    "items.product",
                    [
                        "name",
                        "image",
                        "category",
                        "netContent",
                        "price",
                        "retailPrice",
                        "wholesalePrice",
                        "wholesaleMinimumQuantity"
                    ].join(" ")
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({
            success: true,

            count:
                orders.length,

            data:
                orders
        });

    } catch (error) {
        console.error(
            "Get all orders error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to load orders",

            error:
                error.message
        });
    }
};


/* ========================================
   UPDATE ORDER STATUS - ADMIN
   PUT /api/orders/:id/status
======================================== */

const updateOrderStatus = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;


        const {
            orderStatus,
            paymentStatus
        } = req.body;


        /* -------------------------------
           ID
        -------------------------------- */

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order ID"
            });
        }


        /* -------------------------------
           VALID STATUS VALUES
        -------------------------------- */

        const allowedOrderStatuses = [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled"
        ];


        const allowedPaymentStatuses = [
            "pending",
            "paid",
            "failed"
        ];


        if (
            orderStatus &&
            !allowedOrderStatuses.includes(
                orderStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order status"
            });
        }


        if (
            paymentStatus &&
            !allowedPaymentStatuses.includes(
                paymentStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment status"
            });
        }


        /* -------------------------------
           FIND ORDER
        -------------------------------- */

        const order =
            await Order.findById(id);


        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }


        /* -------------------------------
           UPDATE ORDER STATUS
        -------------------------------- */

        if (
            orderStatus &&
            orderStatus !==
                order.orderStatus
        ) {
            order.orderStatus =
                orderStatus;


            order.statusHistory.push({
                status:
                    orderStatus,

                changedAt:
                    new Date()
            });
        }


        /* -------------------------------
           PAYMENT STATUS
        -------------------------------- */

        if (
            paymentStatus
        ) {
            order.paymentStatus =
                paymentStatus;
        }


        await order.save();


        return res.status(200).json({
            success: true,

            message:
                "Order updated successfully",

            data:
                order
        });

    } catch (error) {
        console.error(
            "Update order error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to update order",

            error:
                error.message
        });
    }
};


/* ========================================
   CANCEL USER ORDER
   PUT /api/orders/:id/cancel
======================================== */

const cancelMyOrder = async (
    req,
    res
) => {
    try {
        const { id } =
            req.params;


        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order ID"
            });
        }


        /* -------------------------------
           FIND USER ORDER
        -------------------------------- */

        const order =
            await Order.findOne({
                _id:
                    id,

                user:
                    req.user.id
            });


        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }


        /* -------------------------------
           CANCELLATION RULE
        -------------------------------- */

        if (
            ![
                "pending",
                "confirmed"
            ].includes(
                order.orderStatus
            )
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "This order can no longer be cancelled"
            });
        }


        /* -------------------------------
           CANCEL ORDER
        -------------------------------- */

        order.orderStatus =
            "cancelled";


        order.statusHistory.push({
            status:
                "cancelled",

            changedAt:
                new Date()
        });


        await order.save();


        /* ========================================
           RESTORE STOCK

           Cancel செய்த order stock-ஐ
           product stock-க்கு மீண்டும் add பண்ணும்.
        ======================================== */

        for (
            const item of order.items
        ) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        stock:
                            Number(
                                item.quantity ||
                                0
                            )
                    }
                }
            );
        }


        return res.status(200).json({
            success: true,

            message:
                "Order cancelled successfully",

            data:
                order
        });

    } catch (error) {
        console.error(
            "Cancel order error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to cancel order",

            error:
                error.message
        });
    }
};


/* ========================================
   EXPORTS
======================================== */

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder
};