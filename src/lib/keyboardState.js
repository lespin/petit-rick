function KeyUpDownListener( eh ){
    return $element => {
        const add = $element.addEventListener.bind( $element ),
              remove = $element.removeEventListener.bind( $element )
        return {
            start : () => {
                add('keydown', eh(true) )
                add('keyup', eh(false) )
            },
            stop : () => {
                remove('keydown', eh(true) )
                remove('keyup', eh(false) )
            }
        }
    }
}
export function KeyboardState(type){
    const state = new Map()
    const l = KeyUpDownListener(
        down => e => state.set( e[ type ], down )
    ) 
    return $element => ({
        state,
        ...l( $element )
    })
}
export function KeyboardDownFront( type ){
    const state = new Map()
    const l = KeyUpDownListener(
        down => e => {
            if ( down && (!e.repeat) )
                state.set( e[ type ], down )
        }
    )
    return $element => ({
        state,
        reset : state.clear.bind( state ),
        ...l( $element ),
    })
}
