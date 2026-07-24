let passwordModal;

let googleClient;

window.onload = function () {

    passwordModal = new bootstrap.Modal(
        document.getElementById("PasswordModal")
    );

    // Initialize Google Identity Services
    google.accounts.id.initialize({
        client_id: "685548395864-6ai103mk15p914vp9g2tboi2jk71ge30.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    // When clicking the button, trigger the Google prompt
    document.getElementById("googleLogin").addEventListener("click", () => {
        google.accounts.id.prompt(); 
    });

};

// runs automatically once Google authenticates the user
async function handleCredentialResponse(response) {
    console.log("Google Auth Response:", response);

    try {
        const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: response.credential // converts the respoinse to a usable format
            })
        });

        const data = await res.json();

        if (res.ok) {
            // Login successful! Redirect to feed
            window.location.href = "/cart";
        } else {
            console.error("Google login rejected by server:", data.message);
        }
    } catch (err) {
        console.error("Failed to send Google token to server:", err);
    }
}

function validateInfo() {
    const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // email regex 
    let info = document.getElementById("mail").value.trim(); //gets the email string
    if (!email_regex.test(info)) { //tests if the email is in the correct email
        document.getElementById("mail").style.setProperty('--placeholder-color', 'red'); // sets the placeholder color to red
        document.getElementById("mail").value = ""; // clears the email field
        document.getElementById("mail").placeholder = "Invalid Email please try again"; //changes the placeholder text to an invaild message
        return false;
    }
    return true;
}
function showModal() {
    if (validateInfo()) { // if the email is good it will open the modal of the password
        const info = document.getElementById("mail").value.trim();
        document.getElementById("infoDisplay").innerText = info;
        passwordModal.show(); 
    }
}
function closeModal() { //hides the password modal
    passwordModal.hide();
}
async function nextPage() { 
    const passwordInput = document.getElementById("passwordInput");
    const errorText = document.getElementById("passwordError");
    let no_letters = true;
    let no_numbers = true;
    for(let i = 0; i < passwordInput.value.length; i++){ //checks if the password is valid
        if(/^[a-zA-Z]$/.test(passwordInput.value[i])){
            no_letters = false;
        }
        else if(/^[0-9]$/.test(passwordInput.value[i])){
            no_numbers = false;
        }
    }
    if (passwordInput.value.length < 8 || no_letters || no_numbers) { //if it isn't valid it shows the error message
        errorText.style.display = "block";
        return
    }
    else if (!passwordInput.value) { 
        errorText.textContent = "Please enter your password";
        errorText.style.display = "block";
        return;
    }
    
    await sendLoginRequest();
}

async function sendLoginRequest() {
    const mail = document.getElementById("mail").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const errorText = document.getElementById("passwordError");
    console.log("sent fetch request")
    try {
        // Send post request to /api/auth/login
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mail, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Server accepted credentials!
            window.location.href = "/feed.html";
        } else {
            // Server rejected credentials (e.g. status 401 "Wrong email or password")
            errorText.textContent = data.message;
            errorText.style.display = "block";
        }
    } catch (err) { 
        console.error("Login request failed:", err);
        errorText.textContent = "Server unreachable. Please try again later.";
        errorText.style.display = "block";
    }
}
function toggleVisability() {
    const passwordInput = document.getElementById("passwordInput");
    const eyeIcon = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        // Swap to the eye-slash icon
        eyeIcon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
        passwordInput.type = "password";
        // Swap back to the regular eye icon
        eyeIcon.classList.replace("bi-eye-slash", "bi-eye");
    }
    //changes the password from seen to dots
}

function loginWithFacebook(){
    FB.login(function(response) {
        if (response.authResponse){
            const accessToken = response.authResponse.accessToken;
            sendFacebookTokenToServer(accessToken);
        }
        else{
            console.log('User cancelled login or did not fully authorize.');
        }
    }, { scope: 'public_profile,email' }); // request profile and email access
}

// Sends the token to the Express server for verification and database lookup
async function sendFacebookTokenToServer(accessToken) {
    try {
        const response = await fetch("/api/auth/facebook", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ accessToken })
        });

        const data = await response.json();

        if (response.ok) {
            // if ok redirect user to main application page
            window.location.href = "../Feed/Feed.html"; // Adjust to your actual feed path
        } else {
            alert(data.message || "Facebook authentication failed.");
        }
    } catch (error) {
        console.error("Network error during Facebook authentication:", error);
    }
}