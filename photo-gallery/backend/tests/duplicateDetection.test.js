const request = require('supertest');
const Image = require('../models/Image');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');

// Mock Cloudinary SDK with dynamically unique public_id
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
            const randomSuffix = Math.random().toString(36).substring(7);
            callback(null, {
              public_id: `photo-gallery/mock-id-${randomSuffix}`,
              secure_url: `https://res.cloudinary.com/mock/image-${randomSuffix}.png`,
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

describe('Content-Hash Duplicate Detection', () => {
  let app;
  let userA, userB;
  let tokenA, tokenB;

  beforeAll(() => {
    app = require('../server');
  });

  beforeEach(async () => {
    jest.clearAllMocks();

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

  it('rejects duplicate image upload by the same user with 409 and does not trigger Cloudinary', async () => {
    const fileBuffer = Buffer.from('unique-image-payload-123');

    // First upload: should succeed (200)
    const res1 = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', fileBuffer, 'image.png')
      .field('title', 'First Upload');

    expect(res1.status).toBe(200);
    expect(res1.body).toHaveProperty('contentHash');
    expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(1);

    const firstImageId = res1.body._id;

    // Second upload (same buffer, same user): should fail (409)
    const res2 = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', fileBuffer, 'image.png')
      .field('title', 'Second Upload');

    expect(res2.status).toBe(409);
    expect(res2.body.error).toMatch(/you already have this image/i);
    expect(res2.body.existingImage._id).toBe(firstImageId);

    // Verify Cloudinary stream upload was NOT called a second time
    expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(1);
  });

  it('allows same image upload by a different user and triggers Cloudinary', async () => {
    const fileBuffer = Buffer.from('shared-image-payload-456');

    // User A uploads: should succeed
    const resA = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', fileBuffer, 'image.png');

    expect(resA.status).toBe(200);
    expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(1);

    // User B uploads same file: should also succeed (uniqueness is per-user)
    const resB = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${tokenB}`)
      .attach('image', fileBuffer, 'image.png');

    expect(resB.status).toBe(200);
    expect(cloudinary.v2.uploader.upload_stream).toHaveBeenCalledTimes(2);
  });
});
