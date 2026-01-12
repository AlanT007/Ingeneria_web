let darkmode = localStorage.getItem('darkmode')
const themeSwitch = document.getElementById('theme-switch')
// Darkmode:

const enableDarkmode = () => {
    document.body.classList.add('darkmode')
    localStorage.setItem('darkmode', 'active')
}

const disbleDarkmode = () => {
    document.body.classList.remove('darkmode')
    localStorage.setItem('darkmode', null)
}

if(darkmode === "active") enableDarkmode()

themeSwitch.addEventListener("click", () => {
    darkmode = localStorage.getItem('darkmode')
    darkmode !== "active" ? enableDarkmode() : disbleDarkmode()
})

//Loader:

window.addEventListener("load", () =>{
    const loader = document.querySelector(".loader");

    loader.classList.add("loader-hidden");

    loader.addEventListener("transitioned", () => {
        document.body.removeChild("loader");
    })
})

//Spinner

function initStepper(node){

    let stepperInput = {
        el:document.querySelector(".stepper input"),
        masBtn:document.querySelector(".stepper .custom-input .mas-stepper"),
        menosBtn:document.querySelector(".stepper .custom-input .menos-stepper"),
        list:document.querySelector(".stepper .custom-input .stepper-list")
    };

    stepperInput.min = parseInt(stepperInput.el.getAttribute("min"));
    stepperInput.max = parseInt(stepperInput.el.getAttribute("max"));
    stepperInput.value = parseInt(stepperInput.el.getAttribute("value"));

    for(let i = stepperInput.min; i <= stepperInput.max; i++){
        stepperInput.list.innerHTML += `<span> ${i} </span>`;
    }

    stepperInput.list.style.marginTop = `-${stepperInput.value*80}px`;
    stepperInput.list.style.transition = `all 0.3s ease-in-out`;

    stepperInput.menosBtn.addEventListener("click",function(){
        let value = parseInt(stepperInput.el.getAttribute("value"));
        if(value != stepperInput.min){
            value--;
            stepperInput.el.setAttribute("value",value);
            stepperInput.list.style.marginTop = `-${value*80}px`;
        }
    });

    stepperInput.masBtn.addEventListener("click",function(){
        let value = parseInt(stepperInput.el.getAttribute("value"));
        if(value != stepperInput.max){
            value++;
            stepperInput.el.setAttribute("value",value);
            stepperInput.list.style.marginTop = `-${value*80}px`;
        }
    });
}

initStepper(document.querySelector(".stepper"));