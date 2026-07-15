const app = require('../server');
const ioClient = require('socket.io-client');
const verifyToken = require('../utils/verifyToken');
const checkAlbumAccess = require('../utils/checkAlbumAccess');
const User = require('../models/User');
const Album = require('../models/Album');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Socket.IO and Token Utilities', () => {
  let server;
  let port;
  let owner, collaborator, stranger;
  let tokenOwner, tokenCollaborator, tokenStranger;
  let album;

  beforeAll((done) => {
    // Start backend server on ephemeral port for integration testing
    server = app.server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(async () => {
    // Setup test users
    owner = await User.create({ name: 'Owner', email: 'owner@example.com', passwordHash: 'pwd' });
    tokenOwner = generateToken(owner);

    collaborator = await User.create({ name: 'Collab', email: 'collab@example.com', passwordHash: 'pwd' });
    tokenCollaborator = generateToken(collaborator);

    stranger = await User.create({ name: 'Stranger', email: 'stranger@example.com', passwordHash: 'pwd' });
    tokenStranger = generateToken(stranger);

    // Setup private album and add collaborator
    album = await Album.create({
      name: 'Real-time Album',
      createdBy: owner._id,
      collaborators: [{ user: collaborator._id, role: 'viewer' }],
    });
  });

  // ── 1. Unit Tests ──────────────────────────────────────────────────────────
  describe('verifyToken unit tests', () => {
    it('successfully decodes valid tokens', () => {
      const decoded = verifyToken(tokenOwner);
      expect(decoded.name).toBe('Owner');
      expect(decoded.email).toBe('owner@example.com');
    });

    it('throws on invalid/missing tokens', () => {
      expect(() => verifyToken(null)).toThrow('No token provided.');
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });
  });

  describe('checkAlbumAccess unit tests', () => {
    it('grants album owner access', async () => {
      const { role } = await checkAlbumAccess(album._id, owner._id, 'viewer');
      expect(role).toBe('owner');
    });

    it('grants collaborator access', async () => {
      const { role } = await checkAlbumAccess(album._id, collaborator._id, 'viewer');
      expect(role).toBe('viewer');
    });

    it('rejects stranger access (403)', async () => {
      await expect(checkAlbumAccess(album._id, stranger._id, 'viewer')).rejects.toThrow(
        'You do not have access to this album.'
      );
    });
  });

  // ── 2. Socket.IO Integration Tests ──────────────────────────────────────────
  describe('Socket.IO Connection & Events', () => {
    let clientSocket;

    afterEach((done) => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
      done();
    });

    it('denies connection when token is missing/invalid', (done) => {
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: '' },
        reconnection: false,
      });

      clientSocket.on('connect_error', () => {
        // Socket should reject handshake
        done();
      });

      // Timeout safety
      setTimeout(() => {
        if (!clientSocket.connected) {
          done();
        }
      }, 500);
    });

    it('connects successfully with a valid token', (done) => {
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: tokenOwner },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    it('allows joining album room when access is authorized', (done) => {
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: tokenCollaborator },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join-album', { albumId: album._id.toString() });

        // Wait brief tick to verify no error was emitted
        setTimeout(() => {
          done();
        }, 150);
      });

      clientSocket.on('error', (err) => {
        done(new Error(`Should not have received error: ${err.message}`));
      });
    });

    it('emits error event when attempting to join album without access rights', (done) => {
      clientSocket = ioClient(`http://localhost:${port}`, {
        auth: { token: tokenStranger },
        reconnection: false,
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('join-album', { albumId: album._id.toString() });
      });

      clientSocket.on('error', (err) => {
        expect(err.message).toBe('You do not have access to this album.');
        done();
      });
    });
  });
});
