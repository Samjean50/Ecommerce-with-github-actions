const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Adjust path to your Express app
const Cart = require('../models/Cart'); // Adjust path to your Cart model
const Product = require('../models/Product'); // Adjust path to your Product model
const User = require('../models/User'); // Adjust path to your User model

describe('Cart API Endpoints', () => {
  let authToken;
  let userId;
  let productId;
  let cartId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test_cart_db');
    
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
        name: 'Test User'
      });
    
    authToken = userResponse.body.token;
    userId = userResponse.body.user._id;

    // Create test product
    const product = await Product.create({
      name: 'Test Product',
      price: 29.99,
      description: 'Test product description',
      stock: 100
    });
    
    productId = product._id;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear cart before each test
    await Cart.deleteMany({});
  });

  describe('POST /api/cart', () => {
    it('should add item to cart successfully', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.items[0].product).toBe(productId.toString());
      expect(response.body.cart.items[0].quantity).toBe(2);
    });

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'invalid-id',
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post('/api/cart')
        .send({
          productId: productId,
          quantity: 1
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cart', () => {
    it('should retrieve user cart successfully', async () => {
      // First add an item to cart
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 3
        });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(1);
      expect(response.body.cart.total).toBe(89.97); // 29.99 * 3
    });

    it('should return empty cart when no items', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cart.items).toHaveLength(0);
      expect(response.body.cart.total).toBe(0);
    });
  });

  describe('PUT /api/cart/:itemId', () => {
    it('should update cart item quantity successfully', async () => {
      // Add item first
      const addResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 1
        });

      const itemId = addResponse.body.cart.items[0]._id;

      const response = await request(app)
        .put(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items[0].quantity).toBe(5);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/cart/invalid-item-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/cart/:itemId', () => {
    it('should remove item from cart successfully', async () => {
      // Add item first
      const addResponse = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 1
        });

      const itemId = addResponse.body.cart.items[0]._id;

      const response = await request(app)
        .delete(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear entire cart successfully', async () => {
      // Add multiple items first
      await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: 2
        });

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart.items).toHaveLength(0);
    });
  });

  // Edge cases and error handling
  describe('Error Handling', () => {
    it('should handle out of stock products', async () => {
      // Create a product with low stock
      const lowStockProduct = await Product.create({
        name: 'Low Stock Product',
        price: 9.99,
        description: 'Low stock test product',
        stock: 1
      });

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: lowStockProduct._id,
          quantity: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('insufficient stock');
    });

    it('should handle invalid quantity values', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          quantity: -1
        });

      expect(response.status).toBe(400);
    });
  });

  // Performance test (optional for CI/CD)
  describe('Performance', () => {
    it('should handle multiple cart operations within acceptable time', async () => {
      const startTime = Date.now();

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            productId: productId,
            quantity: 1
          });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});