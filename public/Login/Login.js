let passwordModal;

window.onload = function () {
    passwordModal = new bootstrap.Modal(document.getElementById("PasswordModal"));
};

function validateInfo() {
    const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // email regex 
    let info = document.getElementById("info").value.trim(); //gets the email string
    if (!email_regex.test(info)) { //tests if the email is in the correct email
        document.getElementById("info").style.setProperty('--placeholder-color', 'red'); // sets the placeholder color to red
        document.getElementById("info").value = ""; // clears the email field
        document.getElementById("info").placeholder = "Invalid Email please try again"; //changes the placeholder text to an invaild message
        return false;
    }
    return true;
}
function showModal() {
    if (validateInfo()) { // if the email is good it will open the modal of the password
        const info = document.getElementById("info").value.trim();
        document.getElementById("infoDisplay").innerText = info;
        passwordModal.show(); 
    }
}
function closeModal() { //hides the password modal
    passwordModal.hide();
}
function nextPage() { 
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
    }
    
    else { //if it is valid it uploads the info to the session storage and moves you to the feed page
        upload_info();
        window.location.href = "feed.html";
    }
}

function upload_info() {
    let un = document.getElementById("info").value.trim(); //gets the email string
    un = un.split("@")[0]; //gets only the first part of the email before the @
    let td = String(Math.floor(Math.random() * 100)); //generates a new number for the tag
    let ut = "@" + un + "_" + td; //creates the tag
    
    sessionStorage.setItem("username", un);
    sessionStorage.setItem("usertag", ut);
    //uploads the username and tag to the session storage
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