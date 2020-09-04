
//Countdown section
var targetDate = "2020-5-10";

window.setInterval(function() {
    refreshTime(targetDate);
}, 1000);

function refreshTime(targetDate) {
    var Today = new Date();
    var endDate = new Date(targetDate);
    var leftTime = endDate - Today;
    var leftSec = parseInt(leftTime / 1000);

    var nf = new Intl.NumberFormat();

    document.getElementById("countDown").textContent = nf.format(leftSec);
}


//gallery section
var picIndex = 1;

function nexImg () {
    showImg(picIndex+1)
}

function preImg () {
    showImg(picIndex-1)
}

function showImg(nextIndex) {
    var g = document.getElementsByClassName("theImg");
    var i;
    var t = document.getElementsByClassName("currPic");

    //set all image to invisible
    for (i = 0; i < g.length; i++) {
        g[i].style.display = "none";
    }

    if (nextIndex > g.length) { nextIndex = 1};
    if (nextIndex == 0) { nextIndex = g.length}

    //only display the current image
    g[nextIndex-1].style.display = "block";

    //update thisImgbutton opacity
    for (i=0; i < t.length; i++) {
        t[i].className = t[i].className.replace(" opa07", "");
    }

    t[nextIndex-1].className += " opa07";

    //update current index
    picIndex = nextIndex;

    var indexNav = '';

    document.getElementById("imgIndex").textContent = indexNav.concat(picIndex.toString(10), ' / ', g.length.toString(10));
}

function thisImg(index) {
    showImg(index);
}