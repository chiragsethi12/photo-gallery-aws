const request = require('supertest');
const Album = require('../models/Album');
const Image = require('../models/Image');
const User = require('../models/User');
const ShareLink = require('../models/ShareLink');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Share Links API', () => {
  let app;
  let owner, stranger;
  let tokenOwner, tokenStranger;
  let album, image;

  beforeAll(() => {
    app = require('../server');
  });

  beforeEach(async () => {
    // Create test users
    owner = await User.create({ name: 'Owner', email: 'owner@example.com', passwordHash: 'pwd' });
    tokenOwner = generateToken(owner);

    stranger = await User.create({ name: 'Stranger', email: 'stranger@example.com', passwordHash: 'pwd' });
    tokenStranger = generateToken(stranger);

    // Create private album
    album = await Album.create({
      name: 'Private Album',
      description: 'Owner only',
      createdBy: owner._id,
    });

    // Create image belonging to album
    image = await Image.create({
      publicId: 'img-1',
      url: 'https://cloudinary.com/test.jpg',
      uploadedBy: owner._id,
      album: album._id,
    });
  });

  it('Requester without permission to resource cannot generate a share link (403)', async () => {
    // Stranger tries to share owner's album
    const resAlbum = await request(app)
      .post('/api/share')
      .set('Authorization', `Bearer ${tokenStranger}`)
      .send({
        resourceType: 'album',
        resourceId: album._id.toString(),
      });

    expect(resAlbum.status).toBe(403);

    // Stranger tries to share owner's image
    const resImage = await request(app)
      .post('/api/share')
      .set('Authorization', `Bearer ${tokenStranger}`)
      .send({
        resourceType: 'image',
        resourceId: image._id.toString(),
      });

    expect(resImage.status).toBe(403);
  });

  it('Resource owner can generate a share link', async () => {
    const res = await request(app)
      .post('/api/share')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        resourceType: 'album',
        resourceId: album._id.toString(),
        expiresInDays: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.url).toContain(res.body.token);

    // Verify it is in database
    const link = await ShareLink.findOne({ token: res.body.token });
    expect(link).toBeDefined();
    expect(link.resourceId.toString()).toBe(album._id.toString());
  });

  it('Public resolution of a valid, non-expired, passwordless link succeeds with public-safe data', async () => {
    // Generate share link
    const linkRes = await request(app)
      .post('/api/share')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        resourceType: 'album',
        resourceId: album._id.toString(),
      });

    const token = linkRes.body.token;

    // Resolve publicly with no authorization header
    const res = await request(app)
      .get(`/api/share/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.resourceType).toBe('album');
    expect(res.body.album.name).toBe('Private Album');
    expect(res.body.images).toHaveLength(1);
    expect(res.body.images[0].publicId).toBe('img-1');

    // Confirm it excludes sensitive fields like uploader password/email details
    expect(res.body.album.createdBy).toBeUndefined();
    expect(res.body.images[0].uploadedBy).toBeUndefined();
  });

  it('Expired link returns a generic 404', async () => {
    const link = await ShareLink.create({
      token: 'expired-token',
      resourceType: 'album',
      resourceId: album._id,
      createdBy: owner._id,
      expiresAt: new Date(Date.now() - 1000), // expired 1s ago
    });

    const res = await request(app)
      .get(`/api/share/${link.token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('This link is no longer available');
  });

  it('Revoked link returns a generic 404', async () => {
    const link = await ShareLink.create({
      token: 'revoked-token',
      resourceType: 'album',
      resourceId: album._id,
      createdBy: owner._id,
      revokedAt: new Date(),
    });

    const res = await request(app)
      .get(`/api/share/${link.token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('This link is no longer available');
  });

  it('Password protected link enforces bcrypt comparison validation', async () => {
    // Generate password protected link
    const linkRes = await request(app)
      .post('/api/share')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({
        resourceType: 'album',
        resourceId: album._id.toString(),
        password: 'securepassword',
      });

    const token = linkRes.body.token;

    // 1. Fetch without password -> returns requiresPassword: true (401)
    const resNoPass = await request(app)
      .get(`/api/share/${token}`);

    expect(resNoPass.status).toBe(401);
    expect(resNoPass.body.requiresPassword).toBe(true);

    // 2. Fetch with wrong password -> returns requiresPassword: true (401)
    const resWrongPass = await request(app)
      .get(`/api/share/${token}?password=wrong`);

    expect(resWrongPass.status).toBe(401);
    expect(resWrongPass.body.requiresPassword).toBe(true);

    // 3. Fetch with correct password -> returns 200 and data
    const resCorrectPass = await request(app)
      .get(`/api/share/${token}?password=securepassword`);

    expect(resCorrectPass.status).toBe(200);
    expect(resCorrectPass.body.album.name).toBe('Private Album');
  });

  it('Link creator can revoke access, others get 403', async () => {
    const link = await ShareLink.create({
      token: 'revoke-auth-test',
      resourceType: 'album',
      resourceId: album._id,
      createdBy: owner._id,
    });

    // Stranger tries to revoke -> 403
    const resStranger = await request(app)
      .delete(`/api/share/${link.token}`)
      .set('Authorization', `Bearer ${tokenStranger}`);

    expect(resStranger.status).toBe(403);

    // Owner revokes -> 200
    const resOwner = await request(app)
      .delete(`/api/share/${link.token}`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(resOwner.status).toBe(200);

    // Verify it is indeed revoked
    const check = await ShareLink.findOne({ token: link.token });
    expect(check.revokedAt).toBeDefined();
  });
});
