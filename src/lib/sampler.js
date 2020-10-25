export function Sampler( ac ){
    const buffers = new Map()
    const gain = ac.createGain()
    gain.gain.value = 1.0
    function play( name ){
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
    return { ac, set, buffers, play, gain, output : gain, functions }
}
