// *********** For Promises
const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((error) => {
            next(error);
        })
    } 
};

export {asyncHandler};

// STEP BY STEP BREAKDOWN
// const asyncHandler = () => {}
// const asyncHandler = (func) => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

// NOTE: - 'req', 'res' and 'next' we are extracting from passed function.

// *********** For Async/await
// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch(error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// };

/* NOTES: - Promise((resolve, reject) => {}) and Promise.resolve() are two different ways to create a 
Promise in JavaScript, but they serve different purposes.

new Promise((resolve, reject) => {}): This is the constructor syntax to create a new Promise. 
Inside the executor function, you can write asynchronous code. When the asynchronous operation 
completes successfully, you call resolve(value) to indicate that the promise should be fulfilled 
with the given value. If the operation encounters an error, you call reject(error) to indicate that 
the promise should be rejected with the given error.

let promise = new Promise((resolve, reject) => {
    // some asynchronous operation
    if (/< operation successful >/) {
        resolve(value);
    } else {
        reject(error);
    }
});

Promise.resolve(value): This is a shortcut to create a Promise that is immediately resolved with 
the given value. It's useful when you want to return a Promise from a function, but the value is 
already available synchronously.

let promise = Promise.resolve(value);

In the context of your asyncHandler function, Promise.resolve(requestHandler(req, res, next)) is 
used to ensure that requestHandler(req, res, next) returns a Promise. If requestHandler(req, res, next) 
is already a Promise, it will be returned as is. If it's not a Promise, it will be wrapped in a resolved Promise. 
This allows the .catch() method to be called on it to handle any errors that might be thrown.
*/