
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema")
const env = require("dotenv").config();


passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"http://localhost:3000/google/callback"
},

async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if a user with the same email exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // If the user exists but doesn't have a Google ID, add it
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }

            // Check if the user is blocked
            if (user.isBlocked) {
                // If the user is blocked, prevent login and return an error via done
                return done(null, false, { message: 'Your account has been blocked by the admin.' });
            }

            return done(null, user);
        } else {
            // If no user found, create a new one
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
            });
            
            await user.save();
            return done(null, user);
        }
    } catch (error) {
        return done(error, null);  // If an error occurs, pass it to done()
    }
}));

passport.serializeUser((user,done)=>{
    done(null,user.id)
});

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(err =>{
        done(err,null)
    })
})

module.exports = passport;
