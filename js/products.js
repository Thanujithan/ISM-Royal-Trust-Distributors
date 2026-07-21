// Search Products

const searchInput=document.getElementById("searchInput");
const productCards=document.querySelectorAll(".product-card");

searchInput.addEventListener("keyup",function(){
    let value=this.value.toLowerCase();

    productCards.forEach(card=>{
        let text=card.innerText.toLowerCase();

        if(text.includes(value)){
            card.style.display="block";
        }else{
            card.style.display="none";
        }
    });
});

// Category Filter

const filterButtons=document.querySelectorAll(".filter-buttons button");

filterButtons.forEach(button=>{
    button.addEventListener("click",function(){

        filterButtons.forEach(btn=>btn.classList.remove("active"));
        this.classList.add("active");

        const category=this.textContent.toLowerCase();

        productCards.forEach(card=>{

            const productCategory=card.querySelector(".category").textContent.toLowerCase();

            if(category==="all" || productCategory.includes(category)){
                card.style.display="block";
            }else{
                card.style.display="none";
            }

        });

    });
});

// Add To Cart

const cartButtons=document.querySelectorAll(".btn-cart");

cartButtons.forEach(button=>{
    button.addEventListener("click",function(){
        alert("Product added to cart successfully.");
    });
});

// View Details

const viewButtons=document.querySelectorAll(".btn-view");

viewButtons.forEach(button=>{
    button.addEventListener("click",function(e){
        e.preventDefault();
        alert("Product details page will be available soon.");
    });
});

// Product Hover Effect

productCards.forEach(card=>{
    card.addEventListener("mouseenter",function(){
        this.style.transform="translateY(-10px)";
    });

    card.addEventListener("mouseleave",function(){
        this.style.transform="translateY(0)";
    });
});

// Scroll Animation

const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.style.opacity="1";
            entry.target.style.transform="translateY(0)";
        }
    });
},{
    threshold:0.2
});

productCards.forEach(card=>{
    card.style.opacity="0";
    card.style.transform="translateY(30px)";
    card.style.transition=".6s";
    observer.observe(card);
});

// Header Shadow

window.addEventListener("scroll",function(){

    const header=document.querySelector("header");

    if(window.scrollY>50){
        header.style.boxShadow="0 5px 15px rgba(0,0,0,.2)";
    }else{
        header.style.boxShadow="none";
    }

});