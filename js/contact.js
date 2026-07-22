document.addEventListener("DOMContentLoaded",()=>{

const form=document.getElementById("contactForm");
const message=document.getElementById("formMessage");

form.addEventListener("submit",function(e){
    e.preventDefault();

    const name=document.getElementById("fullName").value.trim();
    const email=document.getElementById("email").value.trim();
    const phone=document.getElementById("phone").value.trim();
    const subject=document.getElementById("subject").value;
    const text=document.getElementById("message").value.trim();

    if(name===""||email===""||phone===""||subject===""||text===""){
        message.style.color="red";
        message.textContent="Please fill in all required fields.";
        return;
    }

    message.style.color="green";
    message.textContent="Your message has been sent successfully!";

    form.reset();

    setTimeout(()=>{
        message.textContent="";
    },3000);
});

const questions=document.querySelectorAll(".faq-question");

questions.forEach(question=>{
    question.addEventListener("click",()=>{

        const item=question.parentElement;

        document.querySelectorAll(".faq-item").forEach(faq=>{
            if(faq!==item){
                faq.classList.remove("active");
                faq.querySelector(".faq-answer").style.maxHeight=null;
            }
        });

        item.classList.toggle("active");

        const answer=item.querySelector(".faq-answer");

        if(item.classList.contains("active")){
            answer.style.maxHeight=answer.scrollHeight+"px";
        }else{
            answer.style.maxHeight=null;
        }

    });
});

const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.classList.add("show");
        }
    });
});

document.querySelectorAll(".info-card,.contact-content,.contact-form-box,.map-wrapper,.faq-item,.contact-cta").forEach(el=>{
    el.classList.add("hidden");
    observer.observe(el);
});

window.addEventListener("scroll",()=>{
    const header=document.querySelector("header");

    if(window.scrollY>50){
        header.style.boxShadow="0 6px 18px rgba(0,0,0,.2)";
    }else{
        header.style.boxShadow="0 3px 10px rgba(0,0,0,.15)";
    }
});

});