import { $Title } from '../src/menu.js'
export function WelcomeText(){
    const $div =  $Title()
    const paragraphs = [
        'Collect all the bottles, fast !',
        'Then Move to the exit door',
        'Keep your clones away from the deadly fires and crushers',
        'Only Perfect map completion unlocks new levels',
        'Use Up, Left, Down and Right Arrows keys to move',
    ]
    paragraphs.forEach( (text,i) => {
        const $p = document.createElement('p')
        setTimeout( () => {
            $p.style = 'color:#a0f0f0;font-family:monospace;padding:0.5em;padding-left:1em;text-align:center;'
            $p.innerHTML = text
            console.log('div',$div.parentNode.parentNode)
            if ( $div ){
                $div.appendChild( $p )
            }
        }, i * 1000 ) //16*4 )
    })
    return $div
}
