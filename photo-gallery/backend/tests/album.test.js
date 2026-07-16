const request = require('supertest');
const Album = require('../models/Album');
const Image = require('../models/Image');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Album Endpoints - DELETE /api/albums/:id', () => {
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

  it('should reject deleting an album if the user is not the owner (403)', async () => {
    // Create an album owned by User A
    const album = await Album.create({
      name: 'Album A',
      description: 'Test Album A',
      createdBy: userA._id,
    });

    // Attempt to delete using User B's token (non-owner)
    const res = await request(app)
      .delete(`/api/albums/${album._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/delete your own albums/i);

    // Verify the album still exists
    const inDb = await Album.findById(album._id);
    expect(inDb).toBeTruthy();
  });

  it('should allow the owner to delete the album, and nullify references in Image documents', async () => {
    // Create an album owned by User A
    const album = await Album.create({
      name: 'Album A',
      description: 'Test Album A',
      createdBy: userA._id,
    });

    // Create image documents referencing this album
    const img1 = await Image.create({
      publicId: 'img-alb-1',
      url: 'https://res.cloudinary.com/mock/image1.png',
      uploadedBy: userA._id,
      album: album._id,
    });

    const img2 = await Image.create({
      publicId: 'img-alb-2',
      url: 'https://res.cloudinary.com/mock/image2.png',
      uploadedBy: userA._id,
      album: album._id,
    });

    // Attempt to delete using User A's token (owner)
    const res = await request(app)
      .delete(`/api/albums/${album._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/soft-deleted successfully/i);

    // Verify the album is soft-deleted
    const albumInDb = await Album.findById(album._id);
    expect(albumInDb).toBeTruthy();
    expect(albumInDb.isDeleted).toBe(true);

    // Verify image references are NOT set to null (retained for restore support)
    const savedImg1 = await Image.findById(img1._id);
    expect(savedImg1.album).toEqual(album._id);

    const savedImg2 = await Image.findById(img2._id);
    expect(savedImg2.album).toEqual(album._id);
  });

  describe('Album Creation, Restore and Permanent Deletion', () => {
    it('creates a new album and validates fields', async () => {
      // 1. Missing name -> 400
      const resErr = await request(app)
        .post('/api/albums')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'No Name' });
      expect(resErr.status).toBe(400);

      // 2. Successful creation -> 201
      const resOk = await request(app)
        .post('/api/albums')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'Happy Album', description: 'With Name' });
      expect(resOk.status).toBe(201);
      expect(resOk.body.name).toBe('Happy Album');
    });

    it('returns a list of albums using default scope', async () => {
      const res = await request(app)
        .get('/api/albums')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('fails to restore or permanently delete a non-existent album', async () => {
      const fakeId = new (require('mongoose')).Types.ObjectId().toString();

      const resRestore = await request(app)
        .post(`/api/albums/${fakeId}/restore`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resRestore.status).toBe(404);

      const resPerm = await request(app)
        .delete(`/api/albums/${fakeId}/permanent`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resPerm.status).toBe(404);
    });

    it('denies non-owner from restoring or permanently deleting an album', async () => {
      const album = await Album.create({
        name: 'Private Album',
        createdBy: userA._id,
      });

      // Restore attempt by B -> 403
      const resRestore = await request(app)
        .post(`/api/albums/${album._id}/restore`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resRestore.status).toBe(403);

      // Permanent delete attempt by B -> 403
      const resPerm = await request(app)
        .delete(`/api/albums/${album._id}/permanent`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(resPerm.status).toBe(403);
    });

    it('allows owner to restore or permanently delete an album', async () => {
      const album = await Album.create({
        name: 'Delete Album',
        createdBy: userA._id,
        isDeleted: true,
      });

      // Restore -> 200
      const resRestore = await request(app)
        .post(`/api/albums/${album._id}/restore`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resRestore.status).toBe(200);
      expect(resRestore.body.album.isDeleted).toBe(false);

      // Permanent Delete -> 200
      const resPerm = await request(app)
        .delete(`/api/albums/${album._id}/permanent`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(resPerm.status).toBe(200);

      const check = await Album.findById(album._id);
      expect(check).toBeNull();
    });
  });
});
