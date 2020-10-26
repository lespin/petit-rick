
/*
 * persistence ( hiscores )
 */

// function JSONStorageItem( key, defaultValue ){
//     const si = StorageItem( key, defaultValue ),
//           get = () => JSON.parse( si.get() ),
//           set = v => si.set( JSON.stringify( v ) )   
//     function edit( f ){
//         set( f( get() ) )
//     }
//     return { edit }
// }
function StorageItem( name, defaultValue ){
    return {
        get : () => localStorage.getItem( name ) || defaultValue ,
        set : v =>  localStorage.setItem( name, v ),
        remove : () => localStorage.removeItem( name )
    }
}
export function HiScores( level ){
    const defaultValue = {
        list : [
            { name : 'Lionel J.', score : 666 },
            { name : 'Chriac J.', score : 676 },
        ]
    }
    const { get, set, remove } = StorageItem( level )
    function load(){
        const ls = get()
        if ( ls ){
            return JSON.parse( ls )
        } else {
            return defaultValue
        }
    }
    function setScore( name, score ){
        const hiscores = load()
        const rank = hiscores.list.findIndex( r => {
            return ( r.name === name ) && ( r.score === score )
        })
        if ( rank === -1 ){
            hiscores.list.push( { name, score } )
            hiscores.list.sort( (a,b) => b.score - a.score )
        }
        set( JSON.stringify( hiscores ) )
        return hiscores
    }
    return { load, setScore, remove }
}
import { unique } from './lib/utils.js'

export function History(){
    const defaultValue = {
        levels : {},
        recent:  [],
        screenshots : {}
    }
    const { get, set, remove } = StorageItem( 'history' )
    function load(){
        const ls = get()
        if ( ls ){
            return JSON.parse( ls )
        } else {
            return defaultValue
        }
    }
    function setScreenshot(name,dataUrl){
        const history = load()
        history.screenshots[ name ] = dataUrl
        set( JSON.stringify( history ) )
        return history
    }
    function setPlayed( name, displayName ){
        const history = load()
        history.levels[ name ] = { displayName }
        history.recent.unshift( name )
        history.recent = unique( history.recent )
        history.recent = history.recent.slice(0,4)
        /*
        const rank = hs.list.findIndex( r => {
            return ( r.name === name ) && ( r.score === score )
        })
        if ( rank === -1 ){
            hiscores.list.push( { name, score } )
            hiscores.list.sort( (a,b) => b.score - a.score )
        }
        */
        set( JSON.stringify( history ) )
        return history
    }
    return { load, setPlayed, setScreenshot, remove }            
}

export function Options(){
    const defaultValue = {
        'no countdown ending' : true,
        'resize to pixel multiple' : true,
    }
    const { get, set, remove } = StorageItem( 'options' )
    function load(){
        const ls = get()
        if ( ls ){
            return JSON.parse( ls )
        } else {
            return defaultValue
        }
    }
    function setOption(name,value){
        const options = load()
        if ( options[ name ] === undefined ){
            throw new Error('no such option '+name)
        }
        options[ name ] = value
        set( JSON.stringify( options ) )
        return options
    }
    return { load, setPlayed, setOption, remove }            
}
