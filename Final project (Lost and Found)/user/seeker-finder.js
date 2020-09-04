//let msg = document.getElementById("cookieMessage");
//msg.textContent = msg.textContent+decodeURIComponent(document.cookie);

/*
 * first part is for navigating between different pages!
 */
let isSeeker = true;
let homepage = document.getElementById("homepage");
let firstPage = document.getElementById("fshomepage");
let secondPage = document.getElementById("finderitemp1");
let thirdPage = document.getElementById("finderitemp2");
let fourthPage = document.getElementById("findersearchpage");
let finalPage = document.getElementById("finalpage");
let pages = [firstPage, secondPage, thirdPage, fourthPage, finalPage];
let secondThirdParent = document.getElementById("finderhomepage");

let buttons = document.getElementsByTagName("button");
// add event listener for finder button
buttons[0].addEventListener("click", redirectSeekerFinder.bind(null, false, 1));
// add event listener for seeker button
buttons[1].addEventListener("click", redirectSeekerFinder.bind(null, true, 1));
// add event listener for next button
buttons[2].addEventListener("click", redirectSeekerFinder.bind(null, null, 2));

let logo = document.getElementsByClassName("imageWrapper");
// add event listener for logo, return its default value
logo[0].addEventListener("click", redirectSeekerFinder.bind(null, true, 0));

let searchBox = document.getElementsByClassName("searchBox");
// add event listenr for searchBox
searchBox[0].addEventListener("click", redirectSeekerFinder.bind(null, null, 3));

let titles = document.getElementsByClassName("outertitle");
let npbuttons = document.getElementsByClassName("npButton");

function redirectSeekerFinder(seeker, displayedPage){
  if(null !== seeker) {
    isSeeker = seeker;
  }
  selectPageToDisplay(displayedPage);
  // final page is a special case
  if(4===displayedPage){
    homepage.className = "";
    for (let i = 0; i < npbuttons.length; ++i) {
      npbuttons[i].style.backgroundColor = "#142a50";
    }
    let collapse = document.getElementsByClassName("collapsible");
    let content = document.getElementsByClassName("content");
    let lessButton = document.getElementsByClassName("lessButton");
    let color = (isSeeker) ? "lightblue" : "lightyellow";
    for (let i = 0; i < collapse.length; ++i) {
      collapse[i].className = "collapsible " + color;
      content[i].className = "content " + color;
      lessButton[i].className = "lessButton moreButton " + color;
    }
    return;
  }

  if(isSeeker){
    homepage.className = "lightblue";
    titles[0].textContent = "Input the lost item";
    titles[1].textContent = "Or search for existing items";
    titles[2].textContent = "Search for existing items";
    for (let i = 0; i < npbuttons.length; ++i) {
      npbuttons[i].style.backgroundColor = "#142a50";
    }
  } else {
    homepage.className = "lightyellow";
    titles[0].textContent = "Input the found item";
    titles[1].textContent = "Or search for existing requests";
    titles[2].textContent = "Search for existing requests";
    for (let i = 0; i < npbuttons.length; ++i) {
      npbuttons[i].style.backgroundColor = "#daab27";
    }
  }
}

function selectPageToDisplay(index){
  secondThirdParent.style.display = (1===index || 2===index) ? "flex":"none";

  for(let i = 0; i < pages.length; ++i){
    pages[i].style.display = (i===index) ? "flex":"none";
  }

  if(0===index){
    clearContent();
  }
}

function clearContent() {
  let ec = document.getElementsByClassName("editbleContent");
  let i;
  for (i=0; i<ec.length; i++) {
    ec[i].textContent = "";
  }
  document.getElementById("imgUploader").files[0] = "";
}



/*
 * The second part is for correctly displaying google map and completing autocomplete service
 */
let googleMaps = [];
let autocompletes = [];
let markers = [];
let maps = document.getElementsByClassName("googleMap");
let inputLoc = document.getElementsByClassName("inputLocation");
for(let i = 0; i < inputLoc.length; ++i) {
  inputLoc[i].addEventListener("focus", clearInput);
}

function initMaps(){
  for(let i = 0; i < maps.length; ++i){
    initGoogleMap(i);
  }
}

function initGoogleMap(index) {
  // initialize first map
  let ucdLoc = {lat: 38.542469, lng: -121.749632};
  let googleMap = new google.maps.Map(maps[index], {
    center: ucdLoc,
    zoom: 17
  });

  let marker = new google.maps.Marker({position: ucdLoc, map: googleMap});
  marker.setAnimation(google.maps.Animation.DROP);
  marker.setClickable(true);
  //marker.setDraggable(true);
  //marker.addListener("dragend", fillInAddress);
  let options = {
    types: "address",
    componentRestrictions:{country: "US"}
  }
  let autocomplete = new google.maps.places.Autocomplete(inputLoc[index], options);
  autocomplete.addListener("place_changed", changeCenterNMarker.bind(null, index));
  autocomplete.setFields(["formatted_address","geometry"]);

  // append
  googleMaps.push(googleMap);
  markers.push(marker);
  autocompletes.push(autocomplete);
}

function changeCenterNMarker(index) {
  // Get the place details from the autocomplete object.
  console.log("Hit fillInAddress!");
  let place = autocompletes[index].getPlace();
  googleMaps[index].setCenter(place.geometry.location);
  markers[index].setPosition(place.geometry.location);
}

function clearInput() {
  this.value = '';
  this.placeholder = '';
}



/*
 * The third part is for sending data back to the server side
 */
let imgUploader = document.getElementById("imgUploader");
imgUploader.addEventListener("change", uploadImg);

// upload image
function uploadImg() {
  let targetImg = document.getElementById("imgUploader").files[0];
  let formData = new FormData();

  document.getElementById("imgName").textContent = "Uploading...";
  // formData.append(name, value, filename);
  formData.append("newImage", targetImg, targetImg.name);
  let req = new XMLHttpRequest();
  req.open("POST", "/img", true);

  // set up callback function
  req.onloadend = function(res) {
    console.log("Image has been uploaded!");
    document.getElementById("imgName").textContent = targetImg.name + " has been uploaded!";
  }

  console.log("Sending image to the server!");
  req.send(formData);
}

// add event listener for submit button
buttons[3].addEventListener("click", insertNewItem2db);

function insertNewItem2db() {
  let title = document.getElementById("fmsgtitle").textContent;
  let category = document.getElementById("fmsgcategory").value;
  let description = document.getElementById("fmsgdescription").textContent;
  let date = document.getElementById("founddate").value;
  let time = document.getElementById("foundtime").value;
  let location = document.getElementById("finderLocation").value;

  // image can be optional
  let image = (undefined === document.getElementById("imgUploader").files[0]) ? "" : document.getElementById("imgUploader").files[0].name;

  //checkDateNTime(date, time);
  if( !checkRequired(title, "Title") || !checkRequired(category, "Category") || !checkRequired(location,"Location")
      || !checkRequired(date, "Date") || !checkRequired(time, "Time") || !checkDateNTime(date, time) ){
    return;
  }

  let uploadData = {
    isSeeker: isSeeker,
    title: title,
    category: category,
    description: description,
    image: image,
    date: date,
    time: time,
    location: location
  }

  //console.log(uploadData);
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/saveInfo");
  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

  xhr.onloadend = function(res) {
    console.log("Successfully add a new item to data base!");
    // TODO: brought up final page here, should call "redirectSeekerFinder" function
    alert("You have successfully added item to the database!");
    redirectSeekerFinder(true, 0);
  }

  xhr.send(JSON.stringify(uploadData));
}

// add event listener for search button
buttons[4].addEventListener("click", searchItemsIndb);
let searchData;
function searchItemsIndb() {
  let title = document.getElementById("findersearchtext").textContent;
  let startDate = document.getElementById("fsearchstartdate").value;
  let startTime = document.getElementById("fsearchstarttime").value;
  let endDate = document.getElementById("fsearchenddate").value;
  let endTime = document.getElementById("fsearchendtime").value;
  let category = document.getElementById("findersearchcategory").value;
  let location = document.getElementById("findersearchlocation").value;

  if( !checkRequired(title, "Title") || !checkRequired(category, "Category") || !checkRequired(location,"Location")
      || !checkRequired(startDate, "Start date") || !checkRequired(startTime, "Start time")
      || !checkRequired(endDate, "End date") || !checkRequired(endTime, "End time")
      || !checkDateNTime(startDate, startTime) || !checkDateNTime(endDate, endTime) ){
    return;
  }

  searchData = {
    isSeeker: isSeeker,
    title: title,
    category: category,
    startDate: startDate,
    startTime: startTime,
    endDate: endDate,
    endTime: endTime,
    location: location
  }

  //console.log(uploadData);
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/searchInfo");
  xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");

  xhr.onloadend = function(res) {
    console.log("Search Completion!");
    // TODO: brought up final page here, should call "redirectSeekerFinder" function
    if(xhr.status === 404) {
      alert("Cannot find any result!");
    } else {
      let data = JSON.parse(xhr.responseText);
      constructFinalPage(data);
      redirectSeekerFinder(null, 4);
    }
  }

  xhr.send(JSON.stringify(searchData));
}

function checkRequired(variable, name) {
  if(""===variable){
    alert(name + " field is required!");
    return false;
  }
  return true;
}

function checkDateNTime(date, time) {
  let currentDate = Date.now();
  console.log(currentDate);
  let splitDate = date.split("-");
  let splitTime = time.split(":");
  const userInputDate = new Date();
  /*
  console.log(splitDate);
  console.log(splitTime);
  console.log(parseInt(splitDate[1],10));
   */
  userInputDate.setFullYear(parseInt(splitDate[0],10));
  userInputDate.setMonth(parseInt(splitDate[1],10)-1);
  userInputDate.setDate(parseInt(splitDate[2],10));
  userInputDate.setHours(parseInt(splitTime[0],10),parseInt(splitTime[1],10));
  console.log(userInputDate);
  console.log(userInputDate.valueOf());
  if(userInputDate.valueOf() > currentDate) {
    alert("Input Date and Time must be in the past!");
    return false;
  }
  return true;
}

/*
 * The fourth part:
 * Use the respond from server to construct the final page!
 */
let coll = document.getElementsByClassName("collapsible");
let content = document.getElementsByClassName("content");
let searchResult = document.getElementById("searchResult");
let lessButtons = document.getElementsByClassName("lessButton");

for(let i = 0; i < coll.length; ++i){
  coll[i].addEventListener("click", showContent);
  content[i].lastElementChild.lastElementChild.addEventListener("click", hideContent.bind(null, content[i], coll[i]));
}

let editButton = document.getElementById("editButton");
editButton.addEventListener("click", redirectSeekerFinder.bind(null, null, 3));

function constructFinalPage(resData){
  // first change search page based on search request
  generateSearchBrief();
  for(let i = 0; i < resData.length; ++i){
    if(i >= coll.length) {
      // we need to get a new collapse and new content
      // and append it to searchResult
      let newCollapse = coll[0].cloneNode(true);
      let newContent = content[0].cloneNode(true);
      searchResult.append(newCollapse);
      searchResult.append(newContent);

      // update coll and content
      coll = document.getElementsByClassName("collapsible");
      content = document.getElementsByClassName("content");

      // wire event listener for newly created element
      newCollapse.addEventListener("click", showContent);
      newContent.lastElementChild.addEventListener("click", hideContent.bind(null, newContent, newCollapse));
    }
    fillInData(i, resData[i]);
  }
  // if we get extra space, don't display them
  if(resData.length < coll.length) {
    for(let i = resData.length; i < coll.length; ++i){
      coll[i].style.display = "none";
    }
  }
}

function fillInData(index, data) {
  let collapse = coll[index];
  let cont = content[index];
  collapse.style.display = "flex";
  collapse.firstElementChild.textContent = data.title;

  if('' === data.image) {
    cont.firstElementChild.style.display = "none";
  } else {
    cont.firstElementChild.style.display = "block";
    cont.firstElementChild.firstElementChild.src = "http://ecs162.org:3000/images/bxin/" + data.image;
  }

  let iter = cont.lastElementChild.firstElementChild;
  iter.lastElementChild.textContent = data.category;
  iter = iter.nextElementSibling;
  let temp = data.location.split(",");
  iter.lastElementChild.textContent = temp[0];
  iter = iter.nextElementSibling;
  iter.lastElementChild.textContent = data.dateTime;
  iter = iter.nextElementSibling;

  if('' === data.description) {
    iter.textContent = "No available description!";
  } else {
    iter.textContent = data.description;
  }
}

function generateSearchBrief() {
  let searchBrief = "";
  let startDate = searchData.startDate;
  let endDate = searchData.endDate;
  if(startDate === endDate) {
    searchBrief += startDate + ", ";
  } else {
    searchBrief += startDate + " - " + endDate + ", ";
  }
  searchBrief += searchData.category + ", ";
  let locations = searchData.location.split(",");
  searchBrief += locations[0];
  let header = document.getElementById("searchBrief");
  header.textContent = searchBrief;
}

function showContent() {
  this.classList.toggle("active");
  let content = this.nextElementSibling;
  let moreButton = this.lastElementChild;
  if (content.style.display === "flex") {
    content.style.display = "none";
    moreButton.style.display = "block";
    this.style.marginBottom = "15px";
  } else {
    content.style.display = "flex";
    moreButton.style.display = "none";
    this.style.marginBottom = "0";
  }
}

function hideContent(cont, collapse) {
  let moreButton = collapse.lastElementChild;
  cont.style.display = "none";
  collapse.style.marginBottom = "15px";
  moreButton.style.display = "block";
}
