// cart.controllers.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name price images stock')
      .lean();

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          total: 0,
          totalItems: 0
        }
      });
    }

    // Calculate totals
    const cartWithTotals = calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      data: cartWithTotals
    });
  } catch (error) {
    logger.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cart'
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Private
 */
const addToCart = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId, quantity } = req.body;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available',
        availableStock: product.stock
      });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    // Create new cart if it doesn't exist
    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: []
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check if new quantity exceeds stock
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'Requested quantity exceeds available stock',
          availableStock: product.stock,
          currentInCart: cart.items[existingItemIndex].quantity
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();

    // Populate product details for response
    await cart.populate('items.product', 'name price images stock');

    const cartWithTotals = calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartWithTotals
    });
  } catch (error) {
    logger.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding item to cart'
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/items/:itemId
 * @access  Private
 */
const updateCartItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { quantity } = req.body;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Get product to check stock
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock',
        availableStock: product.stock
      });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.product', 'name price images stock');

    const cartWithTotals = calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: cartWithTotals
    });
  } catch (error) {
    logger.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating cart item'
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:itemId
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate('items.product', 'name price images stock');

    const cartWithTotals = calculateCartTotals(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
      data: cartWithTotals
    });
  } catch (error) {
    logger.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing item from cart'
    });
  }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        total: 0,
        totalItems: 0
      }
    });
  } catch (error) {
    logger.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing cart'
    });
  }
};

/**
 * @desc    Calculate cart totals
 * @param   {Object} cart - Cart document
 * @returns {Object} Cart with calculated totals
 */
const calculateCartTotals = (cart) => {
  let total = 0;
  let totalItems = 0;

  if (cart.items && cart.items.length > 0) {
    cart.items.forEach(item => {
      const itemTotal = item.product.price * item.quantity;
      total += itemTotal;
      totalItems += item.quantity;
    });
  }

  return {
    ...cart,
    total: parseFloat(total.toFixed(2)),
    totalItems
  };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};