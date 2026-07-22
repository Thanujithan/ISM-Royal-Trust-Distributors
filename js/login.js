document.addEventListener("DOMContentLoaded",()=>{

const loginForm=document.getElementById("loginForm");
const emailInput=document.getElementById("loginEmail");
const passwordInput=document.getElementById("loginPassword");
const message=document.getElementById("loginMessage");

document.querySelectorAll(".password-toggle").forEach(button=>{
    button.addEventListener("click",()=>{
        const input=document.getElementById(button.dataset.target);
        const icon=button.querySelector("i");

        if(input.type==="password"){
            input.type="text";
            icon.classList.replace("fa-eye","fa-eye-slash");
        }else{
            input.type="password";
            icon.classList.replace("fa-eye-slash","fa-eye");
        }
    });
});

loginForm.addEventListener("submit",e=>{
    e.preventDefault();

    clearErrors();

    const email=emailInput.value.trim();
    const password=passwordInput.value.trim();
    let valid=true;

    if(email===""){
        showError("loginEmail","Email address is required.");
        valid=false;
    }else if(!validateEmail(email)){
        showError("loginEmail","Enter a valid email address.");
        valid=false;
    }

    if(password===""){
        showError("loginPassword","Password is required.");
        valid=false;
    }else if(password.length<6){
        showError("loginPassword","Password must contain at least 6 characters.");
        valid=false;
    }

    if(!valid){
        showMessage("Please correct the highlighted fields.","error");
        return;
    }

    const button=loginForm.querySelector(".auth-btn");
    button.disabled=true;
    button.innerHTML='<i class="fas fa-spinner fa-spin"></i> Logging in...';

    setTimeout(()=>{
        showMessage("Login successful! Redirecting...","success");

        button.disabled=false;
        button.innerHTML='<span>Login</span><i class="fas fa-arrow-right"></i>';

        setTimeout(()=>{
            window.location.href="index.html";
        },1200);
    },1200);
});

document.getElementById("forgotPassword").addEventListener("click",e=>{
    e.preventDefault();
    const email=emailInput.value.trim();

    if(email===""){
        showMessage("Enter your email address to reset your password.","error");
    }else{
        showMessage("Password reset instructions have been sent to your email.","success");
    }
});

function showError(id,text){
    const input=document.getElementById(id);
    const error=document.getElementById(id+"Error");

    input.closest(".input-box").classList.add("error");
    error.textContent=text;
}

function clearErrors(){
    document.querySelectorAll(".input-box").forEach(box=>box.classList.remove("error"));
    document.querySelectorAll(".error-message").forEach(error=>error.textContent="");
    message.textContent="";
    message.className="form-message";
}

function showMessage(text,type){
    message.textContent=text;
    message.className="form-message "+type;
}

function validateEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

});