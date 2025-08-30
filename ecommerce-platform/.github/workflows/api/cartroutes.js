const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');
const rateLimitMiddleware = require('../middleware/rateLimit.middleware');

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartReadLimit,
  cartController.getCart
);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post(
  '/',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartWriteLimit,
  validationMiddleware.validateAddToCart,
  cartController.addToCart
);

/**
 * @route   PUT /api/cart/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put(
  '/:itemId',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartWriteLimit,
  validationMiddleware.validateUpdateCart,
  cartController.updateCartItem
);

/**
 * @route   DELETE /api/cart/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete(
  '/:itemId',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartWriteLimit,
  cartController.removeFromCart
);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete(
  '/',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartWriteLimit,
  cartController.clearCart
);

/**
 * @route   GET /api/cart/count
 * @desc    Get cart items count
 * @access  Private
 */
router.get(
  '/count',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartReadLimit,
  cartController.getCartCount
);

/**
 * @route   POST /api/cart/apply-coupon
 * @desc    Apply coupon to cart
 * @access  Private
 */
router.post(
  '/apply-coupon',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartWriteLimit,
  validationMiddleware.validateCoupon,
  cartController.applyCoupon
);

/**
 * @route   DELETE /api/cart/remove-coupon
 * @desc    Remove coupon from cart
 * @access  Private
 */
router.delete(
  '/remove-coupon',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartWriteLimit,
  cartController.removeCoupon
);

/**
 * @route   GET /api/cart/summary
 * @desc    Get cart summary with totals
 * @access  Private
 */
router.get(
  '/summary',
  authMiddleware.verifyToken,
  rateLimitMiddleware.cartReadLimit,
  cartController.getCartSummary
);

// Health check endpoint for CI/CD monitoring
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'cart-service',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route for CI/CD deployment verification
router.get('/deploy-status', (req, res) => {
  res.status(200).json({
    deployed: true,
    environment: process.env.NODE_ENV || 'development',
    deploymentTimestamp: process.env.DEPLOYMENT_TIMESTAMP || new Date().toISOString(),
    commitHash: process.env.COMMIT_HASH || 'unknown'
  });
});

module.exports = router;