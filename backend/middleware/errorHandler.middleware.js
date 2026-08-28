export const errorHandler = (err, req, res, next) => {
    if (err?.code === 11000) {
        const duplicateFields = Object.keys(err.keyPattern || err.keyValue || {});
        const duplicateUsername = duplicateFields.includes('Username');
        const duplicateEmail = duplicateFields.includes('Email');
        const usernameMessage = 'User \u0111\u00e3 nh\u1eadp tr\u00f9ng';
        const emailMessage = 'Email \u0111\u00e3 nh\u1eadp tr\u00f9ng';

        return res.status(409).json({
            success: false,
            duplicateUsername,
            duplicateEmail,
            errors: {
                ...(duplicateUsername ? { Username: usernameMessage } : {}),
                ...(duplicateEmail ? { Email: emailMessage } : {}),
            },
            message: [
                duplicateUsername ? usernameMessage : '',
                duplicateEmail ? emailMessage : '',
            ].filter(Boolean).join(' và '),
        });
    }

    res.status(err.status || 500).send({
        message: err.message,
        code: err.code,
        data: null,
        success: false,
    });
};
