const serviceCards=document.querySelectorAll(".service-card");
const processBoxes=document.querySelectorAll(".process-box");
const whyCards=document.querySelectorAll(".why-card");
const statNumbers=document.querySelectorAll(".stat-box h2");

// Scroll Animation
const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.classList.add("show");
        }
    });
},{
    threshold:0.2
});

serviceCards.forEach(card=>{
    card.classList.add("hidden");
    observer.observe(card);
});

processBoxes.forEach(box=>{
    box.classList.add("hidden");
    observer.observe(box);
});

whyCards.forEach(card=>{
    card.classList.add("hidden");
    observer.observe(card);
});

// Counter Animation
let counterStarted=false;

const statisticsSection=document.querySelector(".statistics");

const counterObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting && !counterStarted){
            counterStarted=true;

            statNumbers.forEach(number=>{
                const target=parseInt(number.textContent);
                let count=0;
                const speed=Math.max(20,1500/target);

                const updateCounter=setInterval(()=>{
                    count++;
                    number.textContent=count+"+";

                    if(count>=target){
                        number.textContent=target+"+";
                        clearInterval(updateCounter);
                    }
                },speed);
            });
        }
    });
},{
    threshold:0.4
});

if(statisticsSection){
    counterObserver.observe(statisticsSection);
}

// Header Shadow
const header=document.querySelector("header");

window.addEventListener("scroll",()=>{
    if(window.scrollY>50){
        header.style.boxShadow="0 5px 18px rgba(0,0,0,.25)";
    }else{
        header.style.boxShadow="0 3px 10px rgba(0,0,0,.15)";
    }
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener("click",function(e){
        const target=document.querySelector(this.getAttribute("href"));

        if(target){
            e.preventDefault();
            target.scrollIntoView({
                behavior:"smooth"
            });
        }
    });
});