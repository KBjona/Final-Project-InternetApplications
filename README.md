# Final-Project-InternetApplications

First of all after downloading this project install these libraries in your IDE:
```
npm install node express mongodb bcrypt express-session google-auth-library dotenv d3 express-rate-limit rate-limit-mongo
```
# If you didn't get a .env file create a new one in the folder. It should include:
**MONGO_URI**, \
**PORT** (the port you'll run this in), \
**SESSION_SECRET** (the session key), \
**GOOGLE_CLIENT_ID** and **GOOGLE_CLIENT_SECRET** (for the google authentication), \
for the **FACEBOOK_APP_ID** since it is public you can put it in the code itself not the .env.

#
To run this write in the terminal: node Node.js
#

# About Us and this App:
We created an **Amazon** copy but with some twists we think are nice, for example when you create a store you have much more freedom - you can change the color palette and still have a simple but authentic look.
In addition we try to help with the crazy inflation so in our website once you give it a price tag that's it. We do it so you will know that even if you want to buy a product a year later you could buy it at the same price it is today.
We believe in making both the customer and the seller satisfied so we made creating and managing a store simple. Initially, you answer a few questions about the store and the product you sell there and after so create the store you can edit it, see graphs about the store and even create a post in **Facebook** about your store.
\
\
\

# If you get problems with running this application try this:
to look for demons:
```
tasklist | findstr node
```

to kill demons:
```
taskkill /PID {demon_number} /F
```
