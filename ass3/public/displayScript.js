// This code runs as soon as the page is loaded, when 
// the script tag in the HTML file is executed. 

// It sends a GET request for the JSON file postcardData.json 

let xhr = new XMLHttpRequest();

const queryId = window.location.search;
xhr.open("GET", '/showpostcard'+queryId, true);
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

// set up callback function that will run when the HTTP response comes back
xhr.onloadend = function(e) {
  console.log(xhr.responseText);
  
  // responseText is a string
  let data = JSON.parse(xhr.responseText);
  
  // get the postcard data out of the object "data" and 
  // configure the postcard
  let postcardImage = document.getElementById("cardImg");
  postcardImage.style.display = 'block';
  postcardImage.src = data.imageSrc;
  let postcardMessage = document.getElementById("message");
  //postcardMessage.textContent = data.message;
  // textContent throws away newlines; so use innerText instead
  postcardMessage.innerText = data.postMessage; 
  postcardMessage.className = data.fontFamily;
  document.querySelector(".postcard").style.backgroundColor = data.backgroundColor;
}

// send off request
xhr.send();

