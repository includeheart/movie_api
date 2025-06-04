/**
 * Handles user authentication and JWT token generation.
 * - Exports a function to set up the /login endpoint.
 * - Uses Passport's local strategy for authentication.
 * - Issues a JWT token upon successful login.
 */

const jwtSecret = 'your_jwt_secret',
  jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport');

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username,
    expiresIn: '7d',
    algorithm: 'HS256'
  });
}

module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'An error occurred during login.' });
      }
      if (!user) {
        return res.status(400).json({
          message: info ? info.message : 'Invalid username or password.',
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error('Error during login:', error);
          return res.status(500).send(error);
        }
      const token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};