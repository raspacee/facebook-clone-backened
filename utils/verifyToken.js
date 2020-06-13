const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];

    if (typeof header !== 'undefined'){
        const token = header.split(' ')[1];
        jwt.verify(token, 'cat', (err, authorizedData) =>{
            if(err){
                return res.status(403).json({ error: 'Token is not real'})
            }else{
                req.authorizedData = authorizedData;
                next();
            }
        })
    }else{
        return res.status(403).json({ error: 'No token detected' })
    }
}

module.exports = verifyToken;
