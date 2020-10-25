export function Sampler( ac ){
    const buffers = new Map()
    const gain = ac.createGain()
    gain.gain.value = 1.0
    function play( name ){
        const buffer = buffers.get( name )
        const bufferSource = ac.createBufferSource()
        bufferSource.buffer = buffer
        bufferSource.connect( gain )
        bufferSource.start()
    }
    return { ac, buffers, play, gain, output : gain }
}
