import { History} from './persist.js'
const historyStore = History()


const byMaps = {
    'map1' : [ 'map2', 'map3' ],
    'map2' : [ 'map4' ],
    'map3' : [ 'map4','map5','map6' ],
    'map4' : [ 'map5','map6','map7' ],
}

export function Unlocker(){
    function getUnlocked( fromMap ){
        return byMaps[ fromMap ] || []
    }
    function unlock( fromMap ){
        historyStore.unlock( getUnlocked( fromMap ) )
    }
    return unlock
}
