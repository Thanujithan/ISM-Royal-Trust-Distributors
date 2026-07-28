document.addEventListener("DOMContentLoaded",()=>{

const registerForm=document.getElementById("registerForm");
const message=document.getElementById("registerMessage");

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

registerForm.addEventListener("submit",async e=>{
    e.preventDefault();

    clearErrors();

    const firstName=document.getElementById("firstName").value.trim();
    const lastName=document.getElementById("lastName").value.trim();
    const email=document.getElementById("registerEmail").value.trim();
    const phone=document.getElementById("registerPhone").value.trim();
    const password=document.getElementById("registerPassword").value;
    const confirmPassword=document.getElementById("confirmPassword").value;
    const terms=document.getElementById("terms").checked;

    let valid=true;

    if(firstName===""){
        showError("firstName","First name is required.");
        valid=false;
    }

    if(lastName===""){
        showError("lastName","Last name is required.");
        valid=false;
    }

    if(email===""){
        showError("registerEmail","Email address is required.");
        valid=false;
    }else if(!validateEmail(email)){
        showError("registerEmail","Enter a valid email address.");
        valid=false;
    }

    if(phone===""){
        showError("registerPhone","Phone number is required.");
        valid=false;
    }else if(!/^[0-9+\s-]{9,15}$/.test(phone)){
        showError("registerPhone","Enter a valid phone number.");
        valid=false;
    }

    if(password===""){
        showError("registerPassword","Password is required.");
        valid=false;
    }else if(password.length<6){
        showError("registerPassword","Use at least 6 characters.");
        valid=false;
    }

    if(confirmPassword===""){
        showError("confirmPassword","Confirm your password.");
        valid=false;
    }else if(password!==confirmPassword){
        showError("confirmPassword","Passwords do not match.");
        valid=false;
    }

    if(!terms){
        document.getElementById("termsError").textContent=
        "You must accept the terms and conditions.";
        valid=false;
    }

    if(!valid){
        showMessage("Please correct the highlighted fields.","error");
        return;
    }

    const button=registerForm.querySelector(".auth-btn");
    button.disabled=true;
    button.innerHTML=
    '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    try{
        const response=await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    name:`${firstName} ${lastName}`,
                    email:email,
                    password:password,
                    phone:phone
                })
            }
        );

        const data=await response.json();

        if(response.ok){
            showMessage(
                "Account created successfully! Redirecting to login...",
                "success"
            );

            registerForm.reset();

            setTimeout(()=>{
                window.location.href="login.html";
            },1500);

        }else{
            showMessage(
                data.message||"Registration failed. Please try again.",
                "error"
            );
        }

    }catch(error){
        console.error("Registration error:",error);

        showMessage(
            "Cannot connect to the server. Please try again.",
            "error"
        );

    }finally{
        button.disabled=false;
        button.innerHTML=
        '<span>Create Account</span><i class="fas fa-user-plus"></i>';
    }
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