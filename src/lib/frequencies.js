export function ftok( f ){
    return 69 + 12 * Math.log2( f / 440 )
}
export function ktof( k ) {
    return Math.pow(2,(k-69)/12) * 440
}
export function itrvstot( itrvs, t0 ){
    return itrvs.reduce( (r,x) => {
        return [ ...r, r[r.length-1] + x ]
    },[t0])
}

export function binToFrequency( bin, sampleRate, fftSize ){
    return bin * sampleRate / fftSize
}
export function frequencyToBin( frequency, sampleRate, fftSize ){
    return frequency / sampleRate * fftSize
}
