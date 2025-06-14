/**
 * Configures Passport authentication strategies for the application.
 * - LocalStrategy: Authenticates users using a username and password.
 * - JWTStrategy: Authenticates users using a JSON Web Token.
 * 
 * Expects user model to provide a `validatePassword` method.
 */

const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    Models = require('./models.js'),
    passportJWT = require('passport-jwt');

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

    passport.use(
        new LocalStrategy(
            {
                usernameField: 'Username',
                passwordField: 'Password'
            },
            async (username, password, callback) => {
                console.log(`${username}  ${password}`);
                try {
                    const user = await Users.findOne({ Username: username });
                    if (!user) {
                        console.log('Incorrect username');
                        return callback(null, false, {
                            message: 'Incorrect username or password.',
                        });
                    }
                    if (!user.validatePassword(password)) {
                        console.log('Incorrect password');
                        return callback(null, false, {
                            message: 'Incorrect password.',
                        });
                    }
                    console.log('Authentication successful');
                    return callback(null, user);
                } catch (error) {
                    console.error('Error during authentication:', error);
                    return callback(error);
                }
            }
        )
    );

passport.use( new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
    return await Users.findById(jwtPayload._id)
    .then((user) => {
        return callback(null, user);
    })
    .catch((error) => {
        return callback(error)
    });
}));