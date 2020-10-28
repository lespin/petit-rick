
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

const OptionsListeners = new Set()

export function Options(){
    function listeners(){
        return OptionsListeners
    }
    const defaultValue = {
        'no countdown ending' : true,
        'resize to pixel multiple' : true,
        'postprocessing' : 1,
        'global volume' : 1.0,
        'music volume' : 1.0,
        'sfx volume' : 1.0,
    }
    const volumes = [
        { value : 0, display : 'muted' },
        { value : 0.1, display : '10%' },
        { value : 0.2, display : '20%' },
        { value : 0.3, display : '30%' },
        { value : 0.4, display : '40%' },
        { value : 0.5, display : '50%' },
        { value : 0.6, display : '60%' },
        { value : 0.7, display : '70%' },
        { value : 0.8, display : '80%' },
        { value : 0.9, display : '90%' },
        { value : 1.0, display : 'max' },
        { value : 0.901, display : '90%' },
        { value : 0.801, display : '80%' },
        { value : 0.701, display : '70%' },
        { value : 0.601, display : '60%' },
        { value : 0.501, display : '50%' },
        { value : 0.301, display : '30%' },
        { value : 0.201, display : '20%' },
        { value : 0.101, display : '10%' },
   ]
    const possibleValues = {
        'no countdown ending' : [
            { value : true, display : 'no countdown ending' },
            { value : false, display : 'must finish before countdown end' },
        ],
        'resize to pixel multiple' : [
            { value : true, display : 'fit to nearest integer scaling' },
            { value : false, display : 'scale to maximum' },
        ],
        'postprocessing' : [
            { value : 0, display : 'quiet' }, 
            { value : 1, display : 'normal' },
            { value : 2, display : 'more!' },
       ],
        'music volume' : volumes,
        'sfx volume' : volumes,
        'global volume' : volumes
        
    }
    const displayNames = {
        'no countdown ending' : 'countdown',
        'resize to pixel multiple' : 'resizing',
        'postprocessing' : 'image postprocessing',
        'music volume' : 'music',
        'sfx volume' : 'sound effects',
        'global volume' : 'volume',
    }
    function getDisplayName( name ){
        if ( displayNames[ name ] === undefined ){
            throw new Error('no such option '+name)
        }
        return displayNames[ name ]
    }
    function getPossibleValues( name ){
        if ( possibleValues[ name ] === undefined ){
            throw new Error('no such option '+name)
        }
        return possibleValues[ name ]
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
        for ( let listener of OptionsListeners ){
            listener( options )
        }
        return options
    }
    return { load, setOption, remove,
             getPossibleValues, getDisplayName,
             listeners }            
}
