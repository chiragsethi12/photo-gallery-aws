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
    expect(res.body.message).toMatch(/deleted successfully/i);

    // Verify the album is deleted
    const albumInDb = await Album.findById(album._id);
    expect(albumInDb).toBeNull();

    // Verify image references are set to null
    const savedImg1 = await Image.findById(img1._id);
    expect(savedImg1.album).toBeNull();

    const savedImg2 = await Image.findById(img2._id);
    expect(savedImg2.album).toBeNull();
  });
});
