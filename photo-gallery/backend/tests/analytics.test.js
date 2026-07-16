const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const Image = require('../models/Image');
const Activity = require('../models/Activity');
const Album = require('../models/Album');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Analytics Reports Integration API', () => {
  let app;
  let userA, userB;
  let tokenA, tokenB;
  let albumA, albumB;

  beforeAll(() => {
    app = require('../server');
  });

  beforeEach(async () => {
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

    albumA = await Album.create({
      name: 'Album A',
      createdBy: userA._id,
    });

    albumB = await Album.create({
      name: 'Album B',
      createdBy: userB._id,
    });

    // Seed mock images for User A
    await Image.create([
      {
        publicId: 'img1',
        url: 'http://localhost/img1.png',
        format: 'png',
        uploadedBy: userA._id,
        contentHash: 'hash1',
        isDeleted: false,
      },
      {
        publicId: 'img2',
        url: 'http://localhost/img2.jpg',
        format: 'jpg',
        uploadedBy: userA._id,
        contentHash: 'hash2',
        isDeleted: false,
      },
      {
        publicId: 'img3',
        url: 'http://localhost/img3.jpg',
        format: 'jpg',
        uploadedBy: userA._id,
        contentHash: 'hash3',
        isDeleted: false,
      },
      {
        publicId: 'img-deleted-a',
        url: 'http://localhost/deleted.jpg',
        format: 'jpg',
        uploadedBy: userA._id,
        contentHash: 'hash-deleted-a',
        isDeleted: true,
      },
    ]);

    // Seed mock images for User B
    await Image.create([
      {
        publicId: 'img-b',
        url: 'http://localhost/imgb.png',
        format: 'png',
        uploadedBy: userB._id,
        contentHash: 'hash-b',
        isDeleted: false,
      },
    ]);

    // Seed activities for User A
    await Activity.create([
      {
        album: albumA._id,
        actor: userA._id,
        type: 'upload',
      },
      {
        album: albumA._id,
        actor: userA._id,
        type: 'upload',
      },
      {
        album: albumA._id,
        actor: userA._id,
        type: 'comment',
      },
      {
        album: albumA._id,
        actor: userA._id,
        type: 'image_deleted',
      },
    ]);

    // Seed activities for User B
    await Activity.create([
      {
        album: albumB._id,
        actor: userB._id,
        type: 'comment',
      },
    ]);
  });

  describe('GET /api/analytics/storage', () => {
    it('returns exact utilization metrics for User A and ignores User B data', async () => {
      const res = await request(app)
        .get('/api/analytics/storage')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.totalImageCount).toBe(3); // Excludes deleted image, excludes User B's image

      // Verify formats distribution
      const formats = res.body.formatBreakdown;
      expect(formats).toBeDefined();
      expect(formats.length).toBe(2);

      const jpgGroup = formats.find((f) => f._id === 'jpg');
      const pngGroup = formats.find((f) => f._id === 'png');

      expect(jpgGroup.count).toBe(2);
      expect(pngGroup.count).toBe(1);

      // Verify uploadHistory weekly trend array
      expect(res.body.uploadHistory).toBeDefined();
      expect(res.body.uploadHistory.length).toBeGreaterThan(0);
      expect(res.body.uploadHistory[0].count).toBe(3);
    });

    it('returns utilization metrics for User B separate from User A', async () => {
      const res = await request(app)
        .get('/api/analytics/storage')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.totalImageCount).toBe(1);

      const formats = res.body.formatBreakdown;
      expect(formats.length).toBe(1);
      expect(formats[0]._id).toBe('png');
      expect(formats[0].count).toBe(1);
    });
  });

  describe('GET /api/analytics/activity', () => {
    it('returns activity trend scoped strictly to the requesting actor', async () => {
      const res = await request(app)
        .get('/api/analytics/activity')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      // Activity types grouping counts: 2 uploads, 1 comment, 1 image_deleted
      const breakdown = res.body.activityBreakdown;
      expect(breakdown).toBeDefined();
      expect(breakdown.length).toBe(3);

      const uploadAct = breakdown.find((a) => a._id === 'upload');
      const commentAct = breakdown.find((a) => a._id === 'comment');
      const deleteAct = breakdown.find((a) => a._id === 'image_deleted');

      expect(uploadAct.count).toBe(2);
      expect(commentAct.count).toBe(1);
      expect(deleteAct.count).toBe(1);

      // Verify history count trend
      expect(res.body.activityHistory).toBeDefined();
      expect(res.body.activityHistory.length).toBeGreaterThan(0);
      expect(res.body.activityHistory[0].count).toBe(4);
    });

    it('does not leak User A activities to User B request', async () => {
      const res = await request(app)
        .get('/api/analytics/activity')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);

      const breakdown = res.body.activityBreakdown;
      expect(breakdown.length).toBe(1);
      expect(breakdown[0]._id).toBe('comment');
      expect(breakdown[0].count).toBe(1);
    });
  });
});
