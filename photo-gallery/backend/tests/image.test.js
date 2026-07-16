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
    expect(res.body.message).toMatch(/soft-deleted successfully/i);

    // Verify it is soft-deleted in the database
    const inDb = await Image.findById(img._id);
    expect(inDb).toBeTruthy();
    expect(inDb.isDeleted).toBe(true);
  });

  describe('getImages search, sorting and filtering features', () => {
    beforeEach(async () => {
      // Seed database with specific dates, names and tags
      await Image.create([
        {
          publicId: 'seed-img-1',
          url: 'url1',
          title: 'Sunset Beach',
          tags: ['sunset', 'beach'],
          uploadedBy: userA._id,
          createdAt: new Date('2026-01-01T12:00:00Z'),
          contentHash: 'hash1',
        },
        {
          publicId: 'seed-img-2',
          url: 'url2',
          title: 'Forest Mountain',
          tags: ['forest', 'mountain'],
          uploadedBy: userA._id,
          createdAt: new Date('2026-02-01T12:00:00Z'),
          contentHash: 'hash2',
        },
        {
          publicId: 'seed-img-3',
          url: 'url3',
          title: 'Sunset Mountain',
          tags: ['sunset', 'mountain'],
          uploadedBy: userA._id,
          createdAt: new Date('2026-03-01T12:00:00Z'),
          contentHash: 'hash3',
        },
      ]);
    });

    it('filters images by date range using dateFrom and dateTo', async () => {
      // Date from 2026-01-15 to 2026-02-15 should only match Forest Mountain
      const res = await request(app)
        .get('/api/images?dateFrom=2026-01-15&dateTo=2026-02-15');

      expect(res.status).toBe(200);
      expect(res.body.images).toHaveLength(1);
      expect(res.body.images[0].title).toBe('Forest Mountain');
    });

    it('sorts images by oldest first', async () => {
      const res = await request(app)
        .get('/api/images?sort=oldest');

      expect(res.status).toBe(200);
      expect(res.body.images).toHaveLength(3);
      expect(res.body.images[0].title).toBe('Sunset Beach');
      expect(res.body.images[1].title).toBe('Forest Mountain');
      expect(res.body.images[2].title).toBe('Sunset Mountain');
    });

    it('sorts images alphabetically by name/title', async () => {
      const res = await request(app)
        .get('/api/images?sort=name');

      expect(res.status).toBe(200);
      expect(res.body.images).toHaveLength(3);
      expect(res.body.images[0].title).toBe('Forest Mountain');
      expect(res.body.images[1].title).toBe('Sunset Beach');
      expect(res.body.images[2].title).toBe('Sunset Mountain');
    });

    it('filters images matching all specified tags (comma-separated)', async () => {
      // sunset,beach should only match Sunset Beach
      const res1 = await request(app)
        .get('/api/images?tags=sunset,beach');
      expect(res1.status).toBe(200);
      expect(res1.body.images).toHaveLength(1);
      expect(res1.body.images[0].title).toBe('Sunset Beach');

      // sunset,mountain should only match Sunset Mountain
      const res2 = await request(app)
        .get('/api/images?tags=sunset,mountain');
      expect(res2.status).toBe(200);
      expect(res2.body.images).toHaveLength(1);
      expect(res2.body.images[0].title).toBe('Sunset Mountain');

      // mountain should match both Forest Mountain and Sunset Mountain
      const res3 = await request(app)
        .get('/api/images?tags=mountain');
      expect(res3.status).toBe(200);
      expect(res3.body.images).toHaveLength(2);
    });
  });

  describe('Authorization and Actions Edge Cases', () => {
    let mockImg;

    beforeEach(async () => {
      mockImg = await Image.create({
        publicId: 'photo-gallery/auth-test-img',
        url: 'https://cloudinary.com/test.jpg',
        uploadedBy: userA._id,
      });
    });

    it('Fails to restore or delete non-existent images', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId().toString();

      const resRestore = await request(app)
        .post(`/api/image/${fakeId}/restore`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resRestore.status).toBe(404);

      const resDelete = await request(app)
        .delete(`/api/image/${fakeId}/permanent`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resDelete.status).toBe(404);
    });

    it('Fails when User B attempts to restore User A\'s image', async () => {
      const res = await request(app)
        .post(`/api/image/${mockImg._id}/restore`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });

    it('Fails when User B attempts to permanently delete User A\'s image', async () => {
      const res = await request(app)
        .delete(`/api/image/${mockImg._id}/permanent`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });

    it('Allows the owner of the album containing an image to permanently delete it', async () => {
      const albumOfB = await (require('../models/Album')).create({
        name: 'B Album',
        createdBy: userB._id,
      });

      const imgOfAInAlbumB = await Image.create({
        publicId: 'photo-gallery/shared-delete-test',
        url: 'https://cloudinary.com/test.jpg',
        uploadedBy: userA._id,
        album: albumOfB._id,
      });

      // User B (album owner) should be allowed to permanently delete it
      const res = await request(app)
        .delete(`/api/image/${imgOfAInAlbumB._id}/permanent`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
    });

    it('Toggles favorite image state successfully', async () => {
      // Toggle ON
      const resOn = await request(app)
        .post(`/api/image/${mockImg._id}/favorite`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resOn.status).toBe(200);
      expect(resOn.body.favoritedBy).toContain(userA._id.toString());

      // Toggle OFF
      const resOff = await request(app)
        .post(`/api/image/${mockImg._id}/favorite`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resOff.status).toBe(200);
      expect(resOff.body.favoritedBy).not.toContain(userA._id.toString());
    });
  });
});
