export function PageVisibility(){    
    
    const on = {
        change : []
    }
    var hidden, visibilityChange; 
    if (typeof document.hidden !== "undefined") { 
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
    function isVisible(){
        return !document[hidden]
    }
    function handleVisibilityChange() {        
        on.change.forEach( f => f() )
    }
    if (typeof document.addEventListener === "undefined"
        || hidden === undefined) {
        console.error("This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.");
    } else {
        // Handle page visibility change   
        document.addEventListener(visibilityChange, handleVisibilityChange, false);
    }

    return { on, isVisible }
}
