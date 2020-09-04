function recipientView() {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', "/finalpostCard", true);

    xhr.onloadend = function() {
        let postJson = JSON.parse(xhr.response);

        document.getElementById("serverImage").src = postJson.postImage;
        document.getElementById("serverMessage").textContent = postJson.postMessage;
        document.getElementById("serverMessage").style.fontFamily = postJson.postFont;
        let bg = document.getElementById("postCard");

        bg.style.backgroundColor = postJson.postBackgroundColor;

        bg.className += " recipientAnime";
    };

    xhr.send();
}