const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    models = require('./models.js'),
    Movies = models.Movie,
    Users = models.User,
    cors = require('cors'),
    { check, validationResult } = require('express-validator');

const app = express();

let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}));

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(morgan('common'));

app.use(bodyParser.urlencoded({
    extended: true
}));

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

app.get('/', (req, res) => {
    res.send('Welcome to my movie site!');
});
  
app.get ('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ Title: req.params.title })
    .then((movie) => {
        if (movie) {
            res.json(movie);
        } else {
            res.status(404).send('Movie not found');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.get('/movies/genre/:genre', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ 'Genre.Name': req.params.genre })
    .then((movie) => {
        if (movie) {
            res.json(movie);
         } else {
            res.status(404).send('Movie not found');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.get('/movies/director/:director', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ 'Director.Name': req.params.director })
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
    })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.json(user);
    })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.post('/users', [ 
  check('Username', 'Username is required').isLength({min5}),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + 'already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
});

app.post('/movies', [
    check('Title', 'Title is required').isLength({min: 1}),
    check('Description', 'Description is required').isLength({min: 1}),
    check('Genre', 'Genre is required').isLength({min: 1}),
    check('Director', 'Director is required').isLength({min: 1})
], passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { Title, Description, Genre, Director } = req.body;
    try {
        const existingMovie = await Movies.findOne({ Title });
        if (existingMovie) {
            return res.status(400).send(`${Title} already exists`);
        }

        const newMovie = await Movies.create({
            Title,
            Description,
            Genre,
            Director
        });
        res.status(201).json(newMovie);
    } catch (error) {
        console.error('Error creating movie:', error);
        res.status(500).send('Error: ' + error.message);
    }
});

app.post('/users/:Username/movies/:MovieID', [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
       $push: { FavoriteMovies: req.params.MovieID }
     },
     { new: true })
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.put('/users/:Username', passport.authenticate('jwt', { session: false}), async (req, res) => {
    if(req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }
    await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true })
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    })
  
});

app.delete('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOneAndDelete({ Title: req.params.title })
    .then((movie) => {
        if (!movie) {
            res.status(400).send(req.params.title + ' was not found.');
        } else {
            res.status(200).send(req.params.title + ' was deleted.');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndDelete({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
       $pull: { FavoriteMovies: req.params.MovieID }
     },
     { new: true })
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.use((req, res, next) => {
    if (req.path.substr(-1) === '/' && req.path.length > 1) {
        const query = req.url.slice(req.path.length);
        res.redirect(301, req.path.slice(0, -1) + query);
    } else {
        next();
    }
});

app.use(express.static('public'));

app.use(methodOverride());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
    console.log('Your app is listening on port ' + port);
});