import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import { HttpError } from '../models/errorHandler.js';

import User from '../models/userModel.js';

// ------------------------
//@desc     Fetch all users
//@route    GET /api/users
//@access   Private
const getAllUsers = asyncHandler(async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
});

// ------------------------
//@desc     register user
//@route    POST /api/users
//@access   Private
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

//@desc     login user
//@route    GET /api/users
//@access   Private
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser
  try {
    existingUser = await User.findOne({email: email})
  } catch (err) {
    return next(new HttpError('Logging in failed, please try again later', 500))
  }

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError('Invalid credentials, could not log you in', 401))
  }

  res.json({ message: 'Logged In', user: existingUser.toObject({getters: true}) });
});

export { getAllUsers, signup, login };
