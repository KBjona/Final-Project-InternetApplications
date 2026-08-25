const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to

// Looks for one user with this exact username.
function findByMail(mail) {
    console.log("searched for user" + mail);
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
    console.log("Added user to collection");
    return getDb().collection('users').insertOne(userData);
}
function updateUserProfile(mail, updateData){
    return getDb().collection('users').updateOne({ mail }, {$set: updateData});
}

function Follow(mail, tofollow){
    return getDb().collection('users').updateOne({mail}, {$addToSet: {followings: tofollow}});
}


function Unfollow(mail, tofollow){
    return getDb().collection('users').updateOne({mail}, {$pull: {followings: tofollow}});
}

module.exports = {
    findByMail,
    findByGoogleId,
    linkGoogleAccount,
    findByFacebookId, 
    linkFacebookAccount, 
    createUser, 
    updateUserProfile,
    Follow,
    Unfollow
 }; // export all the functions