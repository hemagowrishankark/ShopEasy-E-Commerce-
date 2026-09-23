    const validate = (schema) => {
        
        return (req, res,next)=>{
            const {error} = schema.validate(req.body,
                {abortEarly:false
            });

            if (error) {

                const errors = {};
                error.details.forEach((detail) =>{
                    const field = detail.path[0];
                    errors [field] = detail.message;
                });
                return res.status(400).json({
                      message: "Validation failed",
                        errors: errors
                });
            }

            next();
        };
    };

    module.exports =validate;