export function distinct( a ){
    const keys = {}
    for ( let i = 0 ; i < a.length ; i++ ){
        keys[ a[i] ] = true
    }
    return Object.keys( keys )
}
// daihs ...
export function unique( a ){
    const b = []
    a.forEach( x => {
        if ( !b.includes( x ) )  b.push( x )
    })
    return b
}
export function psClone(o){
    return JSON.parse(JSON.stringify(o))
}
export function lerp( a, b, p ){
    return ( 1 - p ) * a + p * b
}
export function clamp(v,min,max){
    return Math.max(min,Math.min(v,max))
}
