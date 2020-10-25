export function Parabola(x0,y0,vx0,vy0,scale=1){
    const lifecycle = {
        t : 0
    }
    const acceleration ={
        x : 0 * scale ,
        y : 9.8 * scale
    }
    const position = {
        x : x0,
        y : y0,
    }
    const speed = {
        x : vx0 * scale,
        y : vy0 * scale
    }
    
    function step( dt ){
        speed.x += acceleration.x * dt
        speed.y += acceleration.y * dt
        position.x += speed.x * dt
        position.y += speed.y * dt
        lifecycle.t += dt
    }
    return {
        acceleration, speed, position, lifecycle,
        step
    }
}

// const km_h = v => v/3600*1000
// const p = Parabola(0,0,km_h(10),km_h(50))

// const dt = 1/60
// for ( let i = 0 ; i < 1000000 ; i++ ){
//     console.log( [p.lifecycle.t, p.position.x, p.position.y].join("\t"))
//     const  y = p.position.y
//     if ( y < -20 ) break
//     p.step( dt )
    
// }
