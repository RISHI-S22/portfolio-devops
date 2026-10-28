const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const path = require('path');
const morgan = require('morgan');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // Structured logging for ELK

// Session Setup (Req 6)
app.use(session({
  secret: process.env.SESSION_SECRET || 'devops-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// Static Public Portfolio
app.use(express.static(path.join(__dirname, 'public')));

// Google OAuth 2.0 (Req 7)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback"
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  ));
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Login Page Route (Req 6)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Standard Local Login (Req 6)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Demo admin credentials
  if (username === 'admin' && password === 'admin123') {
    const user = { id: 1, displayName: 'Portfolio Admin', email: 'admin@portfolio.local' };
    req.login(user, (err) => {
      if (err) return res.redirect('/login');
      return res.redirect('/mfa-setup');
    });
  } else {
    res.status(401).send("Invalid credentials. <a href='/login'>Try again</a>");
  }
});

// Google OAuth Routes (Req 7)
app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).send("Google OAuth not configured with environment variables.");
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/mfa-setup');
});

// MFA Endpoints (Req 8)
app.get('/mfa-setup', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  
  // Use existing secret if user already generated one, or generate new
  const secret = speakeasy.generateSecret({ name: `Portfolio (${req.user.displayName || req.user.username || 'Admin'})` });
  req.session.tempSecret = secret.base32;

  QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MFA Verification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0f172a; color: #f8fafc; margin: 0; }
          .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); text-align: center; max-width: 400px; }
          img { border: 8px solid white; border-radius: 8px; margin: 1rem 0; }
          input { width: 80%; padding: 0.75rem; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white; text-align: center; font-size: 1.2rem; letter-spacing: 4px; }
          button { margin-top: 1rem; width: 85%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Two-Factor Authentication</h2>
          <p>Scan with Google Authenticator or enter manual key: <br><code>${secret.base32}</code></p>
          <img src="${dataUrl}"/>
          <form action="/mfa-verify" method="POST">
            <input name="token" placeholder="000000" maxlength="6" required autofocus />
            <br>
            <button type="submit">Verify Code</button>
          </form>
        </div>
      </body>
      </html>
    `);
  });
});

app.post('/mfa-verify', (req, res) => {
  const verified = speakeasy.totp.verify({
    secret: req.session.tempSecret,
    encoding: 'base32',
    token: req.body.token,
    window: 1
  });

  if (verified) {
    req.session.mfaVerified = true;
    return res.redirect('/protected/dashboard');
  }
  res.status(401).send("Invalid MFA Token. <a href='/mfa-setup'>Try again</a>");
});

// Protected Route (Req 6)
app.get('/protected/dashboard', (req, res) => {
  if (req.isAuthenticated() && req.session.mfaVerified) {
    return res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
  }
  res.redirect('/login');
});

// Logout Route
app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect('/');
  });
});

// Health check endpoint for Grafana/Uptime monitoring (Req 9)
app.get('/health', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date() }));

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`[VIGIL-CORE] Server running on port ${PORT}`));