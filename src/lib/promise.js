export function promisify1( f ){
    return function( p ){
        return new Promise( ( accept, reject ) => {
            f(p,accept)
        })
    }
}
export function promisify2(f){
    return function( param ){
        return new Promise( ( accept, reject ) => {
            f(param, (err,result) => {
                if ( err ){
                    reject( err )
                } else {
                    accept( result )
                }
            })
        })
    }
}
export async function resolveAllValues( o ){

    // { a : promise, b : promise, c :...}
    // -> { a: result, b : result, c: ... }
    
    const order = Object.keys( o )
    const resolved = await Promise.all( order.map( k => o[k] ) )
    return Object.fromEntries( order.map( (k,i) => [ k, resolved[ i ] ] ) )
}
