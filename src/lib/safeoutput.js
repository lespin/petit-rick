export function SafeOutput ( ac ){
    // Mais c'est vrai que perso je mets souvent un passe-haut à 20 hertz
    // pour virer le continu et un passe-bas à 15 kHz pour le repliement
    // et lisser le tout.
    
    const nodes = {
        gain : ac.createGain(),
        hp : ac.createBiquadFilter(),
        lp : ac.createBiquadFilter(),
        comp : ac.createDynamicsCompressor(),
        master : ac.createGain()
    }
        
    nodes.gain.gain.value = 1
    
    nodes.hp.type = 'highpass'
    nodes.hp.frequency.value = 20

    nodes.lp.type = 'lowpass'
    nodes.lp.frequency.value = 15000
    
    nodes.master.gain.value = 0
    
    nodes.gain
        .connect( nodes.lp )
        .connect( nodes.hp )
        .connect( nodes.comp )
        .connect( nodes.master )
    

    return {
        nodes,
        input : nodes.gain,
        output : nodes.master
    }    
}
