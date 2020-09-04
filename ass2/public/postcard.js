let preC = 0;

function changeColor(colorIndex) {
    let ser = [" wheat", " tan", " seaGreen", " paleBlue", " blueGray", " lavender", " pink", " whitish", " grey"];

    let b = document.getElementsByClassName("theCard");
    let i, j;
    for (i = 0; i < b.length; i++) {
        for (j = 0; j < ser.length; j++) {
            b[i].className = b[i].className.replace(ser[j], "");
        }
    }

    b[0].className += ser[colorIndex];
}

function changeBorder(colorIndex) {
    let a = document.getElementsByClassName("currColor");
    let i;
    for (i = 0; i < a.length; i++) {
        a[i].className = a[i].className.replace(" solBorder", "");
    }

    a[colorIndex].className += " solBorder";
}


function onclickColor (colorIndex) {
    changeColor(colorIndex);
    changeBorder(colorIndex);
    preC = colorIndex;
}

function previewColor (colorIndex) {
    changeColor(colorIndex);
}

function previousColor() {
    changeColor(preC);
}


function changeFont(fontIndex) {
    let ser = [" dancingScript", " indieFlower", " longCang", " homeMadeApple"]

    let f = document.getElementsByClassName("theMessage");

    let d = document.getElementsByClassName("dimondLi");


    let i, j;
    for (i = 0; i < f.length; i++) {
        for (j = 0; j < ser.length; j++) {
            f[i].className = f[i].className.replace(ser[j], "");
            d[j].innerHTML = "&#8900;";
        }
    }

    d[fontIndex].innerHTML = "&#10070;";
    f[0].className += ser[fontIndex];
}

let imageSrc;

function uploadFile() {

    const selectedFile = document.getElementById('fileChooser').files[0];

    const formData = new FormData();

    formData.append('newImage',selectedFile, selectedFile.name);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/upload", true);

    xhr.onloadend = function(e) {

        console.log(xhr.responseText);
        imgLoaded();

        let newImage = document.getElementById("serverImage");
        newImage.src = "../images/"+selectedFile.name;

        imageSrc = "../images/"+selectedFile.name;

    };



    document.getElementById("theLabel").textContent = "Uploading...";

    xhr.send(formData);
}

function imgLoaded() {
    let c = document.getElementsByClassName("chooseImage");

    c[0].className += " chooseAfter";
    document.getElementById("theLabel").textContent = "Replace Image";
}

document.getElementById("fileChooser").addEventListener("change",uploadFile);


function getRecipent() {


    let bc = window.getComputedStyle(document.getElementById("finalCard"), null).getPropertyValue("background-color");
    let ct = document.getElementById("finalMessage").textContent;
    let ff = window.getComputedStyle(document.getElementById("finalMessage"), null).getPropertyValue("font-family");
    let postCard = {postImage: imageSrc, postBackgroundColor: bc, postFont: ff, postMessage: ct};
    let postJson = JSON.stringify(postCard);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/sharepostCard", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onloadend = function(e) {

        console.log(xhr.responseText);
        window.location.href = "https://joyous-periodic-drive.glitch.me/noble-display.html";
    };
    xhr.send(postJson);
}

document.getElementById("shareButton").addEventListener("click", getRecipent);