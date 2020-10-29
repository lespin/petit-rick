import { History} from './persist.js'
import { MapProgression } from '../assets/map-progression.js'
const historyStore = History()
const byMaps = MapProgression
export function getUnlockedBy( fromMap ){
    return byMaps[ fromMap ] || []
}
export function Unlocker(){
    function unlockAll(){
        Object.entries( MapProgression ).forEach( ([map,maps]) => {
            console.log('unlock',map,maps)
            historyStore.unlock( [ map, ...maps ] )
        })
    }
    function unlockFrom( fromMap ){
        historyStore.unlock( getUnlockedBy( fromMap ) )
    }
    window.unlockAll = unlockAll
    return { unlockFrom, unlockAll }
}
