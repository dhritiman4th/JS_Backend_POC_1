import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true, // NOTE: - Add this property if we want to implememt search functionality on this field.
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    avatar: {
        type: String,
        required: true,
    },
    coverImage: {
        type: String,
    },
    watchHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required."],
    },
    refreshToken: {
        type: String
    }
}, {timestamps: true});

userSchema.pre("save", async function(next) { 
    /* NOTE: - 
    Here we can't use arrow function, because as we all know arrow func doesn't have access 
    to 'this' which is required to access userSchema properties.
    */
    if (!this.isModified("password")) {
        return  next();
    }
    this.password = await bcrypt.hash(this.password, 10); // 2nd option is salt / round
    next();
}); 
// NOTE: - Above we should not user arrow function becase as we know, arrow function doesn't hold 'this'.

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
    }, 
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
);
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id,
    }, 
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
);
}

export const User = mongoose.model("User", userSchema);






// NOTES: -
/**
 * Mongoose Middleware (also called as pre and post hooks) are the functions which are passed control during execution of 
 * asynchronous functions. Middleware is specified on schema level and used for writing plugins. There are four types of middlewares,
 * 1. Document middleware
 * 2. Model middleware
 * 3. Query middleware
 * 4. Aggregate middleware
 * 
 * The key differences between bcrypt and bcryptjs lie in their implementation and performance characteristics:

	1.	Language and Implementation:
	•	bcrypt: This is a native library written in C++ that provides bindings for Node.js. It leverages native code to offer better performance but requires additional setup and compilation during installation.
	•	bcryptjs: This is a pure JavaScript implementation of the bcrypt algorithm. It does not require any native code compilation and can be installed and used more easily in environments where compiling native modules might be problematic.
	2.	Installation and Compatibility:
	•	bcrypt: Installation can be more complex because it involves compiling C++ code. This can lead to compatibility issues across different operating systems and requires the presence of a C++ compiler.
	•	bcryptjs: Since it is purely JavaScript, installation is straightforward, and it works consistently across all environments that support Node.js without needing a compiler.
	3.	Performance:
	•	bcrypt: Generally faster due to its native C++ implementation, which can leverage the underlying system’s performance optimizations.
	•	bcryptjs: Slower compared to bcrypt because it runs entirely in JavaScript, which might not be as optimized as native code.
	4.	Usage:
	•	Both libraries offer similar APIs, so switching from one to the other doesn’t require significant changes to your codebase. The methods and parameters used to hash and compare passwords are essentially the same.

When to Use Each

	•	Use bcrypt: If performance is a critical factor and you are in an environment where you can easily handle native module compilation.
	•	Use bcryptjs: If you need a hassle-free installation process without worrying about native dependencies and cross-platform compatibility.

Example Usage

Here is a basic example of how to use both libraries for hashing and comparing passwords:

## bcrypt:---
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    // To check the password
    bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
        // result == true
    });
});

## bcryptjs:---
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    // Store hash in your password DB.
    // To check the password
    bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
        // result == true
    });
});
 */