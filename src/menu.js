import { HiScores, History, Options } from './persist.js'
import { InitialMap } from '../assets/map-progression.js'
import { getUnlockedBy } from './unlocks.js'
// const Maps = [
    
//     //{ name : 'map1', displayName : 'unplayed yet' },
//     /*{ name : 'map2', displayName : 'unplayed yet' },
//       { name : 'map3', displayName : 'unplayed yet' },
//       { name : 'map4', displayName : 'unplayed yet' },
//       { name : 'map5' },
//       { name : 'map6' },
//       { name : 'map7' }*/
        
// ]

function $paragraph(textContent){
    const $p = document.createElement('p')
    $p.classList.add('paragraph')
    $p.textContent = textContent
    return $p
}
function $button( textContent, f ){
    const $b= document.createElement('button')
    $b.textContent = textContent
    $b.classList.add('button')
    $b.onclick = f
    return $b
}
function $hiscoreParagraph(textContent){
    const $p = document.createElement('p')
    $p.classList.add('hiscoreParagraph')
    $p.textContent = textContent
    return $p
}
function $levelNameParagraph(textContent){
    const $p = document.createElement('p')
    $p.classList.add('levelNameParagraph')
    $p.textContent = textContent
    return $p

}
function $levelAchievmentUnlocksParagraph(textContent){
    const $p = document.createElement('p')
    $p.classList.add('levelAchievmentUnlocksParagraph')
    $p.textContent = textContent
    return $p
}
function $levelAchievmentPerfectParagraph(textContent){
    const $p = document.createElement('p')
    $p.classList.add('levelAchievmentPerfectParagraph')
    $p.textContent = textContent
    return $p
}
function $levelDisplayNameParagraph(textContent){
    const $p = document.createElement('p')
    $p.classList.add('levelDisplayNameParagraph')
    $p.textContent = textContent
    return $p
}
function $h1(textContent){
    const $p = document.createElement('h1')
    $p.textContent = textContent
    return $p
}
function $h2(textContent){
    const $p = document.createElement('h2')
    $p.textContent = textContent
    return $p
}
function $h3(textContent){
    const $p = document.createElement('h3')
    $p.textContent = textContent
    return $p
}
function $mmapDiv(){
    const $d = document.createElement('div')
    $d.classList.add('mmapDiv')
    return $d
}
function $bigDiv(){
    const $d = document.createElement('div')
    $d.classList.add('bigDiv')
    return $d
}
function optionsMenu(  {sndfx}  ){
    const $optionsDiv = document.createElement('div')
    //$optionsDiv.style = 'margin-top:3em;margin-bottom:3em;text-align:center;user-select:none;'
    $optionsDiv.classList.add('optionsMenu')
    $optionsDiv.appendChild($h2('Options'))
    const optionsStore = Options()
    const options = optionsStore.load()
    console.log( 'options',options)
    Object.entries( options ).forEach( ([name,value]) => {

        const $optionDiv = document.createElement('div')
        $optionsDiv.appendChild( $optionDiv )
        $optionDiv.classList.add('option')

        const displayName = optionsStore.getDisplayName( name )
        const $pn = $levelNameParagraph( displayName)
        $optionDiv.appendChild( $pn )

        const possibleValues  = optionsStore.getPossibleValues( name )
        const valueIdx = possibleValues.findIndex( pv => pv.value === value )
        const valueDisplay = possibleValues[ valueIdx ].display
        const $pdv = $paragraph( valueDisplay )
        $optionDiv.appendChild( $pdv )
        $optionDiv.onclick = change
        

        function change(){
            sndfx.cloc()
            const possibleValues  = optionsStore.getPossibleValues( name )
            const valueIdx = possibleValues.findIndex( pv => pv.value === value )
            const nextValueIdx = ( valueIdx + 1 )%possibleValues.length
            const nextValue = possibleValues[ nextValueIdx ]
            const nextValueDisplay =  nextValue.display
            value = nextValue.value
            optionsStore.setOption( name, value )
            $pdv.textContent = nextValueDisplay
        }
    })
    //    const $pre = $paragraph(JSON.stringify( options, null, 2 ))
    //    $optionsDiv.appendChild($pre)
    return $optionsDiv
}
export function $Title(){
    const $div = document.createElement('div')
    $div.classList.add('Viewport')
    //$div.style = 'margin:4em;'   
    $div.appendChild($h1('Petit Rick'))
    return $div
}
export function goMenu( f, {sndfx} ){

    const historyStore = History()
    const history = historyStore.load()



    const $div = $Title()
    document.body.appendChild( $div )

    const recentHistory = history.recent,
          unlockedHistory = history.unlocked

    // rencently played
    const doneMaps = recentHistory.slice(0,1).map(
        name => ({name,displayName:undefined})
    )
    
    
    // unlocked 
    const recentlyUnlocked = []    
    const otherMaps = []    
    Object.entries(unlockedHistory).forEach( ([name,unlockedDate]) => {

        // exists in recently played
        const exists = doneMaps.find( m => m.name === name )
        
        // locked
        const locked = unlockedDate === undefined
        

//        if ( !exists && !locked){
        if ( !locked ){
            // const unlockedSinceMin = ( Date.now() - unlockedDate ) / 1000 / 60
            // if ( unlockedSinceMin < 5 ){
            recentlyUnlocked.push( { name, unlockedDate } )
            // } else {
            //     otherMaps.push( { name } )
            // }
        }
    })
    console.log(recentlyUnlocked)
    recentlyUnlocked.sort( (a,b) => b.unlockedDate - a.unlockedDate )
    if ( ! (recentlyUnlocked.length || doneMaps.length || otherMaps.length ) ){
        // oh oh oh !
        const $levelsDiv = document.createElement('div')
        //$levelsDiv.style = 'display:flex;flex-wrap:wrap;*/margin-top:4em;*/justify-content: center;'
        $levelsDiv.classList.add('levelsDiv')
        $div.appendChild($levelsDiv)
        $levelsDiv.appendChild( $Map( {name : InitialMap,
                                       displayName : 'click to start',
                                       noHiscores : true } ) )
    } else {
        $div.appendChild($h2('click a map to play'))
    }

    
    
    ;[
        ['Recently unlocked', recentlyUnlocked],
        //['Recently played', doneMaps],
        //['All levels',otherMaps]
    ].forEach( ([hcaption,maps]) => {
        console.log('hcaption',hcaption,maps)
        if ( !maps || ( maps.length === 0 ) )
            return 
        //$div.appendChild( $h3( hcaption ) )
        
        const $levelsDiv = document.createElement('div')
        //$levelsDiv.style = 'display:flex;flex-wrap:wrap;*/margin-top:4em;*/justify-content: center;place-content: center;'
        $levelsDiv.classList.add('levelsDiv')
        $div.appendChild($levelsDiv)

        maps.forEach( map => {
            const $mapDiv = $Map( map )
            $levelsDiv.appendChild( $mapDiv )
        })
    })

    /*
    
    //;[ ...doneMaps, ...Maps ].forEach( ({name,displayName}) )
    
    
    sortedMaps.forEach( map => {
        const $mapDiv = $Map( map )
        $levelsDiv.appendChild( $mapDiv )
        
    })*/
    function $Map( map ){
        const { name, displayName, noHiscores = false } = map

        function playThis(){
            sndfx.cloc()
            $div.remove()
            f( name )
        }
        const $mapDiv = $mmapDiv()
        const perfected = history.perfected[ name ]
        
        const levelHistory = history.levels[ name ]
        let realDisplayName 
        if ( levelHistory ){
            realDisplayName = '« '+levelHistory.displayName+' »'
        } else {
            if ( displayName ){
                realDisplayName = '« '+displayName  +' »'
            } else {
                realDisplayName = 'unplayed yet'
            }
        }
        
        //const $p = $levelNameParagraph(`${ name } - ${ realDisplayName }`)
        $mapDiv.appendChild( $levelNameParagraph(`${ name }`) )
        $mapDiv.appendChild( $levelDisplayNameParagraph(realDisplayName) )
        if ( perfected ){
            $mapDiv.appendChild( $levelAchievmentPerfectParagraph('👌️ perfect!') )
        } else {
            const unlocks = getUnlockedBy( name )
            if ( unlocks && unlocks.length ){
                const s = `unlocks ${ unlocks.join(', ') }`
                $mapDiv.appendChild(  $levelAchievmentUnlocksParagraph( s ) )
            }
        }
        
        const screenshot = history.screenshots[ name ]
        if ( screenshot ){
            const $image = document.createElement('img')
            $image.classList.add( 'screenshot' )
            $image.src = screenshot
            $mapDiv.appendChild( $image )
            $image.onclick = playThis
        } else {
            const $playItDiv = document.createElement('div')
            $mapDiv.appendChild( $playItDiv )
            {
                const $playButton = $button('play', playThis )
                $playItDiv.appendChild( $playButton )
            }
        }
        if ( ! noHiscores ){
        const hiScoresStore = HiScores( name )
        const hiScores = hiScoresStore.load()
        
        if ( hiScores && hiScores.list ){

            const $hiScoresDiv = document.createElement('div')
            $mapDiv.appendChild( $hiScoresDiv )
            
            hiScores.list.slice(0,3).forEach( (hiScore,rank0) => {
                const { name, score } = hiScore
                const $p = $hiscoreParagraph(`#${ rank0 + 1 } ${ score } : ${ name }`)
                $hiScoresDiv.appendChild( $p )
            })
        }
        }
        return  $mapDiv
    }
    $div.appendChild(    optionsMenu(  {sndfx}  ) )
}
