import { lerp } from './lib/utils'

export function VisibleCalculation( operations ){
    const { subOperations, totalOperation, movingValue } = operations

    function at( a ) {
        const i = movingValue( a )
        let total = 0
        const subOpStrings = subOperations.map( ({compute,display}) => {
            const subTotal = compute( i )
            const subString = display( i, subTotal )
            return subString
        })
        const strings = [
            ...subOpStrings,
            totalOperation.display(totalOperation.compute(i))
        ].join("\n")
        return strings
    }
    
    return { at }
}
export function LevelScoreVisibleCalculation( world ){
    function padNum( p ){
        return d => d.toString(10).padStart(p,'0')
    }
    function padNumFromString( s ){
        return padNum( s.toString().length )
    }

    const pads = {
        remain : padNumFromString(world.initialCountdown),
        nplayer : padNumFromString(world.initialNPlayers),
        ntreasure : padNumFromString(world.nTreasure)
    }
    const operations = {
        movingValue : a => Math.floor( lerp(0,world.countdown,a) ),
        totalOperation : {
            compute : (i) => Math.floor(
                ( i * 2 * world.nPlayers + i * world.nTreasureFound )
                    / world.scoreDivider
            ),
            display : (result) => `\nscore\n${ result }`
        },
        subOperations : [{
            compute : (i) => Math.floor(
                ( i * 2 * world.nPlayers )
                    / world.scoreDivider
            ) ,
            display : (i,result) => {
                const remain = pads.remain( world.countdown - i ),
                      nPlayers = pads.nplayer( world.nPlayers )
                    return `${ world.nPlayers } alive (x2)\n${ result }`
            }
        },{
            compute : (i) => Math.floor(
                ( i * world.nTreasureFound )
                    / world.scoreDivider
            ),
            display : (i,result) => {
                const remain = pads.remain( world.countdown - i ),
                      nTreasureFound = pads.ntreasure(world.nTreasureFound)
                    return `${ world.nTreasureFound } found (x1)\n${ result }`
            }
        }]
    }

    const vc = VisibleCalculation(operations)
    return vc 
}
// const world = {
//     initialCountdown : 5000,
//     initialNPlayers : 3,
//     nTreasure : 4,
//     countdown : 34,
//     nPlayers : 4,
//     nTreasureFound : 2,
// }

// const vc = LevelScoreVisibleCalculation( world )
// const nSteps = 48
// for ( let step = 0 ; step <=  nSteps ; step++ ){
//     const a = step/nSteps
//     console.log('---')
//     console.log(vc.at(a))
// }
