export function CanvasContext(W,H){
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    return canvas.getContext('2d')
}
export function loadImage( imageUrl, onload ){
    const $img = new Image()
    $img.onload = () => onload($img)
    $img.src = imageUrl
}
export function loadImageToContext( imageUrl, onload ){
    const $img = new Image()
    $img.onload = function(b){
        const ctx = CanvasContext( $img.width, $img.height )
        ctx.drawImage( $img, 0, 0 )
        onload( ctx )
    }
    $img.src = imageUrl
}
export function ColorMapping(colorMap){
    return function( data ){
        for ( let i = 0 ; i < data.length ; i+= 4 ){
            const r = data[i],
                  g = data[i+1],
                  b = data[i+2]
            const col = r << 16 | g << 8 | b
            const dst = colorMap[ col ]
            if ( dst !== undefined ){
                data[i] = ( dst >> 16 ) & 0xff
                data[i+1] = ( dst >> 8 ) & 0xff
                data[i+2] = ( dst  ) & 0xff
            }
        }
    }
}
// export function ColorFilter( matrix ){
//     const [ mw, mData ] = matrix,
//           ml = matrix.length,
//           mh = ml / mw,
//           hmw = ( mw - 1 ) /2,
//           hmh = ( mh - 1 ) /2

//     return function( data, imageData ){
//         const dstData = data
//         const {width,height} = imageData

//         for ( let i = 0 ; i < ( width - mw ) ; i++ ){
//             for ( let j = hmh ; j < ( height - mh ) ; j++ ){
//                 let sumr = 0,
//                     sumg = 0,
//                     sumb = 0
//                 for ( let ii = 0 ; ii < mw ; ii++ ){
//                     for ( let jj = 0 ; jj < mw ; jj++ ){
//                         const o = 4 * ( i + ii )
//                               + 4 * ( j + jj ) * width
//                         const sr = data[ o ],
//                               sb = data[ o + 1 ],
//                               sg = data[ o + 2 ]
//                         sumr += sr
//                         sumg += sg
//                         sumb += sb
//                     }
//                 }
//                 const desto = ( i + hmw ) * 4 + ( j + hmh ) * 4 * width
//                 dstData[ desto ] = sumr
//                 dstData[ desto + 1 ] = sumg
//                 dstData[ desto + 2 ] = sumb
//             }
//         }
        
//     }
// }


export function transformCanvas( srcCtx, dstCtx, f  ){
    const {width:srcWidth,height:srcHeight} = srcCtx.canvas
    const {width:dstWidth,height:dstHeight} = dstCtx.canvas
    const imageData = srcCtx.getImageData(0,0,srcWidth,srcHeight)    
    const data = imageData.data
    if ( f ) f( data, imageData )
    dstCtx.putImageData(imageData,0,0)
}

//
// context cache...
//
const _contextes = {}
export function reusableCanvasContext(W,H){
    const key = `${W}x${H}`
    let found = _contextes[ key ]
    //found = false
    if ( found ){
        found.clearRect(0,0,W,H)
        return found
    } 
    const newContext = CanvasContext(W,H)
    _contextes[ key ] = newContext 
    return newContext
}
export function flipImageData(imageData,h=0,v=0,d=0){
    const { data, width, height } = imageData
    const srcdata = new Uint8ClampedArray( data )
    for ( let p = 0 ; p < srcdata.length ; p++ ){
        const drp = Math.floor( p / 4 ),
              dro = p % 4,
              dstx = drp % width,
              dsty = Math.floor( drp / width )
        let srcx = dstx,
            srcy = dsty
        if ( h ){
            srcx *= -1
            srcx += width - 1
        }
        if ( v ) {
            srcy *= -1
            srcy += width - 1
        }
        if ( d ){
            const sw = srcx
            srcx = srcy
            srcy = sw
        }
        const srp = srcx + srcy * width,
              sp = dro + srp * 4
        data[ p ] = srcdata[ sp ]
    }
}
export async function flipBitmap(bitmap, h=0,v=0,d=0){
    const ctx = CanvasContext( bitmap.width, bitmap.height )
    ctx.drawImage( bitmap, 0, 0 )        
    const imageData = ctx.getImageData(0,0,bitmap.width, bitmap.height)        
    flipImageData(imageData,h,v,d)
    ctx.putImageData(imageData,0,0)
    return createImageBitmap( ctx.canvas )
}
