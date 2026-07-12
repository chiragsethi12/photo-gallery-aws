const request = require('supertest');
const Album = require('../models/Album');
const Image = require('../models/Image');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');

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

describe('Album Role-Based Collaboration', () => {
  let app;
  let owner, contributor, viewer, stranger;
  let tokenOwner, tokenContributor, tokenViewer, tokenStranger;
  let album;

  beforeAll(() => {
    app = require('../server');
  });

  beforeEach(async () => {
    // Create test users
    owner = await User.create({ name: 'Owner', email: 'owner@example.com', passwordHash: 'pwd' });
    tokenOwner = generateToken(owner);

    contributor = await User.create({ name: 'Contributor', email: 'collab-c@example.com', passwordHash: 'pwd' });
    tokenContributor = generateToken(contributor);

    viewer = await User.create({ name: 'Viewer', email: 'collab-v@example.com', passwordHash: 'pwd' });
    tokenViewer = generateToken(viewer);

    stranger = await User.create({ name: 'Stranger', email: 'stranger@example.com', passwordHash: 'pwd' });
    tokenStranger = generateToken(stranger);

    // Create private album owned by owner
    album = await Album.create({
      name: 'Private Album',
      description: 'Private',
      createdBy: owner._id,
    });
  });

  it('Owner can add, modify, and remove a collaborator by email', async () => {
    // Add collaborator
    const addRes = await request(app)
      .post(`/api/albums/${album._id}/collaborators`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ email: 'collab-c@example.com', role: 'viewer' });

    expect(addRes.status).toBe(200);
    expect(addRes.body.collaborators).toHaveLength(1);
    expect(addRes.body.collaborators[0].user.email).toBe('collab-c@example.com');
    expect(addRes.body.collaborators[0].role).toBe('viewer');

    // Update collaborator role
    const updateRes = await request(app)
      .patch(`/api/albums/${album._id}/collaborators/${contributor._id}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ role: 'contributor' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.collaborators[0].role).toBe('contributor');

    // Remove collaborator
    const removeRes = await request(app)
      .delete(`/api/albums/${album._id}/collaborators/${contributor._id}`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.collaborators).toHaveLength(0);
  });

  it('Non-owner cannot manage collaborators (403)', async () => {
    const addRes = await request(app)
      .post(`/api/albums/${album._id}/collaborators`)
      .set('Authorization', `Bearer ${tokenStranger}`)
      .send({ email: 'collab-v@example.com', role: 'viewer' });

    expect(addRes.status).toBe(403);
  });

  it('Contributor can upload photos into the album, but Viewer gets 403', async () => {
    // Grant contributor role
    album.collaborators.push({ user: contributor._id, role: 'contributor' });
    // Grant viewer role
    album.collaborators.push({ user: viewer._id, role: 'viewer' });
    await album.save();

    // Contributor upload
    const uploadC = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenContributor}`)
      .attach('image', Buffer.from('fake-data'), 'test.png')
      .field('album', album._id.toString());

    expect(uploadC.status).toBe(200);

    // Viewer upload
    const uploadV = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenViewer}`)
      .attach('image', Buffer.from('fake-data'), 'test.png')
      .field('album', album._id.toString());

    expect(uploadV.status).toBe(403);
  });

  it('Contributor can delete their own uploads but not another contributor\'s (403)', async () => {
    album.collaborators.push({ user: contributor._id, role: 'contributor' });
    album.collaborators.push({ user: viewer._id, role: 'contributor' }); // viewer variable acts as second contributor B here
    await album.save();

    const imgC1 = await Image.create({
      publicId: 'img-c1',
      url: 'url',
      uploadedBy: contributor._id,
      album: album._id,
    });

    // Contributor deletes own image
    const delOwn = await request(app)
      .delete(`/api/image/${encodeURIComponent(imgC1.publicId)}`)
      .set('Authorization', `Bearer ${tokenContributor}`);

    expect(delOwn.status).toBe(200);

    // Recreate
    const imgC2 = await Image.create({
      publicId: 'img-c2',
      url: 'url',
      uploadedBy: contributor._id,
      album: album._id,
    });

    // Contributor B (using tokenViewer) deletes Contributor A's image
    const delOther = await request(app)
      .delete(`/api/image/${encodeURIComponent(imgC2.publicId)}`)
      .set('Authorization', `Bearer ${tokenViewer}`);

    expect(delOther.status).toBe(403);
  });

  it('Album Owner can delete any image in their album regardless of who uploaded it', async () => {
    album.collaborators.push({ user: contributor._id, role: 'contributor' });
    await album.save();

    const img = await Image.create({
      publicId: 'img-c-upload',
      url: 'url',
      uploadedBy: contributor._id,
      album: album._id,
    });

    // Owner deletes image uploaded by contributor
    const delOwner = await request(app)
      .delete(`/api/image/${encodeURIComponent(img.publicId)}`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(delOwner.status).toBe(200);

    const check = await Image.findById(img._id);
    expect(check.isDeleted).toBe(true);
  });

  it('Viewer can fetch album images, but gets 403 trying to delete any image', async () => {
    album.collaborators.push({ user: viewer._id, role: 'viewer' });
    await album.save();

    const img = await Image.create({
      publicId: 'img-view',
      url: 'url',
      uploadedBy: owner._id,
      album: album._id,
    });

    // Viewer gets images
    const listRes = await request(app)
      .get(`/api/images?album=${album._id}`)
      .set('Authorization', `Bearer ${tokenViewer}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.images).toHaveLength(1);

    // Viewer deletes image
    const delRes = await request(app)
      .delete(`/api/image/${encodeURIComponent(img.publicId)}`)
      .set('Authorization', `Bearer ${tokenViewer}`);

    expect(delRes.status).toBe(403);
  });

  it('Stranger (unrelated user) gets 403 viewing a private album\'s details', async () => {
    const res = await request(app)
      .get(`/api/albums/${album._id}`)
      .set('Authorization', `Bearer ${tokenStranger}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/albums?scope=shared only returns albums where user is a collaborator', async () => {
    // Stranger owns an album
    const otherAlbum = await Album.create({
      name: 'Other Album',
      createdBy: stranger._id,
    });

    // Owner adds contributor to their private album
    album.collaborators.push({ user: contributor._id, role: 'viewer' });
    await album.save();

    // Contributor fetches owned albums
    const mineRes = await request(app)
      .get('/api/albums?scope=mine')
      .set('Authorization', `Bearer ${tokenContributor}`);

    expect(mineRes.status).toBe(200);
    expect(mineRes.body).toHaveLength(0); // owns no albums

    // Contributor fetches shared albums
    const sharedRes = await request(app)
      .get('/api/albums?scope=shared')
      .set('Authorization', `Bearer ${tokenContributor}`);

    expect(sharedRes.status).toBe(200);
    expect(sharedRes.body).toHaveLength(1);
    expect(sharedRes.body[0]._id.toString()).toBe(album._id.toString());
  });
});
