//import xml2js from 'xml2js';
import { promisify1, promisify2, resolveAllValues } from './promise.js'
//import { distinct } from './utils.js'
/*
const parseToJs = promisify2( (...p) => {
    const parser = new xml2js.Parser();
    parser.parseString(...p)
})
*/
import { loadImage, CanvasContext, flipImageData, flipBitmap } from './image.js'
const loadImageP = promisify1( loadImage )

export async function loadTerrainTileMap( url, resolveImageName = x => x ){
    
    const xmlString = await fetch(url).then( x => x.text())
    const tmx = await parseTMX( xmlString )
   
    //
    // load, clip and flip an imageBitmap for each different tile
    //
    const imagePromises = {}
    const imageByName = {}
    const clipPromises = {}
    const clipById = {}
    const flipClipPromises = {}
    const flipClipById = {}

    tmx.layers.filter( x => x.tiles ).forEach( layer => {
        
        layer.tiles.forEach( tile => {
            const srcImageName = tile.tileset.image.source
            if ( imagePromises[ srcImageName ] === undefined ){
                imagePromises[ srcImageName ] = () => loadImageP(
                    resolveImageName( srcImageName )
                ).then( $image => imageByName[ srcImageName ] = $image )
            }
            const clipId = tile.gid
            if ( clipPromises[ clipId ] === undefined ){
                const r = tile.inTileset.rectangle
                clipPromises[  clipId ] = () => createImageBitmap(
                    imageByName[ srcImageName ], r.x,r.y,r.width,r.height
                ).then( clip => clipById[ clipId ] = clip )
            }
            const flipClipId = tile.raw
            if ( flipClipPromises[ flipClipId ] === undefined ){
                const flip = tile.flip
                flipClipPromises[ flipClipId ] = () => flipBitmap(
                    clipById[ clipId ],
                    flip.horizontally, flip.vertically, flip.diagonally
                ).then( flipClip => {
                    flipClipById[ flipClipId ] = flipClip
                })
            }
        })
    })
    await Promise.all( Object.values( imagePromises ).map( x => x() ) )
    await Promise.all( Object.values( clipPromises ).map( x => x() ) )
    await Promise.all( Object.values( flipClipPromises ).map( x => x() ) )

    tmx.layers.filter( x => x.tiles ).forEach( layer => {
        layer.tiles.forEach( tile => {
            const flipClipId = tile.raw
            tile.imageBitmap =  flipClipById[ flipClipId ]
            
        })
    })
    
    /*console.log( 'all', {
        imagePromises ,
        imageByName ,
        clipPromises ,
        clipById ,
        flipClipPromises ,
        flipClipById ,
        
    })*/
    return tmx
}


const Saxophone = require('saxophone');


export async function parseTMX( xmlString ){

    //
    //   https://doc.mapeditor.org/en/stable/reference/tmx-map-format/
    //

    const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
    const FLIPPED_VERTICALLY_FLAG   = 0x40000000
    const FLIPPED_DIAGONALLY_FLAG   = 0x20000000
    const NOT_FLIPPED = ~(FLIPPED_HORIZONTALLY_FLAG
                          | FLIPPED_VERTICALLY_FLAG
                          | FLIPPED_DIAGONALLY_FLAG)


    const parser = new Saxophone();

    function parseProperty( property ){
        const { name, type, value } = property
        let parsedValue = value
        if ( type === 'bool' ){
            parsedValue = ( value === 'true' )
        } else if ( type === 'string' ){
            parsedValue = value
        } else if ( type === 'int' ){
            parsedValue = parseInt( value )
        } else if ( type === 'float' ){
            parsedValue = parseFloat( value )
        }
        return [ name, parsedValue ]
    }
    function decodeTileUint32( i ){
        return {
            raw:i,
            gid : (i & NOT_FLIPPED),
            flip : {
                vertically : ((i & FLIPPED_VERTICALLY_FLAG)?1:0),
                horizontally : ((i &  FLIPPED_HORIZONTALLY_FLAG)?1:0),
                diagonally : ((i & FLIPPED_DIAGONALLY_FLAG)?1:0),
            },
        }
    }
    function resolveGid( tilesets, gid ){
        for (let i = tilesets.length - 1; i >= 0; --i) {
            const firstgid = tilesets[i].firstgid
            if ( firstgid <=  gid ){
                // found tileset
                return {
                    indexInTileSet : gid - firstgid,
                    tilesetIndex : i
                }
            }
        }
    }
    function parseEncodedData( data ){
        const { encoding, raw } = data
        let sequence = []
        if ( encoding === 'csv' ){
            sequence = raw.join('').split(",").map( x => parseInt(x) )
        } else if ( encoding === 'base64' ){
            const b64data = raw.join(''),
                  strdata = atob(b64data.trim())
            // Now you have an array of bytes, which should be
            // interpreted as an array of unsigned 32-bit integers
            // using little-endian byte ordering.
            for ( let i = 0 ; i < strdata.length ; i+=4){
                const cc1 = strdata.charCodeAt(i+3),
                      cc2 = strdata.charCodeAt(i+2),
                      cc3 = strdata.charCodeAt(i+1),
                      cc4 = strdata.charCodeAt(i+0),
                      index = (cc1<<24) | (cc2<<16) | (cc3 << 8) | cc4
                sequence.push( index )
            }                
        } else {
            throw new Error('encoding not supported : '+encoding)
        }
        return sequence
    }
    function decodeTilesData( data, layer, tilesets, map ){

        // decode encoded bytes
        const sequence = parseEncodedData( data )

        // helpers
        const tiles = []
        sequence.forEach( (i,index) => {
            if ( i === 0 ) return
            const coordinates = {
                i : index%(layer.width),
                j : Math.floor( index / layer.width ),
            }
            const { raw, gid, flip } = decodeTileUint32( i ),
                  { indexInTileSet, tilesetIndex } = resolveGid( tilesets, gid ),
                  tileset = tilesets[ tilesetIndex ],
                  { tilewidth, tileheight } = tileset,
                  position = {
                      // center position
                      // top left of position 0 is {x:0,y:0}
                      x : coordinates.i * tilewidth + tilewidth/2,
                      y : coordinates.j * tileheight  + tileheight/2,
                  },
                  coordinatesInSource = {
                      i : indexInTileSet % tileset.columns,
                      j : Math.floor(indexInTileSet / tileset.columns),
                  },
                  rectangleInSource = {
                      x : coordinatesInSource.i * tilewidth,
                      y : coordinatesInSource.j * tileheight,
                      width : tilewidth,
                      height : tileheight
                  },
                  p = tileset.tiles[ indexInTileSet ] || {},
                  properties = p.properties || {},
                  type = p.type

            // denormalized tile
            const tile = {
                raw,
                gid,
                flip,
                type,
                properties,
                layer,
                inLayer : {
                    index,
                    coordinates,
                    position,
                },
                tilesetIndex,
                tileset,
                inTileset : {
                    index : indexInTileSet,
                    coordinates : coordinatesInSource,
                    rectangle : rectangleInSource,
                },
            }
            tiles.push( tile )
        })
        return tiles
    }
    
    let parsed = {}
    const stack = []
    parser.on('tagopen', tag => {
//        console.log('open',tag.name,stack,tag)
        const tagName = tag.name
        const $ = Saxophone.parseAttrs(tag.attrs)

        let stackElement
        if ( tagName === 'map' ){
            const map = {
                CLASS : 'map',
                ...$, 
                width : parseInt( $.width ),
                height : parseInt( $.height),
                tilewidth : parseInt( $.tilewidth ),
                tileheight : parseInt( $.tileheight ),
                infinite : parseInt( $.infinite ),
                tilesets : [],
                layers : []
            }
            stackElement = map
            parsed = map
        } else if ( tagName === 'tileset' ){
            const map = stack[ stack.length - 1 ],
                  tilesets = map.tilesets
            const tileset = {
                CLASS : 'tileset',
                ...$,
                firstgid : parseInt( $.firstgid ),
                tilewidth : parseInt( $.tilewidth ),
                tileheight : parseInt( $.tileheight ),
                tilecount : parseInt( $.tilecount ),
                columns : parseInt( $.columns ),
                tiles : {}
            }
            tilesets.push( tileset )
            stackElement = tileset
        } else if ( tagName === 'image' ){
            const tileset = stack[ stack.length - 1 ]
            const image = {
                CLASS : 'image',
                ...$,
                width : parseInt( $.width ),
                height : parseInt( $.height),
            }
            tileset.image = image
            stackElement = image                
        } else if ( tagName === 'tile' ){
            const tileset = stack[ stack.length - 1 ],
                  tiles = tileset.tiles
            const id = parseInt( $.id )
            const tile = {
                CLASS : 'tile',
                ...$,
                id,
            }
            tiles[ id ] = tile 
            stackElement = tile
        } else if ( tagName === 'layer' ){
            const map = stack[ stack.length - 1 ],
                  layers = map.layers
            const layer = {
                CLASS : 'layer',
                ...$,
                id : parseInt( $.id ),
                width : parseInt( $.width ),
                height : parseInt( $.height),
                properties : {},
            }
            layers.push( layer )
            stackElement = layer
        } else if ( tagName === 'objectgroup' ){
            const map = stack[ stack.length - 1 ],
                  layers = map.layers
            const objectgroup = {
                CLASS : 'objectgroup',
                ...$,
                objects : [],
                properties : {},
            }
            layers.push( objectgroup )
            stackElement = objectgroup
        } else if ( tagName === 'object' ){
            const objectgroup = stack[ stack.length - 1 ],
                  objects = objectgroup.objects
            const object = {
                CLASS : 'object',
                ...$,
                id : parseInt( $.id ),
                x : parseFloat( $.x ),
                y : parseFloat( $.y),
                properties : {},
            }
            objects.push( object )
            stackElement = object
        } else if ( tagName === 'properties' ){
            const parent = stack[ stack.length - 1 ]
            const properties = {
                CLASS : 'properties',
                ...$,
            }
            parent.properties = properties
            stackElement = properties
        } else if ( tagName === 'property' ){
            // parse to js value
            const properties = stack[ stack.length - 1 ]
            const [ name, parsedValue ] = parseProperty($)
            properties[ name ] = parsedValue
            stackElement = {}
        } else if ( tagName === 'data' ){
            const parent = stack[ stack.length - 1 ]
            const data = {
                CLASS : 'data',
                ...$,
                raw : []
            }
            parent.data = data
            stackElement = data
        } else {
            throw new Error( 'unrecognized tag '+tagName )
        }
        if ( !tag.isSelfClosing ){            
            stack.push( stackElement )
        }
//        console.log('=>',stack)
    });
    parser.on('text', ({contents}) => {
        const parent = stack[ stack.length - 1 ]
        const txt = contents.trim()
        if ( txt.length && parent )
            parent.raw.push( txt )

    })
    parser.on('tagclose', tag => {
//        console.log('close',tag.name,stack)
        const top = stack.pop()

        if ( top.raw ){
            // tile data
            const data = top,
                  layerParent = stack[ stack.length - 1 ],
                  mapParent = stack[ 0 ],
                  tilesets = mapParent.tilesets
            
            if ( data && layerParent && mapParent && tilesets ){
                layerParent.tiles = decodeTilesData(
                    data, layerParent, tilesets, mapParent
                )
            }
        }
        
    })
    parser.on('finish', () => {
        // console.log('Parsing finished.');
    });
    parser.parse( xmlString )
    return parsed
}
