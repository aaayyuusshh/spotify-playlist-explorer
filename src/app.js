/**
 * CODE DESIGN:
 * We will be using the MODULE PATTERN (pre-ES6)
 * - emulates classes in javascript - allows our code to be clean, separated & organized.
 * - we can hide the implementation of certain functions from outside scope while at the same 
 * time allowing outside entities necessary access via publicly declared functions or objects (closures).
 * - the MODULE pattern is implemented with Closures x IIFES here.
 *      - good for data privacy & encapsulation.
 */

let APIModule = function() {
     /*retrive this info by registering an app in your spotify dev account*/
   const clientSecret = '7eb173c01c1e48a095f8ffa766264708';
   const clientID = 'f2f427cda2d1455fbb9af8892b388adc';

    //OAuth2's client credentials flow to acquire the access token
   let retrieveToken = async() => {

       let result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientID + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });
        let data = await result.json();
        console.log(data);
        return data.access_token;
    }

    //get Spotify's browse categories - example: Podcasts, Made For You, New Releases, Hip-Hop, Pop etc.
   let retrieveCategories = async(token) => {
       let result = await fetch('https://api.spotify.com/v1/browse/categories', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        let data = await result.json();
        console.log(data);
        return data.categories.items;
    }

    //get playlists tagged with a particular category 
   let retrievePlaylistsByCategory = async(token, categoryId) => {
       let limit = 10;
       let result = await fetch(`https://api.spotify.com/v1/browse/categories/${categoryId}/playlists?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        let data = await result.json();
        console.log(data);
        return data.playlists.items;
    }

    //get tracks from a certain playlist
   let retrieveTracks = async(token, tracksEndPoint) => {
       let limit = 10;
       let result = await fetch(`${tracksEndPoint}?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        let data = await result.json();
        return data.items;
    }

    //get information for a single track
   let retrieveTrack = async(token, trackEndPoint) => {
       let result = await fetch(`${trackEndPoint}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        let data = await result.json();
        console.log(data);
        return data;
    } 

    //we return methods we want to expose to outside scope using public closures (ex: tokenGetter())
    //the publicly declared tokenGetter() method (closure) has access to the privately implemented retrieveToken() method.
    return {
        tokenGetter() {
            return retrieveToken();
        },
        genresGetter(token){
            return retrieveCategories(token);
        },
        playlistsByGenreGetter(token, categoryId) {
            return retrievePlaylistsByCategory(token, categoryId);
        },
        tracksGetter(token, tracksEndPoint) {
            return retrieveTracks(token, tracksEndPoint);
        },
        trackGetter(token, trackEndPoint) {
            return retrieveTrack(token, trackEndPoint);
        }
    }
 }();

let UIModule = function() {

   let DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        divSongDetail: '#song-detail',
        hfToken: '#hidden_token',
        divSongList: '.song-list'
    }

    return {
        inputField() {
            return {
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSongList),
                submit: document.querySelector(DOMElements.buttonSubmit),
                songDetail: document.querySelector(DOMElements.divSongDetail)
            }
        },
        createGenre(text, value) {
           let html = `<option value=${value}>${text}</option>`;
            //@TODO: pointed below might be a better approach 
            //document.getElementById(DOMElements.selectGenre).addEvent(text); 
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML("beforeend", html); //@TODO: shoudln't this use .getElementById
    
        },
        createPlaylist(text, value) {
           let html = `<option value=${value}>${text}</option>`;
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML("beforeend", html);
        },
        createTrack(id, name) {
           let html = `<a href="#" class="list-item list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSongList).insertAdjacentHTML('beforeend', html);
        },
        createTrackDetail(img, title, artist, album, releaseDate) {
           let detailDiv = document.querySelector(DOMElements.divSongDetail);
            detailDiv.innerHTML = '';

           let html = 
            ` 
            <p class="close-button">x</p>               
            <div>
                <img src="${img}" alt="">        
            </div>
            <div>
                <label for="Genre">Song: ${title}</label>
            </div>
            <div>
                <label for="artist">Artist: ${artist}</label>
            </div>
            <div>
                <label for="album">Album: ${album}</label>
            </div>
            <div>
                <label for="releaseDate">Release: ${releaseDate}</label>
            </div>`
            ;

            detailDiv.insertAdjacentHTML("beforeend", html);
        },

         /**
         * Resetting html cases:
         * - need to reset track detail div when a new track is clicked
         * - need to reset track detail div when a new genre/playlist is clicked
         * - need to reset track list when new playlist/genre is clicked
         * - need to reset playlist list when a new genre is clicked
         */
        resetTrackDetail() {
            document.querySelector(DOMElements.divSongDetail).innerHTML = '';
        }, 
        resetTracks() {
            this.resetTrackDetail();
            document.querySelector(DOMElements.divSongList).innerHTML = '';
        },
        resetPlaylist() {
            this.resetTracks();
            document.querySelector(DOMElements.selectPlaylist).innerHTML = '';
        },
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },
        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
    }
 }();

let AppModule = function(UICtrl, APICtrl) {

   let DOMInputs = UICtrl.inputField();

   let loadGenres = async () => {
       let token = await APICtrl.tokenGetter();
        UICtrl.storeToken(token);
       let genres = await APICtrl.genresGetter(token);
        genres.forEach(element => UICtrl.createGenre(element.name, element.id)) 
    };

    //genre change event listener
    DOMInputs.genre.addEventListener("change", async() => {
        UICtrl.resetPlaylist();
       let token = UICtrl.getStoredToken().token;
        //need to parse the categoryId first
       let genreSelect = UICtrl.inputField().genre;
       let categoryId = genreSelect.options[genreSelect.selectedIndex].value;
       let playlist= await APICtrl.playlistsByGenreGetter(token, categoryId);
        playlist.forEach(element => UICtrl.createPlaylist(element.name, element.tracks.href))
    });

    // @TODO: If you change a playlist, nothing happens until you press submit 
    // This isn't ideal behaviour, you want the old tracks loaded (if they are) to be cleared

    //submit button event listener
    DOMInputs.submit.addEventListener('click', async(e) => {
        e.preventDefault();
        UICtrl.resetTracks();
       let token = UICtrl.getStoredToken().token;
       let playlistSelect = UICtrl.inputField().playlist;
       let tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
       let tracks = await APICtrl.tracksGetter(token, tracksEndPoint);
        tracks.forEach(element => UICtrl.createTrack(element.track.href, element.track.name))
    });

    DOMInputs.tracks.addEventListener('click', async(e) => {
        e.preventDefault(); //@TODO: don't think we need this
        UICtrl.resetTrackDetail();
       let token = UICtrl.getStoredToken().token;
       let trackEndPoint = e.target.id;
       let track = await APICtrl.trackGetter(token, trackEndPoint);
        UICtrl.createTrackDetail(track.album.images[0].url, track.name, track.artists[0].name, track.album.name, track.album.release_date);
       let modal = document.getElementById("song-detail");
        modal.style.display= "block";
       let closeButton = document.querySelector(".close-button");
        closeButton.addEventListener("click", () => {
            modal.style.display = "none";
        });
    });

    return {
        main() {
            console.log("Web Application Starting..");
            loadGenres();
        }
    }
 }(UIModule, APIModule);
 
AppModule.main();