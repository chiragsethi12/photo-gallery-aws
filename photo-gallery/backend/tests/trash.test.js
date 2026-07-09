const request = require('supertest');
const Image = require('../models/Image');
const Album = require('../models/Album');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');
const { runCleanup } = require('../jobs/trashCleanup');

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

describe('Trash and Soft-Delete Lifecycle', () => {
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

  it('deleting an image sets isDeleted without removing the Cloudinary asset or Mongo doc', async () => {
    // Create an image
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

    // Verify in DB that isDeleted is true
    const saved = await Image.findById(img._id);
    expect(saved).toBeTruthy();
    expect(saved.isDeleted).toBe(true);
    expect(saved.deletedAt).toBeTruthy();

    // Verify Cloudinary destroy was NOT called
    expect(cloudinary.v2.uploader.destroy).not.toHaveBeenCalled();
  });

  it('a soft-deleted image does not appear in GET /api/images', async () => {
    // Create active and soft-deleted image
    await Image.create([
      { publicId: 'img-active', url: 'active-url', uploadedBy: userA._id, isDeleted: false },
      { publicId: 'img-deleted', url: 'deleted-url', uploadedBy: userA._id, isDeleted: true, deletedAt: new Date() },
    ]);

    const res = await request(app).get('/api/images');
    expect(res.status).toBe(200);
    expect(res.body.images).toHaveLength(1);
    expect(res.body.images[0].publicId).toBe('img-active');
  });

  it('restore clears isDeleted and the image reappears in normal listings', async () => {
    const img = await Image.create({
      publicId: 'img-deleted',
      url: 'deleted-url',
      uploadedBy: userA._id,
      isDeleted: true,
      deletedAt: new Date(),
    });

    // Restore
    const res = await request(app)
      .post(`/api/image/${img._id}/restore`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/restored successfully/i);

    // Verify DB
    const saved = await Image.findById(img._id);
    expect(saved.isDeleted).toBe(false);
    expect(saved.deletedAt).toBeNull();

    // Reappears in normal listings
    const listRes = await request(app).get('/api/images');
    expect(listRes.body.images).toHaveLength(1);
  });

  it('permanent delete actually calls Cloudinary destroy and removes the document', async () => {
    const img = await Image.create({
      publicId: 'photo-gallery/mock-id',
      url: 'https://res.cloudinary.com/mock/image.png',
      uploadedBy: userA._id,
      isDeleted: true,
      deletedAt: new Date(),
    });

    const res = await request(app)
      .delete(`/api/image/${img._id}/permanent`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/permanently deleted successfully/i);

    // Verify document is gone
    const saved = await Image.findById(img._id);
    expect(saved).toBeNull();

    // Verify Cloudinary destroy was called
    expect(cloudinary.v2.uploader.destroy).toHaveBeenCalledWith('photo-gallery/mock-id');
  });

  it('ownership is enforced on restore and permanent-delete (returns 403 on non-owners)', async () => {
    const img = await Image.create({
      publicId: 'mock-id-owner',
      url: 'url',
      uploadedBy: userA._id,
      isDeleted: true,
      deletedAt: new Date(),
    });

    // User B attempts to restore User A's image
    const restoreRes = await request(app)
      .post(`/api/image/${img._id}/restore`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(restoreRes.status).toBe(403);

    // User B attempts to permanently delete User A's image
    const permanentRes = await request(app)
      .delete(`/api/image/${img._id}/permanent`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(permanentRes.status).toBe(403);
  });

  it('direct unit test of the cleanup job logic permanently deletes old items', async () => {
    // Create an old soft-deleted image (31 days ago)
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const oldImg = await Image.create({
      publicId: 'old-img',
      url: 'url',
      uploadedBy: userA._id,
      isDeleted: true,
      deletedAt: oldDate,
    });

    // Create a new soft-deleted image (2 days ago)
    const newDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const newImg = await Image.create({
      publicId: 'new-img',
      url: 'url',
      uploadedBy: userA._id,
      isDeleted: true,
      deletedAt: newDate,
    });

    // Create an old soft-deleted album (31 days ago)
    const oldAlb = await Album.create({
      name: 'old-album',
      createdBy: userA._id,
      isDeleted: true,
      deletedAt: oldDate,
    });

    // Run cleanup directly
    await runCleanup();

    // Verify old image is deleted
    const checkOldImg = await Image.findById(oldImg._id);
    expect(checkOldImg).toBeNull();

    // Verify new image is NOT deleted
    const checkNewImg = await Image.findById(newImg._id);
    expect(checkNewImg).toBeTruthy();

    // Verify old album is deleted
    const checkOldAlb = await Album.findById(oldAlb._id);
    expect(checkOldAlb).toBeNull();
  });
});
