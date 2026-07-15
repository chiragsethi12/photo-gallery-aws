const request = require('supertest');
const Album = require('../models/Album');
const Image = require('../models/Image');
const User = require('../models/User');
const Comment = require('../models/Comment');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Comments API', () => {
  let app;
  let owner, collaborator, stranger;
  let tokenOwner, tokenCollaborator, tokenStranger;
  let album, image;

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

    // Setup private album and add collaborator
    album = await Album.create({
      name: 'Test Album',
      createdBy: owner._id,
      collaborators: [{ user: collaborator._id, role: 'viewer' }],
    });

    image = await Image.create({
      publicId: 'img-c1',
      url: 'https://cloudinary.com/c1.jpg',
      uploadedBy: owner._id,
      album: album._id,
    });
  });

  it('User with album access (owner & collaborator) can comment on an image', async () => {
    // 1. Owner comment
    const resOwner = await request(app)
      .post(`/api/image/${image._id}/comments`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ text: 'Owner comment' });

    expect(resOwner.status).toBe(201);
    expect(resOwner.body.text).toBe('Owner comment');
    expect(resOwner.body.author.name).toBe('Owner');

    // 2. Collaborator comment
    const resCollab = await request(app)
      .post(`/api/image/${image._id}/comments`)
      .set('Authorization', `Bearer ${tokenCollaborator}`)
      .send({ text: 'Collaborator comment' });

    expect(resCollab.status).toBe(201);
    expect(resCollab.body.text).toBe('Collaborator comment');
  });

  it('User without album access cannot comment (403)', async () => {
    const res = await request(app)
      .post(`/api/image/${image._id}/comments`)
      .set('Authorization', `Bearer ${tokenStranger}`)
      .send({ text: 'Stranger comment' });

    expect(res.status).toBe(403);
  });

  it('Comment author can delete their own comment', async () => {
    const comment = await Comment.create({
      image: image._id,
      author: collaborator._id,
      text: 'To be deleted',
    });

    const res = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set('Authorization', `Bearer ${tokenCollaborator}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comment deleted successfully!');

    // Check DB
    const check = await Comment.findById(comment._id);
    expect(check).toBeNull();
  });

  it('Album owner can delete any comment inside their album', async () => {
    const comment = await Comment.create({
      image: image._id,
      author: collaborator._id,
      text: 'Collaborator text',
    });

    const res = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set('Authorization', `Bearer ${tokenOwner}`);

    expect(res.status).toBe(200);
  });

  it('Unrelated user cannot delete someone else comment (403)', async () => {
    const comment = await Comment.create({
      image: image._id,
      author: owner._id,
      text: 'Owner comment',
    });

    const res = await request(app)
      .delete(`/api/comments/${comment._id}`)
      .set('Authorization', `Bearer ${tokenStranger}`);

    expect(res.status).toBe(403);
  });

  it('GET /api/image/:id/comments respects same access rules and handles pagination', async () => {
    // Pre-create 12 comments
    const list = [];
    for (let i = 1; i <= 12; i++) {
      list.push({
        image: image._id,
        author: owner._id,
        text: `Comment ${i}`,
        createdAt: new Date(Date.now() + i * 1000), // set increasing dates to test sorting
      });
    }
    await Comment.insertMany(list);

    // 1. Stranger gets 403
    const resStranger = await request(app)
      .get(`/api/image/${image._id}/comments`)
      .set('Authorization', `Bearer ${tokenStranger}`);
    expect(resStranger.status).toBe(403);

    // 2. Collab gets paginated results (Page 1)
    const resCollabPage1 = await request(app)
      .get(`/api/image/${image._id}/comments?page=1&limit=10`)
      .set('Authorization', `Bearer ${tokenCollaborator}`);

    expect(resCollabPage1.status).toBe(200);
    expect(resCollabPage1.body.comments).toHaveLength(10);
    expect(resCollabPage1.body.totalPages).toBe(2);
    expect(resCollabPage1.body.totalComments).toBe(12);
    // Newest first sorting: Comment 12 should be first
    expect(resCollabPage1.body.comments[0].text).toBe('Comment 12');

    // Page 2
    const resCollabPage2 = await request(app)
      .get(`/api/image/${image._id}/comments?page=2&limit=10`)
      .set('Authorization', `Bearer ${tokenCollaborator}`);

    expect(resCollabPage2.status).toBe(200);
    expect(resCollabPage2.body.comments).toHaveLength(2);
    expect(resCollabPage2.body.comments[0].text).toBe('Comment 2');
  });
});
