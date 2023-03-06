const router = require('express').Router();
const { User } = require('../../models');
// const withAuth = require("../../utils/auth");
const bcrypt = require("bcrypt");
const saltRounds = 10;

router.post('/login', async (req, res) => {
  try {

    console.log("\n\nTrying to login\n\n");

    // Find the user who matches the posted e-mail address
    const userData = await User.findOne({ where: { email: req.body.email } });

    if (!userData) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password, please try again' });
      return;
    }

    // Verify the posted password with the password store in the database
    const validPassword = await userData.checkPassword(req.body.password);

    if (!validPassword) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password, please try again' });
      return;
    }

    // Create session variables based on the logged in user
    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;
      
      console.log("\n\nRedirect to main\n\n");

      console.log("user_id = " + req.session.user_id);
      console.log("logged_in = " + req.session.logged_in);

      res.status(200).redirect("/main");

      //res.json({ user: userData, message: 'You are now logged in!' });
    });    

    console.log("user_id = " + req.session.user_id);
    console.log("logged_in = " + req.session.logged_in);

  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

router.post('/logout', (req, res) => {

  console.log("\n\nLogging out\n\n");

  if (req.session.logged_in) {
    // Remove the session variables
    req.session.destroy(() => {
      console.log("\n\nDestroy the session\n\n");
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

// POST request - sign up = creates a new user // TODO: what if it's support user?
// api/user/signup
router.post("/signup", async (req, res) => {
  try {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.password, salt);
    req.body.password = hash

    const userData = await User.create(req.body);
    res.status(200).json(userData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
