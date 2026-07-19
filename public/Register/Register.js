let passwordModal;

window.onload = function () {
    passwordModal = new bootstrap.Modal(document.getElementById("PasswordModal"));
};

function validateRegister() {
    let valid = true;

    const fields = [
        {
            element: document.getElementById("fname"),
            check: value => value.trim() !== "",
            message: "First name required"
        },
        {
            element: document.getElementById("lname"),
            check: value => value.trim() !== "",
            message: "Last name required"
        },
        {
            element: document.getElementById("mail"),
            check: value => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
            message: "Invalid email"
        }
    ];

    fields.forEach(field => {
        clearInvalid(field.element);

        if (!field.check(field.element.value)) {
            markInvalid(field.element, field.message);
            valid = false;
        }
    });

    return valid;
}
function markInvalid(element, message = "") { //helper function 
    element.classList.add("invalid"); // adds the class to the item for the css to change dynamcally

    if (message) {
        element.value = "";
        element.placeholder = message;
    }
}

function clearInvalid(element) {
    element.classList.remove("invalid");
}
function showModal() {
    if (validateRegister()) { // if the email is good it will open the modal of the password
        const info = document.getElementById("mail").value.trim();
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
    let un = document.getElementById("mail").value.trim(); //gets the email string
    un = un.split("@")[0]; //gets only the first part of the email before the @
    let td = String(Math.floor(Math.random() * 100)); //generates a new number for the tag
    let ut = "@" + un + "_" + td; //creates the tag
    
    sessionStorage.setItem("username", un);
    sessionStorage.setItem("usertag", ut);
    //uploads the username and tag to the session storage
}

function toggleVisibility(inputId, iconContainer) { //be able to see both passwords
    const input = document.getElementById(inputId);
    const icon = iconContainer.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("bi-eye", "bi-eye-slash"); //change them
    } else {
        input.type = "password";
        icon.classList.replace("bi-eye-slash", "bi-eye");
    }
}