/**
 * Defines Mongoose schemas and models for Movies and Users.
 * - Movie: Stores movie details, including genre and director.
 * - User: Stores user credentials, email, birthday, and favorite movies.
 * 
 * User schema includes static method `hashPassword` and instance method `validatePassword` for password management.
 */

const mongoose = require('mongoose'),
 Schema = mongoose.Schema,
 bcryptjs = require('bcryptjs');

let movieSchema = new Schema({
  Title: {type: String, required: true},
  Description: {type: String, required: true},
  Genre: {
    Name: String,
    Description: String
  },
  Director: {
    Name: String,
    Bio: String
  },
  Actors: [String],
  ImagePath: String,
  Featured: Boolean
});
  
let userSchema = new Schema({
  Username: {type: String, required: true},
  Password: {type: String, required: true},
  Email: {type: String, required: true},
  Birthday: Date,
  FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

userSchema.statics.hashPassword = (password) => {
  return bcryptjs.hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password) {
  return bcryptjs.compareSync(password, this.Password);
};

const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);
  
module.exports.Movie = Movie;
module.exports.User = User;