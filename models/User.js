const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for one user with this exact username.
function findByMail(mail) {
    return getDb().collection('users').findOne({ mail });
}

function findByGoogleId(googleId){ //Looks for one user wtih this exact google id.
    return getDb().collection('users').findOne({ googleId })
}

function linkGoogleAccount(mail, googleId) { // update the collection user to add googleId to exisiting one without.
    return getDb().collection("users").updateOne({ mail } , {$set: { googleId }});
}
function findByFacebookId(facebookId) {
    return getDb().collection('users').findOne({ facebookId });
}
function linkFacebookAccount(mail, facebookId) {
    return getDb().collection("users").updateOne({ mail }, { $set: { facebookId } });
}
// Saves a brand new user document into the "users" collection.
function createUser(userData) {
    return getDb().collection('users').insertOne(userData);
}

function UpdateCCByMail(user_mail,new_sccn){
    return getDb().collection('users').updateOne({mail: user_mail},{ $set: { sccn: new_sccn  }});
}



module.exports = { findByMail, findByGoogleId, linkGoogleAccount, findByFacebookId, linkFacebookAccount, createUser, UpdateCCByMail };