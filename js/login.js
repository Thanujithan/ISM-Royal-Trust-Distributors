document.addEventListener("DOMContentLoaded",()=>{

const loginForm=document.getElementById("loginForm");
const emailInput=document.getElementById("loginEmail");
const passwordInput=document.getElementById("loginPassword");
const message=document.getElementById("loginMessage");
const rememberMe=document.getElementById("rememberMe");

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

loginForm.addEventListener("submit",async e=>{
    e.preventDefault();

    clearErrors();

    const email=emailInput.value.trim();
    const password=passwordInput.value;
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

    try{
        const response=await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data=await response.json();

        if(response.ok){
            if(rememberMe.checked){
                localStorage.setItem("token",data.token);
                localStorage.setItem("user",JSON.stringify(data.user));
            }else{
                sessionStorage.setItem("token",data.token);
                sessionStorage.setItem("user",JSON.stringify(data.user));
            }

            showMessage("Login successful! Redirecting...","success");

            setTimeout(()=>{
                window.location.href="index.html";
            },1200);

        }else{
            showMessage(
                data.message||"Invalid email or password.",
                "error"
            );
        }

    }catch(error){
        console.error("Login error:",error);

        showMessage(
            "Cannot connect to the server. Please try again.",
            "error"
        );

    }finally{
        button.disabled=false;
        button.innerHTML=
        '<span>Login</span><i class="fas fa-arrow-right"></i>';
    }
});

document.getElementById("forgotPassword").addEventListener("click",e=>{
    e.preventDefault();

    showMessage(
        "Forgot password feature will be added later.",
        "error"
    );
});

function showError(id,text){
    const input=document.getElementById(id);
    const error=document.getElementById(id+"Error");

    if(input){
        const inputBox=input.closest(".input-box");

        if(inputBox){
            inputBox.classList.add("error");
        }
    }

    if(error){
        error.textContent=text;
    }
}

function clearErrors(){
    document.querySelectorAll(".input-box").forEach(box=>{
        box.classList.remove("error");
    });

    document.querySelectorAll(".error-message").forEach(error=>{
        error.textContent="";
    });

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