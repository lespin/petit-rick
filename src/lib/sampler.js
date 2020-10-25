export function Sampler( ){
    const buffers = new Map()
    let gain, ac
    function play( name ){
        if ( !ac ) return
        const buffer = buffers.get( name )
        if ( !buffer )
            throw new Error('no sound buffer named: '+name)
        const bufferSource = ac.createBufferSource()
        bufferSource.buffer = buffer
        bufferSource.connect( gain )
        bufferSource.start()
    }
    const functions = {}
    function set( name, buffer ){
        buffers.set( name, buffer )
        functions[ name ] = () => play( name )
    }
    function start( _ac ){
        ac = _ac
        gain = ac.createGain()
        gain.gain.value = 1.0
        return { output : gain }
    }
    return { set, start, buffers, play, functions }
}
