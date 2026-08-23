export const errorHandler = (err, req, res, next) => {
    res.status(err.status || 500).send({
        message: err.message,
        code: err.code,
        data: null,
        success: false
    })
}
