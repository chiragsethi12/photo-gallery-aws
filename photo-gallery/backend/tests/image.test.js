// tests/image.test.js - Integration tests for Image uploading, paginated fetches, and ownership checks
const request = require('supertest');
const Image = require('../models/Image');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock Cloudinary SDK
jest.mock('cloudinary', () => {
  return {
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn((options, callback) => {
          const { Writable } = require('stream');
          const mockStream = new Writable({
            write(chunk, encoding, next) {
              next();
            },
          });
          // Wait briefly, then trigger the callback on stream finish
          mockStream.on('finish', () => {
            callback(null, {
              public_id: 'photo-gallery/mock-id',
              secure_url: 'https://res.cloudinary.com/mock/image.png',
              width: 800,
              height: 600,
              format: 'png',
            });
          });
          return mockStream;
        }),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
      },
    },
  };
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Image Endpoints', () => {
  let app;
  let userA, userB;
  let tokenA, tokenB;

  beforeAll(() => {
    app = require('../server');
  });

  beforeEach(async () => {
    // Create test users
    userA = await User.create({
      name: 'User A',
      email: 'usera@example.com',
      passwordHash: 'hashedpwd',
    });
    tokenA = generateToken(userA);

    userB = await User.create({
      name: 'User B',
      email: 'userb@example.com',
      passwordHash: 'hashedpwd',
    });
    tokenB = generateToken(userB);
  });

  it('should reject unauthenticated upload attempt (401)', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.from('fake-data'), 'test.png');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no token provided/i);
  });

  it('should create an Image document on authenticated upload', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', Buffer.from('fake-data'), 'test.png')
      .field('title', 'My Holiday Image')
      .field('tags', 'holiday, sunset');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('My Holiday Image');
    expect(res.body.tags).toContain('holiday');
    expect(res.body.uploadedBy).toBe(userA._id.toString());

    // Check database
    const saved = await Image.findById(res.body._id);
    expect(saved).toBeTruthy();
    expect(saved.publicId).toBe('photo-gallery/mock-id');
  });

  it('should return paginated results on GET /api/images', async () => {
    // Seed database with a few image records
    await Image.create([
      { publicId: 'img1', url: 'url1', title: 'A', uploadedBy: userA._id },
      { publicId: 'img2', url: 'url2', title: 'B', uploadedBy: userA._id },
      { publicId: 'img3', url: 'url3', title: 'C', uploadedBy: userA._id },
    ]);

    const res = await request(app)
      .get('/api/images?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.images).toHaveLength(2);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.totalImages).toBe(3);
    expect(res.body.currentPage).toBe(1);
  });

  it('should reject deleting another user\'s image with 403 Forbidden', async () => {
    // Create image belonging to User A
    const img = await Image.create({
      publicId: 'photo-gallery/mock-id',
      url: 'https://res.cloudinary.com/mock/image.png',
      uploadedBy: userA._id,
    });

    const res = await request(app)
      .delete(`/api/image/${encodeURIComponent(img.publicId)}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/delete your own images/i);
  });

  it('should delete user\'s own image successfully (200)', async () => {
    const img = await Image.create({
      publicId: 'photo-gallery/mock-id',
      url: 'https://res.cloudinary.com/mock/image.png',
      uploadedBy: userA._id,
    });

    const res = await request(app)
      .delete(`/api/image/${encodeURIComponent(img.publicId)}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted successfully/i);

    // Verify it is deleted in the database
    const inDb = await Image.findById(img._id);
    expect(inDb).toBeNull();
  });
});
