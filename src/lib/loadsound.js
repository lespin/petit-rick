export function loadSound( ac, url, f ){
    
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    
    // Decode asynchronously
    request.onload = function() {
        ac.decodeAudioData(request.response, function(buffer) {
            f( buffer )
        }, f);
    }
    request.send();
    
}
