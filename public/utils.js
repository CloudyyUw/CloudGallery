// Ok, let's document this JS a bit
// To store the files, I used Firebase Storage, which works great with the front-end
// And in the database I used Firestore.
// You can use any similar database, but I preferred it for two reasons: it is easy to use and works well on the front-end.
// And by keeping it static, you can host it anywhere, like on Firebase Hosting itself, or even on Firebase Storage, which is almost a loop, since you send the html file and open it via the Storage url.

// This function is responsible for deleting the file in the storage (Firebase Storage) and also in the database (Firebase Firestore)
async function handleDelete(ID, file) {
  if (confirm("Are you sure you want to delete this file?\nIt will be deleted from storage and from the database permanently, which is quite a long time.")) {
    try {
      firebase.storage().ref().child(`files/${file}`).delete().then(async function() {
        await firebase.firestore().collection("media").doc(ID).delete()
        location.reload(true)
      }).catch(err => {
        console.log(err.message)
      })
    } catch (err) {
      alert(err.message)
    }
  }
}

function genID() {
  return Math.random().toString(13).slice(2)
}
// This is the important part, here we will execute this function when the file input is modified.
function upload() {
  // For aesthetic and informational purposes, we will use the SemanticUI progress bar.
  $('#progress').progress({
    percent: 0
  });
  // Here we will define where the file will be placed, in this case in "files" which will become "files/filename.png" for example.
  const Storage = firebase.storage()
  const storageRef = Storage.ref()
  const filesRef = storageRef.child("files")

  // Here we will take the file from that input that we defined in the html and handle it, change the name to a unique ID and the file type.
  const input = document.getElementById("Files")
  const file = input.files[0]
  const type = file.type.split("/")[0]
  const newFileName = `${genID()}-${Date.now()}.${file.name.split(".").slice(-1)[0]}`
  const File = filesRef.child(newFileName)

  // Now it's time to send our file by starting a task
  const uploadTask = File.put(file)

  //Showing that progress bar
  $("#upload_stats").show()

  uploadTask.on('state_changed', function(snapshot) {
    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    $('#progress').progress({
      percent: progress
    });
  }, function(err) {
    console.error(err)
  }, function() {
    // At this point, the file is already in Storage, but we don't know its URL
    // So.... let's use this Firebase method to read the generated url
    uploadTask.snapshot.ref.getDownloadURL().then(async function(downloadURL) {
      // Okay, here we have our beloved URL, all that's left is to put it into the database along with the other information so that we can read it later.
      await firebase.firestore().collection("media").add({
        url: downloadURL,
        type: type,
        name: newFileName
      })
      // After all, we can reload the page for the user.
      location.reload(true)
    });
  });
}
// This is the function that gives our clean page a face by adding each image and functions.
async function loadData() {
  let out = document.getElementById("_out-imgs")
  let data = await firebase.firestore().collection("media").get();
  if (data.empty) {
    return out.innerHTML = "It's a little empty here... try uploading"
  }
  data.forEach((content) => {
    out.innerHTML += `
    <div class="ui inverted message">
      <div class="header">
        <i class="far fa-file"></i> <a href="${content.data().url}">${content.data().name}</a> <button class="delete ui negative basic button" data-id="${content.id}" data-file="${content.data().name}"><i class="far fa-trash-alt"></i></button>
      </div>
      <div>
        ${content.data().type == "image" ? `<img class="ui image" src="${content.data().url} />"` : ""}
        ${content.data().type == "video" ? `<video width="320" height="240" controls> <source src="${content.data().url}"></video>` : ""}
        ${content.data().type == "audio" ? `<audio controls><source src="${content.data().url}"></audio>`: ""}
      </div>
    </div>
    `
  })
}
// A little JQuery to perform the functions we defined above.
$(document).ready(async function() {
  await loadData()
  $("#up1").click(function() {
    $("#up").show()
  })
  $(".delete").click(function() {
    handleDelete(this.dataset.id, this.dataset.file);
  })
})
// Here we finish our script and everything should be working, try uploading a file!
