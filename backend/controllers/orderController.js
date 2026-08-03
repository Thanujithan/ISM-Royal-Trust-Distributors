const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/Product");

/*
========================================
Create Order
POST /api/orders
========================================
*/

const createOrder = async (req, res) => {
    try {
        const {
            customer,
            deliveryAddress,
            deliveryNote,
            items,
            paymentMethod
        } = req.body;

        if (
            !customer?.name ||
            !customer?.email ||
            !customer?.phone
        ) {
            return res.status(400).json({
                success: false,
                message: "Customer details are required"
            });
        }

        if (
            !deliveryAddress?.streetAddress ||
            !deliveryAddress?.city ||
            !deliveryAddress?.district ||
            !deliveryAddress?.postalCode
        ) {
            return res.status(400).json({
                success: false,
                message: "Complete delivery address is required"
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order must contain at least one product"
            });
        }

        if (
            ![
                "cash_on_delivery",
                "bank_transfer"
            ].includes(paymentMethod)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        const orderItems = [];
        let subtotal = 0;

        for (const item of items) {
            if (
                !item.product ||
                !mongoose.Types.ObjectId.isValid(item.product)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID"
                });
            }

            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product quantity"
                });
            }

            const product = await Product.findById(
                item.product
            );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "A selected product was not found"
                });
            }

            if (
                product.isAvailable === false ||
                product.status === "inactive"
            ) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} is not available`
                });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${product.stock} ${product.name} items are available`
                });
            }

            const price = Number(product.price);

            subtotal += price * quantity;

            orderItems.push({
                product: product._id,
                name: product.name,
                image: product.image,
                price,
                quantity
            });
        }

        const deliveryFee = 0;
        const totalAmount = subtotal + deliveryFee;

        const order = await Order.create({
            user: req.user.id,

            customer: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            },

            deliveryAddress: {
                streetAddress:
                    deliveryAddress.streetAddress,

                city:
                    deliveryAddress.city,

                district:
                    deliveryAddress.district,

                postalCode:
                    deliveryAddress.postalCode
            },

            deliveryNote:
                deliveryNote || "",

            items:
                orderItems,

            subtotal,
            deliveryFee,
            totalAmount,

            paymentMethod,

            paymentStatus:
                paymentMethod === "cash_on_delivery"
                    ? "pending"
                    : "pending",

            orderStatus:
                "pending"
        });

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        stock: -item.quantity
                    }
                }
            );
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: order
        });

    } catch (error) {
        console.error("Create order error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to place order",
            error: error.message
        });
    }
};

/*
========================================
Get Logged-in User Orders
GET /api/orders/my-orders
========================================
*/

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id
        })
            .populate(
                "items.product",
                "name image category"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get my orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load your orders",
            error: error.message
        });
    }
};

/*
========================================
Get Single User Order
GET /api/orders/:id
========================================
*/

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(id)
            .populate(
                "items.product",
                "name image category"
            )
            .populate(
                "user",
                "name email role"
            );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const isOwner =
            String(order.user._id) ===
            String(req.user.id);

        const isAdmin =
            req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You cannot view this order"
            });
        }

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error("Get order error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load order",
            error: error.message
        });
    }
};

/*
========================================
Get All Orders - Admin
GET /api/orders
========================================
*/

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate(
                "user",
                "name email role"
            )
            .populate(
                "items.product",
                "name image category"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get all orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load orders",
            error: error.message
        });
    }
};

/*
========================================
Update Order Status - Admin
PUT /api/orders/:id/status
========================================
*/

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            orderStatus,
            paymentStatus
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

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
            !allowedOrderStatuses.includes(orderStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
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
                message: "Invalid payment status"
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            orderStatus &&
            orderStatus !== order.orderStatus
        ) {
            order.orderStatus = orderStatus;

            order.statusHistory.push({
                status: orderStatus,
                changedAt: new Date()
            });
        }

        if (paymentStatus) {
            order.paymentStatus = paymentStatus;
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: order
        });

    } catch (error) {
        console.error("Update order error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update order",
            error: error.message
        });
    }
};

/*
========================================
Cancel User Order
PUT /api/orders/:id/cancel
========================================
*/

const cancelMyOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: id,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            ![
                "pending",
                "confirmed"
            ].includes(order.orderStatus)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This order can no longer be cancelled"
            });
        }

        order.orderStatus = "cancelled";

        order.statusHistory.push({
            status: "cancelled",
            changedAt: new Date()
        });

        await order.save();

        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        stock: item.quantity
                    }
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: order
        });

    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel order",
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder
};