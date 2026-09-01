const { ObjectId } = require('mongodb');
const { getDb } = require('./db'); // getDb() gives us the "nozama" database your db.js already connects to


// Looks for one user with this exact username.
function findByMail(mail) {
    if (typeof mail !== 'string') return res.status(400).json({ message: 'Invalid email' });
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
function linkFacebookAccount(mail, facebookId, facebookPages) {
    return getDb().collection("users").updateOne({ mail }, { $set: { facebookId, facebookPages } });
}

function updateFacebookPages(fb_id, fb_pages) {
    return getDb().collection("users").updateOne({ facebookId: fb_id }, { $set: { facebookPages: fb_pages } });
}

// Saves a brand new user document into the "users" collection.
function createUser(userData) {
    return getDb().collection('users').insertOne(userData);
}
function updateUserProfile(mail, updateData){
    return getDb().collection('users').updateOne({ mail }, {$set: updateData});
}
function deleteUserByMail(mail){
    return getDb().collection('users').deleteOne({mail: mail});
}
function UpdateCCByMail(user_mail,new_sccn){
    return getDb().collection('users').updateOne({mail: user_mail},{ $set: { sccn: new_sccn  }});
}

function Follow(mail, tofollow){
    return getDb().collection('users').updateOne({mail}, {$addToSet: {followings: tofollow}});
}

function Unfollow(mail, tofollow){
    return getDb().collection('users').updateOne({mail}, {$pull: {followings: tofollow}});
}

function CheckFollow(mail, tofollow){
    return getDb().collection('users').countDocuments({mail: mail, followings: tofollow}, {limit: 1});
}

module.exports = {
    findByMail,
    findByGoogleId,
    linkGoogleAccount,
    findByFacebookId, 
    linkFacebookAccount, 
    updateFacebookPages,
    createUser, 
    updateUserProfile,
    deleteUserByMail,
    UpdateCCByMail,
    Follow,
    Unfollow,
    CheckFollow
 }; // export all the functions
