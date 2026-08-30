// backend/middleware/appError.middleware.js
export class AppError extends Error {
    constructor(message, status = 500, code = undefined) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export const badRequest = (message, code) => new AppError(message, 400, code);
export const notFound = (message = 'Not found', code) => new AppError(message, 404, code);
export const forbidden = (message = 'Forbidden', code) => new AppError(message, 403, code);
export const unauthorized = (message = 'Unauthorized', code) => new AppError(message, 401, code);
export const conflict = (message = 'Conflict', code) => new AppError(message, 409, code);