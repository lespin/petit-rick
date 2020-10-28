export function WelcomeText(){
    const $div = document.createElement('div')
    const paragraphs = [
        'Collect all the bottles, fast !',
        'Then Move to the exit door',
        'Keep your clones away from the deadly fires',
        'Only Perfect map completion unlocks new levels',
        'Use Up, Left, Down and Right Arrows keys to move',
    ]
    paragraphs.forEach( (text,i) => {
        const $p = document.createElement('p')
        setTimeout( () => {
            $p.style = 'color:#a0f0f0;font-family:monospace;padding:0.5em;padding-left:1em;'
            $p.innerHTML = text
            $div.appendChild( $p )
        }, i * 16*4 )
    })
    return $div
}
