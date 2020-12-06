const CURRENT_VERSION = 1
removePersistedIfOlderThanCurrentVersion()

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
        screenshots : {},
        unlocked : {},
        perfected : {}
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
    function unlock( names ){
        if ( !names ) return 
        const history = load()
        names.forEach( name => {
            if ( history.unlocked[ name ] === undefined ){
                history.unlocked[ name ] = Date.now()
            }
        })        
        set( JSON.stringify( history ) )
        return history
    }
    function setPerfected( name ){
        const history = load()
        history.perfected[ name ] = Date.now()
        set( JSON.stringify( history ) )
        return history
    }
    function setPlayed( name, displayName ){
        const history = load()
        history.levels[ name ] = { displayName }
        history.recent.unshift( name )
        history.recent = unique( history.recent )
        history.recent = history.recent.slice(0,4)
        set( JSON.stringify( history ) )
        return history
    }
    return { load, setPlayed, setScreenshot, unlock, setPerfected,remove }            
}

const OptionsListeners = new Set()

export function Options(){
    function listeners(){
        return OptionsListeners
    }
    const defaultValue = {
        'no countdown ending' : true,
        'countdown mode' : 1,
        'slow down':1,
        'resize to pixel multiple' : true,
        'postprocessing' : 1,
        'global volume' : 1.0,
        'music volume' : 0.6,
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
            { value : true, display : 'game continues after countdown ends (but no level is unlocked)' },
            { value : false, display : 'game stops when countdown ends' },
        ],
        'countdown mode' : [
            { value : 1, display : 'hard' },
            { value : 2, display : 'normal (2x more time to finish)' },
            { value : 4, display : 'relaxed (4x more time to finish)' },
            { value : 8, display : 'extra relaxed (8x more time to finish)' },
            { value : 16, display : 'extra extra relaxed (16x more time to finish)' },
        ],
        'slow down' : [
            { value : 1, display : 'none' },
            { value : 1.25, display : 'a little' },
            { value : 1.75, display : 'a little more' },
            { value : 2, display : 'two times' },
            { value : 3, display : 'three times' },
            { value : 4, display : 'a lot' },
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
        'countdown mode' : 'countdown speed',
        'resize to pixel multiple' : 'resizing',
        'postprocessing' : 'image postprocessing',
        'music volume' : 'music',
        'sfx volume' : 'sound effects',
        'global volume' : 'volume',
        'slow down' : 'slow down'
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

export function removePersistedIfOlderThanCurrentVersion(){
    const version = StorageItem( 'version',  0 )
    if ( version.get() < CURRENT_VERSION ){
        localStorage.clear()
        version.set( CURRENT_VERSION )

    }
}
