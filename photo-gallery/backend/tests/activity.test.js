const request = require('supertest');
const Album = require('../models/Album');
const Image = require('../models/Image');
const User = require('../models/User');
const Activity = require('../models/Activity');
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

describe('Activity API', () => {
  let app;
  let owner, collaborator, stranger;
  let tokenOwner, tokenCollaborator, tokenStranger;
  let album;

  beforeAll(() => {
    app = require('../server');
  });

  beforeEach(async () => {
    // Setup users
    owner = await User.create({ name: 'Owner', email: 'owner@example.com', passwordHash: 'pwd' });
    tokenOwner = generateToken(owner);

    collaborator = await User.create({ name: 'Collab', email: 'collab@example.com', passwordHash: 'pwd' });
    tokenCollaborator = generateToken(collaborator);

    stranger = await User.create({ name: 'Stranger', email: 'stranger@example.com', passwordHash: 'pwd' });
    tokenStranger = generateToken(stranger);

    // Setup private album
    album = await Album.create({
      name: 'Activity Album',
      createdBy: owner._id,
    });
  });

  it('Uploading an image into an album creates an activity log entry', async () => {
    const buffer = Buffer.from('mock file content');

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .attach('image', buffer, 'test.png')
      .field('title', 'Photo upload test')
      .field('album', album._id.toString());

    expect(res.status).toBe(200);

    // Wait a brief tick since activity creation is fire-and-forget (asynchronous)
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verify activity was created in DB
    const act = await Activity.findOne({ album: album._id, type: 'upload' });
    expect(act).toBeDefined();
    expect(act.actor.toString()).toBe(owner._id.toString());
    expect(act.metadata.count).toBe(1);
  });

  it('Adding/removing a collaborator creates activity log entries', async () => {
    // 1. Add collaborator
    const resAdd = await request(app)
      .post(`/api/albums/${album._id}/collaborators`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ email: 'collab@example.com', role: 'viewer' });

    expect(resAdd.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const actAdd = await Activity.findOne({ album: album._id, type: 'collaborator_added' });
    expect(actAdd).toBeDefined();
    expect(actAdd.metadata.addedUserName).toBe('Collab');
    expect(actAdd.metadata.role).toBe('viewer');

    // 2. Remove collaborator
    const resRemove = await request(app)
      .delete(`/api/albums/${album._id}/collaborators/${collaborator._id}`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(resRemove.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const actRemove = await Activity.findOne({ album: album._id, type: 'collaborator_removed' });
    expect(actRemove).toBeDefined();
    expect(actRemove.metadata.removedUserName).toBe('Collab');
  });

  it('GET /api/albums/:id/activity requires viewer+ access and returns newest-first populated entries', async () => {
    // Add collaborator so they have viewer access
    await Album.findByIdAndUpdate(album._id, {
      $push: { collaborators: { user: collaborator._id, role: 'viewer' } },
    });

    // Populate mock activities
    await Activity.create([
      { album: album._id, actor: owner._id, type: 'upload', createdAt: new Date(Date.now() - 2000) },
      { album: album._id, actor: owner._id, type: 'comment', createdAt: new Date(Date.now() - 1000) },
    ]);

    // 1. Stranger (no access) -> 403
    const resStranger = await request(app)
      .get(`/api/albums/${album._id}/activity`)
      .set('Authorization', `Bearer ${tokenStranger}`);
    expect(resStranger.status).toBe(403);

    // 2. Collaborator (viewer) -> 200 and newest first
    const resCollab = await request(app)
      .get(`/api/albums/${album._id}/activity`)
      .set('Authorization', `Bearer ${tokenCollaborator}`);

    expect(resCollab.status).toBe(200);
    expect(resCollab.body.activities).toHaveLength(2);
    // Newest first sorting
    expect(resCollab.body.activities[0].type).toBe('comment');
    expect(resCollab.body.activities[0].actor.name).toBe('Owner');
    expect(resCollab.body.activities[1].type).toBe('upload');
  });
});
