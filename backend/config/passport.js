const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const User = require('../models/user');

// Only initialize Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `/api/auth/google/callback`,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, creating temporary user session');
      // Get accountType from session, default to 'tester'
      const accountType = req.session?.accountType || 'tester';
      // Return a temporary user object for OAuth success without DB
      return done(null, {
        _id: 'temp_' + profile.id,
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        accountType: accountType,
        isEmailVerified: true,
        avatar: profile.photos[0]?.value
      });
    }

    // Check if user already exists with this Google ID
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    if (user) {
      // Update Google ID and accountType if user exists with email but no Google ID
      let needsUpdate = false;

      if (!user.googleId) {
        user.googleId = profile.id;
        needsUpdate = true;
      }

      // Update accountType if different from session
      const sessionAccountType = req.session?.accountType;
      if (sessionAccountType && user.accountType !== sessionAccountType) {
        user.accountType = sessionAccountType;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
      }

      return done(null, user);
    }

    // Get accountType from session, default to 'tester'
    const accountType = req.session?.accountType || 'tester';

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      password: 'oauth_user_' + Date.now(), // Temporary password for OAuth users
      accountType: accountType,
      isEmailVerified: true,
      avatar: profile.photos[0]?.value
    });

    user = await newUser.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
  }));
}

// Only initialize GitHub OAuth if credentials are provided
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_CLIENT_ID !== 'your-github-client-id-here') {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `/api/auth/github/callback`,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, creating temporary user session');
      // Get accountType from session, default to 'tester'
      const accountType = req.session?.accountType || 'tester';
      // Return a temporary user object for OAuth success without DB
      return done(null, {
        _id: 'temp_' + profile.id,
        githubId: profile.id,
        name: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
        accountType: accountType,
        isEmailVerified: true,
        avatar: profile.photos[0]?.value
      });
    }

    // Check if user already exists with this GitHub ID
    let user = await User.findOne({ 
      $or: [
        { githubId: profile.id },
        { email: profile.emails?.[0]?.value }
      ]
    });

    if (user) {
      // Update GitHub ID and accountType if user exists with email but no GitHub ID
      let needsUpdate = false;

      if (!user.githubId) {
        user.githubId = profile.id;
        needsUpdate = true;
      }

      // Update accountType if different from session
      const sessionAccountType = req.session?.accountType;
      if (sessionAccountType && user.accountType !== sessionAccountType) {
        user.accountType = sessionAccountType;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
      }

      return done(null, user);
    }

    // Get accountType from session, default to 'tester'
    const accountType = req.session?.accountType || 'tester';

    // Create new user
    const newUser = new User({
      githubId: profile.id,
      name: profile.displayName || profile.username,
      email: profile.emails?.[0]?.value || `${profile.username}@github.local`,
      password: 'oauth_user_' + Date.now(), // Temporary password for OAuth users
      accountType: accountType,
      isEmailVerified: true,
      avatar: profile.photos[0]?.value
    });

    user = await newUser.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
  }));
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;