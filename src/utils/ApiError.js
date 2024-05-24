class ApiError extends Error {
    constructor(
        statusCode, 
        message = "Something went wrong", 
        errors = [], 
        stack = "") {
            super(message);
            this.stausCode = statusCode;
            this.data = null; // NEED TO EXPLORE
            this.message = message;
            this.success = false;
            this.errors = errors;

            if (stack) { // NEED TO EXPLORE
                this.stack = stack;
            } else {
                Error.captureStackTrace(this, this.constructor)
            }
    }
}

export {ApiError}

/* 
NOTE: - Error.captureStackTrace(this, this.constructor) is used to attach a stack trace to the current 
instance (this) of the error object, excluding the error constructor function itself from the stack trace.
*/