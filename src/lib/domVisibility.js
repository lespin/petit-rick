export function PageVisibility(){    
    
    const on = {
        visible : [],
        hidden : [],
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
    function handleVisibilityChange() {        
        if (document[hidden]) {
            on.change.forEach( f => f(false) )
            on.hidden.forEach( f => f() )
        } else {
            on.change.forEach( f => f(true) )
            on.visible.forEach( f => f() )
        }
    }
    if (typeof document.addEventListener === "undefined"
        || hidden === undefined) {
        console.error("This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.");
    } else {
        // Handle page visibility change   
        document.addEventListener(visibilityChange, handleVisibilityChange, false);
    }

    return { on }
}
