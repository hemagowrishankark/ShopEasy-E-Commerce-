const validateParams = (schema)=>{

    return(req,ress,next)=>{
        const {error} =schema.validate(req.params, {
            aboutEarly:false
        });
        
        if (error){
            const errors ={};

            error.details.forEach((detail) => {
                const filed = detail.path[0];
                errors[filed]=detail.message;
            });     
            
            return ress.status (400).json({
             message:"Invalid parameters",
             errors:errors
            });   
        }

        next();
    };
};

module.exports = validateParams;