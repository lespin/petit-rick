import { HiScores, History } from './persist.js'

function $paragraph(textContent){
    const $p = document.createElement('p')
    $p.style = 'color:#ffffff;font-family:monospace;'
    $p.textContent = textContent
    return $p
}
function $button( textContent, f ){
    const $b= document.createElement('button')
    $b.textContent = textContent
    $b.style = 'color:#000000;font-family:monospace;'
    $b.onclick = f
    return $b
}
function $hiscoreParagraph(textContent){
    const $p = document.createElement('p')
    $p.style = 'color:#00ff00;font-family:monospace;'
    $p.textContent = textContent
    return $p
}
function $levelNameParagraph(textContent){
    const $p = document.createElement('h3')
    $p.style = 'color:#adadad;font-family:monospace;'
    $p.textContent = textContent
    return $p
}
function $levelDisplayNameParagraph(textContent){
    const $p = document.createElement('h3')
    $p.style = 'color:#ffffff;font-family:monospace;font-style:italic;'
    $p.textContent = textContent
    return $p
}
function $h1(textContent){
    const $p = document.createElement('h1')
    $p.style = 'color:#ffffff;font-family:monospace;text-align:center;'
    $p.textContent = textContent
    return $p
}
function $h2(textContent){
    const $p = document.createElement('h2')
    $p.style = 'color:#ffffff;font-family:monospace;text-align:center;'
    $p.textContent = textContent
    return $p
}
function $mmapDiv(){
    const $d = document.createElement('div')
    $d.style = 'text-align:center;margin-left:1em;margin-right:1em'
    return $d
}
const Maps = [
    { name : 'map1', displayName : 'unplayed yet' },
    { name : 'map2', displayName : 'unplayed yet' },
    { name : 'map3', displayName : 'unplayed yet' },
]
export function goMenu( f ){

    const historyStore = History()
    const history = historyStore.load()
    
    const $div = document.createElement('div')
    $div.style = 'margin:4em;'
    document.body.appendChild( $div )
    
    $div.appendChild($h1('Petit Rick'))
    $div.appendChild($h2('click a map to play'))

    const $levelsDiv = document.createElement('div')
    $levelsDiv.style = 'display:flex;flex-wrap:wrap;margin-top:4em;justify-content: center;'
    $div.appendChild($levelsDiv)

    const recentHistory = history.recent
    const doneMaps = recentHistory.map( name => ({name,displayName:undefined}) )

    const sortedMaps = [...doneMaps]
    Maps.forEach( presetMap => {
        const exists = sortedMaps.find( m => m.name === presetMap.name )
        if ( !exists ){
            sortedMaps.push( presetMap )
        }
    })
    
    //;[ ...doneMaps, ...Maps ].forEach( ({name,displayName}) )

    sortedMaps.forEach( map => {
        const { name, displayName } = map

        function playThis(){
            $div.remove()
            f( name )
        }

        const $mapDiv = $mmapDiv()
        $levelsDiv.appendChild( $mapDiv )

        const levelHistory = history.levels[ name ]
        let realDisplayName 
        if ( levelHistory ){
            realDisplayName = levelHistory.displayName
        } else {
            realDisplayName = displayName || 'unplayed yet'
        }
        
        const $p = $levelNameParagraph(`${ name } - ${ realDisplayName }`)
        $mapDiv.appendChild( $levelNameParagraph(`${ name }`) )
        $mapDiv.appendChild( $levelDisplayNameParagraph(`${ realDisplayName }`) )

        const screenshot = history.screenshots[ name ]
        if ( screenshot ){
            const $image = document.createElement('img')
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


        
    })
    
    
    
}
